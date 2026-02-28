import OpenAI from 'openai';
import { fetchProducts, fetchProductById, fetchProductsByCategory, fetchOrders, searchProducts, fetchRandomProducts, type Product } from './api';
import { supabase } from './supabase';
import { requestTossPayment, generateOrderId } from './tossPayment';

// 챗봇에서 사용할 현재 사용자 이메일 전역 변수
export let currentUserEmail: string | null = null;

// 현재 사용자 이메일 설정 함수
export const setCurrentUserEmail = (email: string | null) => {
  currentUserEmail = email;
};

// 마지막 검색 결과를 저장하는 전역 변수 (사용자가 "1번", "2번" 등으로 참조하기 위함)
export let lastSearchResults: Array<Product & { stock?: number }> = [];

/**
 * 챗봇 시작 시 로그인 정보를 확인하는 함수
 * 확인 순서:
 * 1. localStorage에서 user 또는 userInfo 찾기
 * 2. sessionStorage에서 user 또는 userInfo 찾기
 * 3. Supabase Auth 세션에서 user.email 찾기
 */
export const checkUserLogin = async () => {
  let foundEmail: string | null = null;

  // 1. localStorage에서 user 또는 userInfo 찾기
  try {
    const localUser = localStorage.getItem('user');
    const localUserInfo = localStorage.getItem('userInfo');
    
    if (localUser) {
      try {
        const parsed = JSON.parse(localUser);
        foundEmail = parsed.email || parsed.user?.email || null;
      } catch {
        // JSON 파싱 실패 시 문자열로 처리
        if (localUser.includes('@')) {
          foundEmail = localUser;
        }
      }
    }
    
    if (!foundEmail && localUserInfo) {
      try {
        const parsed = JSON.parse(localUserInfo);
        foundEmail = parsed.email || parsed.user?.email || null;
      } catch {
        // JSON 파싱 실패 시 문자열로 처리
        if (localUserInfo.includes('@')) {
          foundEmail = localUserInfo;
        }
      }
    }
  } catch (error) {
    console.warn('localStorage 확인 중 오류:', error);
  }

  // 2. sessionStorage에서 user 또는 userInfo 찾기
  if (!foundEmail) {
    try {
      const sessionUser = sessionStorage.getItem('user');
      const sessionUserInfo = sessionStorage.getItem('userInfo');
      
      if (sessionUser) {
        try {
          const parsed = JSON.parse(sessionUser);
          foundEmail = parsed.email || parsed.user?.email || null;
        } catch {
          // JSON 파싱 실패 시 문자열로 처리
          if (sessionUser.includes('@')) {
            foundEmail = sessionUser;
          }
        }
      }
      
      if (!foundEmail && sessionUserInfo) {
        try {
          const parsed = JSON.parse(sessionUserInfo);
          foundEmail = parsed.email || parsed.user?.email || null;
        } catch {
          // JSON 파싱 실패 시 문자열로 처리
          if (sessionUserInfo.includes('@')) {
            foundEmail = sessionUserInfo;
          }
        }
      }
    } catch (error) {
      console.warn('sessionStorage 확인 중 오류:', error);
    }
  }

  // 3. Supabase Auth 세션에서 user.email 찾기
  if (!foundEmail) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!error && session?.user?.email) {
        foundEmail = session.user.email;
      }
    } catch (error) {
      console.warn('Supabase 세션 확인 중 오류:', error);
    }
  }

  // 결과 처리
  if (foundEmail) {
    currentUserEmail = foundEmail;
    console.log(`로그인 이메일: ${foundEmail}`);
  } else {
    currentUserEmail = null;
    console.log('로그인 정보 없음');
  }

  return foundEmail;
};

// API 키 가져오기
const getApiKey = () => {
  return import.meta.env.VITE_OPENAI_API_KEY;
};

// OpenAI 클라이언트 초기화
const getOpenAIClient = () => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('OpenAI API key가 설정되지 않았습니다.');
    return null;
  }

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // 브라우저에서 사용하기 위한 설정
  });
};

// Function Calling을 위한 함수 정의
const getFunctionDefinitions = () => [
  {
    type: 'function' as const,
    function: {
      name: 'search_products',
      description: '사용자가 상품 이름을 말하거나 특정 상품을 찾고 있을 때 Supabase products 테이블에서 검색합니다. 예: "플래너", "타이머", "간식" 등 상품 이름이나 키워드를 입력하면 해당하는 상품들을 찾아줍니다. 사용자가 "~ 찾아줘", "~ 있어?", "~ 상품 알려줘" 같은 질문을 할 때 이 함수를 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: '검색할 상품 이름이나 키워드 (예: "플래너", "타이머", "간식 키트")',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_product_details',
      description: '특정 상품의 전체 상세 정보를 가져옵니다. 사용자가 "상세정보", "자세히 보기", "상세 보기", "더 자세히", "자세한 정보", "상품 정보", "이 상품 자세히", "1번 상품 자세히", "플래너 상세정보" 같은 상세정보나 자세히 보기 요청을 할 때 사용하세요. 이미지, 이름, 가격, 재고, 설명을 모두 보여줍니다.',
      parameters: {
        type: 'object',
        properties: {
          product_id: {
            type: 'number',
            description: '상품 ID (lastSearchResults 배열의 인덱스를 사용하여 찾을 수 있음, 예: "1번" → lastSearchResults[0].id 또는 직접 상품 ID 전달)',
          },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_products_by_category',
      description: '카테고리별로 상품 목록을 가져옵니다. 사용자가 특정 카테고리의 상품을 찾고 있을 때 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '상품 카테고리 (예: Stationery, Tech, Digital, Food, Living)',
            enum: ['Stationery', 'Tech', 'Digital', 'Food', 'Living'],
          },
        },
        required: ['category'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_all_products',
      description: '모든 상품 목록을 가져옵니다. 사용자가 전체 상품 목록을 요청할 때 사용하세요.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_order_status',
      description: '사용자의 주문 내역을 조회합니다. 사용자가 주문 상태를 물어볼 때 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          user_id: {
            type: 'string',
            description: '사용자 ID',
          },
        },
        required: ['user_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_orders',
      description: '주문 내역을 조회합니다. 사용자가 "주문 내역", "주문 조회", "내 주문", "주문 확인", "주문 목록", "주문 내역 보여줘" 같은 표현을 사용할 때만 사용하세요. 절대 결제창을 열지 않습니다. 주문을 생성하거나 결제를 진행하는 것이 아닙니다.',
      parameters: {
        type: 'object',
        properties: {
          customer_email: {
            type: 'string',
            description: '고객 이메일 (AI가 물어봐서 받음, 선택사항)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_recommendations',
      description: '상품을 랜덤으로 추천합니다. 사용자가 "추천해줘", "추천 상품 보여줘", "뭐가 좋을까?", "추천해주세요", "인기 상품", "추천 상품", "추천", "뭘 살까?", "어떤 게 좋아?" 같은 상품 추천 요청을 할 때 사용하세요. 특정 카테고리를 언급하면 해당 카테고리에서 추천하고, 언급하지 않으면 전체 상품에서 랜덤으로 3개를 추천합니다.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: '상품 카테고리 (선택사항, 예: Stationery, Tech, Digital, Food, Living). 사용자가 특정 카테고리를 언급했으면 해당 카테고리 안에서, 언급하지 않았으면 전체에서 랜덤 추출',
            enum: ['Stationery', 'Tech', 'Digital', 'Food', 'Living'],
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_stock',
      description: '상품의 재고 수량을 확인합니다. 사용자가 "티셔츠 재고", "플래너 재고 있어?", "재고 확인", "재고 얼마나 있어?", "남은 수량", "재고 수량", "재고 있나요?", "재고 없어?", "품절이야?", "재고 상태", "몇 개 남았어?", "수량 확인" 같은 재고나 남은 수량을 물어볼 때 사용하세요.',
      parameters: {
        type: 'object',
        properties: {
          product_name: {
            type: 'string',
            description: '재고를 확인할 상품 이름 (예: "티셔츠", "플래너", "타이머"). 사용자가 언급한 상품 이름을 그대로 사용하세요.',
          },
        },
        required: ['product_name'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_order',
      description: '상품을 주문하고 결제를 진행합니다. 사용자가 "주문해줘", "주문하고 싶어", "구매하고 싶어", "결제하고 싶어", "살래", "사고 싶어" 같은 주문/구매 의사를 명확히 표현할 때만 사용하세요. 주문 조회 요청에는 절대 사용하지 마세요. 이 함수는 결제창을 엽니다. 예: "1번 상품 2개 주문해줘", "플래너 1개 주문하고 싶어" 등. product_id는 lastSearchResults 배열의 인덱스를 사용하여 찾아야 합니다 (예: "1번" → lastSearchResults[0].id). 모든 파라미터는 대화를 통해 사용자에게 물어보고 수집해야 합니다.',
      parameters: {
        type: 'object',
        properties: {
          product_id: {
            type: 'number',
            description: '상품 ID (AI가 "1번"을 숫자로 변환해서 전달. lastSearchResults 배열에서 찾아야 함)',
          },
          quantity: {
            type: 'number',
            description: '주문 수량 (AI가 "2개"를 숫자로 변환)',
          },
          customer_email: {
            type: 'string',
            description: '고객 이메일 (AI가 물어봐서 받음, 선택사항)',
          },
          customer_name: {
            type: 'string',
            description: '고객 이름 (AI가 물어봐서 받음, 선택사항)',
          },
        },
        required: [],
      },
    },
  },
];

// 함수 실행 함수들
const executeFunction = async (functionName: string, args: any, userId?: string): Promise<any> => {
  try {
    switch (functionName) {
      case 'search_products': {
        const query = args.query as string;
        if (!query || query.trim() === '') {
          return { success: false, message: '검색어를 입력해주세요.' };
        }
        
        // Supabase에서 직접 검색
        const products = await searchProducts(query);
        
        // 검색 결과를 전역 변수에 저장 (사용자가 "1번", "2번" 등으로 참조하기 위함)
        lastSearchResults = products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          description: p.description,
          category: p.category,
          tags: p.tags || [],
          image_url: p.image_url || '',
          stock: (p as any).stock ?? 0, // 재고 수량 추가
        }));
        
        return {
          success: true,
          products: lastSearchResults,
          count: lastSearchResults.length,
          query: query,
        };
      }

      case 'get_product_details': {
        const productId = args.product_id as number;
        const product = await fetchProductById(productId);
        if (!product) {
          return { success: false, message: '상품을 찾을 수 없습니다.' };
        }

        const stock = (product as any).stock ?? 0;
        
        // 상품 전체 정보를 products 배열로 반환 (카드로 표시하기 위함)
        const productDetails = {
          id: product.id,
          name: product.name,
          price: product.price,
          description: product.description,
          category: product.category,
          tags: product.tags || [],
          image_url: product.image_url || '',
          stock: stock,
        };

        return {
          success: true,
          message: '주문하시겠어요?',
          product: productDetails,
          products: [productDetails], // 카드로 표시하기 위해 배열로 반환
        };
      }

      case 'get_products_by_category': {
        const category = args.category as string;
        const products = await fetchProductsByCategory(category);
        return {
          success: true,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
          })),
          category,
          count: products.length,
        };
      }

      case 'get_all_products': {
        const products = await fetchProducts();
        return {
          success: true,
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
            category: p.category,
            image_url: p.image_url || '',
            tags: p.tags || [],
          })),
          count: products.length,
        };
      }

      case 'get_recommendations': {
        const category = args.category as string | undefined;
        
        try {
          // 랜덤 상품 3개 가져오기
          const products = await fetchRandomProducts(3, category);
          
          if (!products || products.length === 0) {
            return {
              success: true,
              message: category ? `${category} 카테고리에 상품이 없어요` : '추천할 상품이 없어요',
              products: [],
              count: 0,
            };
          }

          // 추천 결과를 전역 변수에 저장 (사용자가 "1번", "2번" 등으로 참조하기 위함)
          const recommendationResults = products.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            description: p.description,
            category: p.category,
            tags: p.tags || [],
            image_url: p.image_url || '',
            stock: (p as any).stock ?? 0,
          }));
          
          lastSearchResults = recommendationResults;

          return {
            success: true,
            message: '이런 상품 어떠세요?',
            products: recommendationResults,
            count: recommendationResults.length,
            category: category || '전체',
          };
        } catch (error: any) {
          console.error('추천 상품 가져오기 오류:', error);
          return {
            success: false,
            message: '추천 상품을 가져오는 중 오류가 발생했습니다.',
            error: error?.message,
          };
        }
      }

      case 'check_stock': {
        const productName = args.product_name as string;
        
        if (!productName || productName.trim() === '') {
          return {
            success: false,
            message: '상품 이름을 입력해주세요.',
          };
        }

        try {
          // 상품 이름으로 검색
          const products = await searchProducts(productName.trim());
          
          if (!products || products.length === 0) {
            return {
              success: false,
              message: `"${productName}" 상품을 찾을 수 없어요`,
            };
          }

          // 첫 번째 검색 결과 사용 (가장 관련성 높은 상품)
          const product = products[0];
          const stock = (product as any).stock ?? 0;
          
          // 재고 상태 메시지 생성
          const stockMessage = stock > 0 
            ? `${product.name}: 재고 ${stock}개`
            : `${product.name}: 품절`;

          return {
            success: true,
            message: stockMessage,
            product: {
              id: product.id,
              name: product.name,
              stock: stock,
            },
          };
        } catch (error: any) {
          console.error('재고 확인 오류:', error);
          return {
            success: false,
            message: '재고를 확인하는 중 오류가 발생했습니다.',
            error: error?.message,
          };
        }
      }

      case 'get_order_status': {
        if (!userId) {
          return { success: false, message: '로그인이 필요합니다.' };
        }
        const orders = await fetchOrders(userId);
        return {
          success: true,
          orders: orders.map((o) => ({
            order_number: o.order_number,
            total_amount: o.total_amount,
            status: o.status,
            created_at: o.created_at,
          })),
          count: orders.length,
        };
      }

      case 'get_orders': {
        console.log('[get_orders] 주문 조회 시작');
        const customerEmail = args.customer_email as string | undefined;

        // 1. 이메일 결정: customer_email이 있으면 사용, 없으면 currentUserEmail 사용
        const finalEmail = customerEmail || currentUserEmail;
        console.log('[get_orders] 사용할 이메일:', finalEmail);

        // 2. 이메일 없으면 에러 반환
        if (!finalEmail) {
          console.warn('[get_orders] 이메일이 없음');
          return {
            success: false,
            message: '이메일을 알려주세요.',
          };
        }

        // 3. orders 테이블에서 customer_email로 직접 조회 (최신 주문이 먼저 보이게 정렬)
        try {
          console.log('[get_orders] customer_email로 조회 시도:', finalEmail);
          // 먼저 customer_email로 조회 시도
          let { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('customer_email', finalEmail)
            .order('created_at', { ascending: false });

          console.log('[get_orders] customer_email 조회 결과:', { 
            ordersCount: orders?.length || 0, 
            error: ordersError?.message 
          });

          // customer_email로 조회 실패하거나 결과가 없으면 customer_id로 재시도
          if ((ordersError || !orders || orders.length === 0)) {
            console.log('[get_orders] customer_id로 재조회 시도');
            // customers 테이블에서 customer_id 찾기
            const { data: customerData, error: customerError } = await supabase
              .from('customers')
              .select('id')
              .eq('email', finalEmail)
              .maybeSingle();

            console.log('[get_orders] customer 조회 결과:', { 
              customerId: customerData?.id, 
              error: customerError?.message 
            });

            if (!customerError && customerData?.id) {
              // customer_id로 재조회
              const { data: ordersById, error: idError } = await supabase
                .from('orders')
                .select('*')
                .eq('customer_id', customerData.id)
                .order('created_at', { ascending: false });

              console.log('[get_orders] customer_id 조회 결과:', { 
                ordersCount: ordersById?.length || 0, 
                error: idError?.message 
              });

              if (!idError && ordersById) {
                orders = ordersById;
                ordersError = null;
              }
            }
          }

          if (ordersError) {
            console.error('[get_orders] orders 테이블 조회 오류:', ordersError);
            return {
              success: false,
              message: `주문 내역을 불러오는 중 오류가 발생했습니다: ${ordersError.message}`,
            };
          }

          // 4. 주문 없으면 메시지 반환
          if (!orders || orders.length === 0) {
            console.log('[get_orders] 주문 내역 없음');
            return {
              success: true,
              message: '주문 내역이 없어요',
              orders: [],
              count: 0,
            };
          }

          // 5. 주문 있으면 리스트 형태로 보기 좋게 표시
          console.log('[get_orders] 주문 내역 찾음:', orders.length, '개');
          const formattedOrders = orders.map((order: any) => ({
            order_number: order.order_number,
            total_amount: order.total_amount,
            status: order.status,
            created_at: order.created_at,
            shipping_address: order.shipping_address,
            phone: order.phone,
          }));

          return {
            success: true,
            message: `총 ${orders.length}개의 주문 내역이 있습니다.`,
            orders: formattedOrders,
            count: orders.length,
          };
        } catch (error: any) {
          console.error('[get_orders] 주문 조회 중 예외 발생:', error);
          return {
            success: false,
            message: `주문 내역을 불러오는 중 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`,
          };
        }
      }

      case 'create_order': {
        const productId = args.product_id as number;
        const quantity = args.quantity as number;
        const customerEmail = args.customer_email as string | undefined;
        const customerName = args.customer_name as string | undefined;

        // 1. 이메일 결정: customer_email이 있으면 그거 사용, 없으면 currentUserEmail 사용
        const finalEmail = customerEmail || currentUserEmail;
        
        // 2. 이메일이 둘 다 없으면 에러 반환
        if (!finalEmail) {
          return { 
            success: false, 
            message: '이메일을 알려주세요.' 
          };
        }

        // 3. customers 테이블에서 이메일로 조회
        let customerData: any = null;
        try {
          const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('email', finalEmail)
            .single();

          if (!error && data) {
            customerData = data;
          }
        } catch (error) {
          console.warn('customers 테이블 조회 중 오류:', error);
        }

        // 4. 이름 결정: customers에서 찾은 이름 사용, 없으면 customer_name 사용
        const finalName = customerData?.name || customerName;

        // 5. 이름도 없으면 에러 반환
        if (!finalName) {
          return { 
            success: false, 
            message: '이름을 알려주세요.' 
          };
        }

        // 6. product_id로 products 테이블 조회
        const product = await fetchProductById(productId);
        
        // 7. 상품 없으면 에러 반환
        if (!product) {
          return {
            success: false,
            message: '상품을 찾을 수 없어요',
          };
        }

        // 8. 재고 확인
        const stock = (product as any).stock ?? 0;
        if (stock < quantity) {
          return {
            success: false,
            message: `재고가 부족해요 (현재 재고: ${stock}개)`,
          };
        }

        // 9. 총 금액 계산
        const totalPrice = product.price * quantity;

        // 주문 정보 객체 생성
        const orderInfo = {
          customer_name: finalName,
          customer_email: finalEmail,
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          total_price: totalPrice,
          status: 'pending' as const,
        };

        // 10. 토스페이먼츠 결제 진행
        try {
          const orderId = generateOrderId();
          const orderName = `${product.name} ${quantity}개`;

          // 주문 정보를 sessionStorage에 저장 (결제 성공 시 사용)
          const orderData = {
            orderId,
            customer_email: finalEmail,
            customer_name: finalName,
            totalAmount: totalPrice,
            items: [{
              product_id: product.id,
              product_name: product.name,
              product_price: product.price,
              quantity: quantity,
            }],
            orderName,
          };
          sessionStorage.setItem(`order_${orderId}`, JSON.stringify(orderData));

          // 토스페이먼츠 결제 요청
          await requestTossPayment({
            amount: totalPrice,
            orderId,
            orderName,
            customerName: finalName,
            customerEmail: finalEmail,
            successUrl: `${window.location.origin}/payment/success?orderId=${orderId}`,
            failUrl: `${window.location.origin}/payment/fail?orderId=${orderId}`,
          });

          // 결제 창이 열렸으므로 성공 메시지 반환
          return {
            success: true,
            message: `결제 창이 열렸습니다. 결제를 완료해주세요.`,
            order: orderInfo,
            payment_initiated: true,
          };
        } catch (error: any) {
          // 결제 실패 시
          console.error('결제 오류:', error);
          return {
            success: false,
            message: '결제가 취소되었습니다',
            error: error?.message || '결제 중 오류가 발생했습니다.',
          };
        }
      }

      default:
        return { success: false, message: `알 수 없는 함수: ${functionName}` };
    }
  } catch (error: any) {
    console.error(`함수 실행 오류 (${functionName}):`, error);
    return { success: false, message: error.message || '함수 실행 중 오류가 발생했습니다.' };
  }
}

/**
 * OpenAI GPT-4o-mini 모델을 사용하여 채팅 응답 생성 (Function Calling 지원)
 * 모델이 존재하지 않을 경우 gpt-3.5-turbo로 대체 시도
 */
export interface ChatResponse {
  text: string;
  products?: Product[];
}

export async function getChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system' | 'function' | 'tool'; content?: string | null; name?: string; function_call?: any; tool_calls?: any[]; tool_call_id?: string }>,
  userId?: string
): Promise<ChatResponse> {
  const client = getOpenAIClient();
  
  if (!client) {
    return { text: "죄송합니다. OpenAI API 키가 설정되지 않아 응답을 생성할 수 없습니다. 😅" };
  }

  // 사용할 모델 목록 (우선순위 순)
  const models = ['gpt-4o-mini', 'gpt-3.5-turbo'];
  const tools = getFunctionDefinitions();
  
  // currentUserEmail 값에 따라 시스템 프롬프트 동적으로 생성
  const getSystemPrompt = () => {
    const basePrompt = '당신은 Timeline 쇼핑몰의 친절한 고객 서비스 챗봇입니다. 상품 정보, 배송, 환불, 주문 등에 대해 도움을 드립니다. 항상 친절하고 정중하게 답변해주세요. 한국어로 답변해주세요. 상품 정보가 필요할 때는 반드시 함수를 호출하여 정확한 정보를 제공하세요.\n\n상품 추천 함수(get_recommendations)를 호출한 경우, 응답에 "이런 상품 어떠세요?" 또는 "이런 상품은 어떠신가요?" 같은 멘트를 포함해주세요.';
    
    const orderRules = `
주문 처리 규칙:
0. 주문 조회 vs 주문 생성 구분:
   - 사용자가 "주문 내역", "주문 조회", "내 주문", "주문 확인", "주문 목록", "주문 내역 보여줘", "주문 내역 조회" 같은 표현을 사용하면 → get_orders 함수를 호출 (결제창을 열지 않음)
   - 사용자가 "주문해줘", "주문하고 싶어", "구매하고 싶어", "결제하고 싶어", "살래", "사고 싶어" 같은 표현을 사용하면 → create_order 함수를 호출 (결제창을 열음)
   - 절대 주문 조회 요청에 create_order를 호출하지 마세요
   - 절대 주문 조회 요청에 결제창을 열지 마세요

1. 번호 인식 규칙:
   - 직전에 상품 목록을 보여줬으면 (search_products, get_recommendations, get_products_by_category 등의 결과):
   - 사용자가 "첫 번째", "1번"이라고 하면 → 목록 첫 번째 상품 (lastSearchResults[0]의 id를 product_id로 사용)
   - 사용자가 "두 번째", "2번"이라고 하면 → 목록 두 번째 상품 (lastSearchResults[1]의 id를 product_id로 사용)
   - 사용자가 "세 번째", "3번"이라고 하면 → 목록 세 번째 상품 (lastSearchResults[2]의 id를 product_id로 사용)
   - 이 패턴을 계속 적용 (n번 또는 n번째 → lastSearchResults[n-1]의 id)
   - lastSearchResults가 비어있으면 "먼저 상품을 검색해주세요"라고 안내
   - 상품 목록을 보여준 직후에는 사용자가 번호로 언급하면 자동으로 해당 상품으로 처리

2. 지시어 인식 규칙:
   - 사용자가 "그거", "그 상품", "이거", "이 상품", "거기", "그것" 같은 지시어를 사용하면:
   - 직전 대화에서 언급된 상품으로 자동 해석
   - 대화 기록을 확인하여 가장 최근에 언급된 상품을 찾아서 사용
   - lastSearchResults 배열에서 찾거나, 대화 내용에서 상품 이름을 추출하여 검색
   - 어떤 상품인지 전혀 알 수 없을 때만 "어떤 상품을 말씀하시는 건가요?" 한 번만 물어보기
   - 반복해서 물어보지 말고, 가능한 한 맥락에서 추론하여 처리

3. 수량 인식 규칙:
   - "1개", "한 개", "하나" → quantity: 1
   - "2개", "두 개", "둘" → quantity: 2
   - "3개", "세 개", "셋" → quantity: 3
   - "4개", "네 개", "넷" → quantity: 4
   - 숫자와 "개"가 함께 언급되면 그 숫자를 quantity로 사용

4. 가격 정렬 규칙:
   - 사용자가 "저렴한", "싼", "가격 낮은", "싼 거" 같은 표현을 사용하면 → 가격 오름차순으로 정렬하여 보여주기
   - 사용자가 "비싼", "프리미엄", "가격 높은", "비싼 거" 같은 표현을 사용하면 → 가격 내림차순으로 정렬하여 보여주기
   - search_products나 get_all_products 함수 호출 시 가격 정렬 요청이 있으면 결과를 정렬하여 반환

5. 전체 상품 조회 규칙:
   - 사용자가 "뭐 있어?", "어떤 거 있어?", "상품 뭐 있나요?", "판매하는 거 뭐 있어?" 같은 전체 상품 조회 요청을 하면 → get_all_products 함수를 호출

6. 예외 처리:
   - create_order 함수를 호출하기 전에 lastSearchResults가 비어있는지 확인
   - 비어있으면 "먼저 상품을 검색해주세요"라고 사용자에게 안내
   - 번호로 상품을 지정할 때는 반드시 lastSearchResults 배열의 인덱스를 사용하여 product_id를 찾아야 함

6. 재고 부족 처리:
   - create_order 함수를 호출했는데 재고가 부족하면 (stock < quantity):
   - 현재 재고 수량을 명확히 알려주기 (예: "현재 재고는 5개예요")
   - 사용자에게 선택권을 주기: "재고만큼만 주문하시겠어요?" 또는 "비슷한 상품 찾아드릴까요?" 둘 중 하나를 제안
   - 사용자의 선택에 따라 적절히 처리

검색 처리 규칙:
1. 검색 결과가 비어있을 때:
   - search_products 함수를 호출했는데 결과가 비어있으면, 검색어를 단어 단위로 쪼개서 다시 검색 시도
   - 예: "플래너 세트" → "플래너", "세트"로 각각 검색
   - 그래도 결과가 없으면 "이건 없지만 비슷한 상품 보여드릴게요!"라고 말하고 관련 키워드로 재검색
   - 관련 키워드 예: "플래너" → "노트", "다이어리", "일기장" 등 유사한 키워드로 재검색
   - 사용자에게 친절하게 대안을 제시하세요

고객 서비스 규칙:
1. 도움이 안 될 때:
   - 어떻게 해도 도움이 안 되거나 명확한 답변을 드릴 수 없을 때는 절대 "모르겠어요"로 끝내지 마세요
   - 반드시 "고객센터(1234-5678)로 연락주세요!" 또는 "더 자세한 도움이 필요하시면 고객센터(1234-5678)로 연락주세요!"라고 안내
   - 사용자에게 항상 해결 방법을 제시하세요`;
    
    if (currentUserEmail) {
      // 로그인 상태: 이메일이 이미 확인됨
      return `${basePrompt}\n\n사용자 이메일은 이미 확인되었습니다: ${currentUserEmail} 이메일을 다시 묻지 마세요. customers 테이블에 이 이메일이 없으면 이름만 물어보세요.\n\n${orderRules}`;
    } else {
      // 비로그인 상태: 주문 시 이메일 먼저 물어보기
      return `${basePrompt}\n\n주문할 때 이메일을 먼저 물어보세요. 그 이메일로 customers 테이블을 조회해서 고객 정보가 없으면 이름도 물어보세요.\n\n${orderRules}`;
    }
  };
  
  for (const model of models) {
    try {
      // 최대 3번의 함수 호출 라운드 허용
      let currentMessages = [...messages];
      let functionCallCount = 0;
      const maxFunctionCalls = 3;

      while (functionCallCount < maxFunctionCalls) {
        const completion = await client.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: getSystemPrompt(),
            },
            ...currentMessages,
          ],
          tools: tools,
          tool_choice: 'auto', // AI가 필요할 때 함수를 자동으로 호출
          temperature: 0.7,
          max_tokens: 1000,
        });

        const message = completion.choices[0]?.message;
        
        // 함수 호출이 있는 경우
        if (message?.tool_calls && message.tool_calls.length > 0) {
          // 함수 호출 결과를 메시지에 추가
          currentMessages.push({
            role: 'assistant',
            content: message.content || null,
            tool_calls: message.tool_calls,
          });

          // 각 함수 호출 실행
          for (const toolCall of message.tool_calls) {
            const functionName = toolCall.function.name;
            let functionArgs: any;
            
            try {
              functionArgs = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              console.error('함수 인자 파싱 오류:', e);
              console.error('원본 인자:', toolCall.function.arguments);
              functionArgs = {};
            }

            try {
              // 함수 실행
              const functionResult = await executeFunction(functionName, functionArgs, userId);
              
              // 함수 결과를 메시지에 추가 (OpenAI API 형식 - tool role 사용)
              currentMessages.push({
                role: 'tool',
                content: JSON.stringify(functionResult),
                tool_call_id: toolCall.id,
              } as any);
            } catch (funcError: any) {
              console.error(`함수 ${functionName} 실행 중 오류:`, funcError);
              // 함수 실행 실패 시 오류 정보를 포함하여 메시지 추가
              currentMessages.push({
                role: 'tool',
                content: JSON.stringify({
                  success: false,
                  message: funcError?.message || '함수 실행 중 오류가 발생했습니다.',
                  error: funcError?.toString(),
                }),
                tool_call_id: toolCall.id,
              } as any);
            }
          }

          functionCallCount++;
          continue; // 함수 결과를 포함하여 다시 API 호출
        }

        // 함수 호출이 없고 일반 응답이 있는 경우
        const response = message?.content;
        
        if (!response) {
          break; // 다음 모델 시도
        }

        // 함수 호출 결과에서 상품 정보 추출
        let foundProducts: Product[] = [];
        for (const msg of currentMessages) {
          if (msg.role === 'tool') {
            try {
              const toolResult = JSON.parse(msg.content || '{}');
              if (toolResult.success && toolResult.products && Array.isArray(toolResult.products)) {
                // 상품 정보를 Product 형식으로 변환
                foundProducts = toolResult.products.map((p: any) => {
                  // 이미지 URL 생성 (없으면 기본 경로 사용)
                  let imageUrl = p.image_url;
                  if (!imageUrl) {
                    // 상품 이름 기반으로 이미지 경로 추정
                    const imageName = p.name
                      .toLowerCase()
                      .replace(/\s+/g, '-')
                      .replace(/[^a-z0-9-]/g, '');
                    imageUrl = `/products/${imageName}.jpg`;
                  }
                  
                  return {
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    description: p.description || '',
                    image_url: imageUrl,
                    tags: p.tags || [],
                    category: p.category || '',
                    stock: p.stock ?? 0, // 재고 수량 추가
                  };
                });
              }
            } catch (e) {
              // 파싱 오류 무시
              console.warn('상품 정보 파싱 오류:', e);
            }
          }
        }

        return { text: response, products: foundProducts.length > 0 ? foundProducts : undefined };
      }

      // 함수 호출이 너무 많은 경우
      if (functionCallCount >= maxFunctionCalls) {
        return { text: "죄송합니다. 너무 많은 함수 호출이 발생했습니다. 다시 시도해주세요. 😅" };
      }

      continue; // 다음 모델 시도
    } catch (error: any) {
      console.error(`OpenAI API 오류 (모델: ${model}):`, error);
      console.error('오류 상세:', {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        type: error?.type,
        stack: error?.stack,
      });
      
      // 모델을 찾을 수 없는 오류인 경우 다음 모델 시도
      if (error?.code === 'model_not_found' || error?.message?.includes('model') || error?.code === 'invalid_model') {
        console.log(`모델 ${model}을 찾을 수 없습니다. 다음 모델 시도...`);
        continue;
      }
      
      // API 키 오류
      if (error?.status === 401 || error?.code === 'invalid_api_key') {
        return { text: "OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요. 🔑" };
      }
      
      // 요청 제한 오류
      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        return { text: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. ⏰" };
      }
      
      // 다른 오류는 다음 모델 시도
      if (model !== models[models.length - 1]) {
        console.log(`모델 ${model}에서 오류 발생. 다음 모델 시도...`);
        continue;
      }
      
      // 모든 모델 실패 시 - 더 자세한 오류 메시지
      const errorMessage = error?.message || '알 수 없는 오류';
      console.error('모든 모델 실패. 최종 오류:', errorMessage);
      return { text: `죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. (${errorMessage}) 잠시 후 다시 시도해주세요. 😅` };
    }
  }
  
  return { text: "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 😅" };
}

