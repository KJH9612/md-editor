// GitHub Pages 빌드 시에만 basePath 적용 (Tauri/로컬은 루트 경로 사용).
const isPages = process.env.GITHUB_PAGES === 'true';
const repo = 'md-editor';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  ...(isPages ? { basePath: `/${repo}`, assetPrefix: `/${repo}/` } : {}),
};

export default nextConfig;
