# Vercel 배포 가이드

## 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정해주세요:

### Supabase 설정
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### OpenAI 설정 (챗봇 기능 사용 시)
```
VITE_OPENAI_API_KEY=your_openai_api_key
```

### 토스페이먼츠 설정 (결제 기능 사용 시)
```
VITE_TOSS_CLIENT_KEY=your_toss_client_key
```

## 환경변수 등록 방법

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 선택: `pastel-buddy-shop`
3. Settings → Environment Variables 메뉴로 이동
4. 위의 환경변수들을 하나씩 추가:
   - Name: `VITE_SUPABASE_URL`
   - Value: (Supabase 프로젝트 URL)
   - Environment: Production, Preview, Development 모두 체크
   
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (Supabase Anon Key)
   - Environment: Production, Preview, Development 모두 체크
   
   - Name: `VITE_OPENAI_API_KEY` (챗봇 기능 사용 시)
   - Value: (OpenAI API Key)
   - Environment: Production, Preview, Development 모두 체크
   
   - Name: `VITE_TOSS_CLIENT_KEY` (결제 기능 사용 시)
   - Value: (토스페이먼츠 Client Key)
   - Environment: Production, Preview, Development 모두 체크

5. 저장 후 재배포

## 빌드 설정

Vercel 프로젝트 설정에서:
- **Framework Preset**: Vite
- **Build Command**: `npm run build` (vercel.json에서 자동 설정됨)
- **Output Directory**: `dist`
- **Install Command**: `npm ci --production=false`

이미 `vercel.json` 파일에 설정되어 있으므로 자동으로 적용됩니다.

## 재배포

환경변수를 추가한 후 Deployments 탭에서 "Redeploy" 버튼을 클릭하여 재배포하세요.
