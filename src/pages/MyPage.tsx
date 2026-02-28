import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Calendar, Package, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { fetchOrders as fetchOrdersAPI, fetchOrderItems } from '@/lib/api';

interface OrderItem {
  id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

export default function MyPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      toast.error('로그인이 필요합니다');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      setOrdersLoading(true);
      
      // 주문 목록 가져오기
      const ordersData = await fetchOrdersAPI(user.id);

      // 각 주문의 상품 목록 가져오기
      const ordersWithItems = await Promise.all(
        ordersData.map(async (order) => {
          const itemsData = await fetchOrderItems(order.id);
          return {
            ...order,
            order_items: itemsData,
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('주문 내역을 불러오는데 실패했습니다');
    } finally {
      setOrdersLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      pending: { label: '대기중', variant: 'secondary' },
      processing: { label: '처리중', variant: 'default' },
      completed: { label: '완료', variant: 'outline' },
      cancelled: { label: '취소', variant: 'destructive' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      <main className="flex-1 container py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 페이지 헤더 */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-cute">마이페이지</h1>
              <p className="text-muted-foreground">회원 정보 및 주문 내역</p>
            </div>
          </div>

          {/* 회원 정보 카드 */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                회원 정보
              </CardTitle>
              <CardDescription>
                등록된 계정 정보입니다 (수정 불가)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <Mail className="h-5 w-5 text-pink-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">이메일</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">가입일</p>
                    <p className="font-medium">
                      {new Date(user.created_at || '').toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 주문 내역 카드 */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                주문 내역
              </CardTitle>
              <CardDescription>
                전체 {orders.length}건의 주문이 있습니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">아직 주문 내역이 없습니다</p>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600"
                  >
                    쇼핑 시작하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-6 border-2 rounded-lg bg-gradient-to-br from-white to-pink-50 dark:from-gray-800 dark:to-gray-700"
                    >
                      {/* 주문 헤더 */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{order.order_number}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <Separator className="my-4" />

                      {/* 주문 상품 목록 */}
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{item.product_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.product_price)} × {item.quantity}개
                              </p>
                            </div>
                            <p className="font-semibold text-primary">
                              {formatPrice(item.subtotal)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      {/* 주문 총액 */}
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-semibold">총 결제금액</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatPrice(order.total_amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
