export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function baseName(name: string): string {
  return name.replace(/\.(md|markdown)$/i, '');
}

/** URL(blob:/http:)을 data URI로. 같은 문서 컨텍스트에서 fetch 가능. */
async function fetchToDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return `data:${blob.type};base64,${btoa(bin)}`;
}

let katexCssCache: string | null = null;

/** 로드된 스타일시트에서 KaTeX 규칙만 모아 폰트 url을 data URI로 인라인. */
async function getKatexCss(): Promise<string> {
  if (katexCssCache != null) return katexCssCache;
  let css = '';
  let base = location.href;
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList | undefined;
    try {
      rules = sheet.cssRules; // cross-origin 시트는 접근 불가 → 건너뜀
    } catch {
      continue;
    }
    if (!rules) continue;
    for (const r of Array.from(rules)) {
      const t = r.cssText;
      if (t.includes('katex') || t.includes('KaTeX')) {
        css += t + '\n';
        if (sheet.href) base = sheet.href;
      }
    }
  }
  if (!css) {
    katexCssCache = '';
    return '';
  }
  const refs = new Set([...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1].replace(/['"]/g, '')));
  for (const ref of refs) {
    if (ref.startsWith('data:')) continue;
    try {
      css = css.split(ref).join(await fetchToDataUrl(new URL(ref, base).href));
    } catch {
      /* 폰트 하나 실패는 무시 */
    }
  }
  katexCssCache = css;
  return css;
}

const EXPORT_CSS = `
  body{margin:0;background:#fff;color:#1f2328;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Malgun Gothic',sans-serif;line-height:1.7}
  .markdown-body{max-width:800px;margin:0 auto;padding:40px 24px}
  .markdown-body h1,.markdown-body h2{border-bottom:1px solid #e3e6ea;padding-bottom:.3em}
  .markdown-body code{background:#f1f3f5;padding:.15em .4em;border-radius:4px;font-family:Consolas,monospace;font-size:.9em}
  .markdown-body pre{background:#f6f8fa;border:1px solid #e3e6ea;border-radius:8px;padding:14px 16px;overflow-x:auto}
  .markdown-body pre code{background:none;padding:0}
  .markdown-body blockquote{margin-left:0;padding:.2em 1em;color:#6b7280;border-left:4px solid #e3e6ea}
  .markdown-body table{border-collapse:collapse}
  .markdown-body th,.markdown-body td{border:1px solid #e3e6ea;padding:6px 12px}
  .markdown-body img{max-width:100%}
  .mermaid-block{display:flex;justify-content:center;margin:1em 0}
  .mermaid-block svg{max-width:100%;height:auto}
`;

export function downloadMarkdown(name: string, content: string) {
  const filename = /\.(md|markdown)$/i.test(name) ? name : `${name}.md`;
  downloadBlob(filename, new Blob([content], { type: 'text/markdown;charset=utf-8' }));
}

/**
 * 렌더된 .markdown-body DOM을 그대로 캡처해 자체 완결 HTML로 저장.
 * KaTeX 수식·Mermaid SVG·이미지가 모두 포함된다.
 */
export async function downloadHtml(bodyEl: HTMLElement, name: string) {
  const clone = bodyEl.cloneNode(true) as HTMLElement;
  // 이미지(blob/외부)를 data URI로 인라인.
  for (const img of Array.from(clone.querySelectorAll('img'))) {
    const src = img.getAttribute('src') || '';
    if (src && !src.startsWith('data:')) {
      try {
        img.setAttribute('src', await fetchToDataUrl(src));
      } catch {
        /* ignore */
      }
    }
    img.removeAttribute('data-asset-id');
  }
  const katexCss = await getKatexCss();
  const title = baseName(name);
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(
    title
  )}</title><style>${EXPORT_CSS}${katexCss}</style></head><body><article class="markdown-body">${clone.innerHTML}</article></body></html>`;
  downloadBlob(`${title}.html`, new Blob([html], { type: 'text/html;charset=utf-8' }));
}
