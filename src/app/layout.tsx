import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MD Editor',
  description: '마크다운 파일 뷰어',
};

// 하이드레이션 전에 테마를 확정해 화면 깜빡임(FOUC)을 막는다.
const themeScript = `(function(){try{var t=localStorage.getItem('md-viewer:theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
