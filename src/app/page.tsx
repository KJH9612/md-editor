'use client';

import dynamic from 'next/dynamic';

// 저장소(IndexedDB) 의존 컴포넌트이므로 SSR/프리렌더를 끄고 브라우저에서만 로드.
const AppShell = dynamic(() => import('@/components/AppShell'), { ssr: false });

export default function Home() {
  return <AppShell />;
}
