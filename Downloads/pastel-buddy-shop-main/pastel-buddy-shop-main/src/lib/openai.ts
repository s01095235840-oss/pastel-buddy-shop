import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    console.warn('OpenAI API key가 설정되지 않았습니다. VITE_OPENAI_API_KEY 환경 변수를 확인해주세요.');
    return null;
  }

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // 브라우저에서 사용하기 위한 설정
  });
};

/**
 * OpenAI GPT-5-nano 모델을 사용하여 채팅 응답 생성
 */
export async function getChatResponse(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<string> {
  const client = getOpenAIClient();
  
  if (!client) {
    return "죄송합니다. OpenAI API 키가 설정되지 않아 응답을 생성할 수 없습니다. 😅";
  }

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: '당신은 Timeline 쇼핑몰의 친절한 고객 서비스 챗봇입니다. 상품 정보, 배송, 환불, 주문 등에 대해 도움을 드립니다. 항상 친절하고 정중하게 답변해주세요.',
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      return "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 😅";
    }

    return response;
  } catch (error: any) {
    console.error('OpenAI API 오류:', error);
    
    // API 키 오류
    if (error?.status === 401) {
      return "OpenAI API 키가 유효하지 않습니다. API 키를 확인해주세요. 🔑";
    }
    
    // 요청 제한 오류
    if (error?.status === 429) {
      return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요. ⏰";
    }
    
    // 기타 오류
    return "죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 😅";
  }
}

