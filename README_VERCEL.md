# Vercel 배포 가이드

## 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정해주세요:

### Supabase 설정
```
VITE_SUPABASE_URL=https://fyyywvbhktfolpibknnd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5eXl3dmJoa3Rmb2xwaWJrbm5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjUxNDcsImV4cCI6MjA4MzYwMTE0N30.ZKZIYpkykfOnYotflpiBRxAq1QWqmYRC3dRgT56wzeQ
```

## 환경변수 등록 방법

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 선택: `pastel-buddy-shop`
3. Settings → Environment Variables 메뉴로 이동
4. 위의 환경변수들을 하나씩 추가:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://fyyywvbhktfolpibknnd.supabase.co`
   - Environment: Production, Preview, Development 모두 체크
   
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: (위의 키 값)
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
