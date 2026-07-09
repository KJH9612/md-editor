import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import katex from '@traptitech/markdown-it-katex';
import hljs from 'highlight.js';
import DOMPurify from 'dompurify';

/**
 * 마크다운 → 안전한 HTML 렌더 파이프라인.
 * 순수 함수로 격리해 뷰어와 (향후) 에디터 라이브 프리뷰에서 그대로 재사용한다.
 * html:false + DOMPurify 이중 방어로 XSS 차단.
 */
const md: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code, lang): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const out = hljs.highlight(code, { language: lang }).value;
        return `<pre class="hljs"><code>${out}</code></pre>`;
      } catch {
        /* fall through */
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
  },
})
  .use(taskLists, { enabled: true, label: true })
  .use(katex, { throwOnError: false }); // $...$, $$...$$ 수식

// ```mermaid 코드블록 → 뷰어가 SVG로 렌더할 자리표시자.
const defaultFence = md.renderer.rules.fence!;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const info = tokens[idx].info.trim().split(/\s+/)[0];
  if (info === 'mermaid') {
    // 소스를 텍스트로 담는다(속성은 DOMPurify가 개행 포함 값을 제거함). 뷰어가 SVG로 대체.
    return `<div class="mermaid-block">${md.utils.escapeHtml(tokens[idx].content)}</div>`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

// 위키링크: [[문서]] 또는 [[문서|표시이름]] → 클릭 시 뷰어가 해당 파일을 연다.
md.inline.ruler.after('emphasis', 'wikilink', (state, silent) => {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 0x5b || state.src.charCodeAt(start + 1) !== 0x5b) return false;
  const end = state.src.indexOf(']]', start + 2);
  if (end < 0) return false;
  const inner = state.src.slice(start + 2, end);
  if (!inner.trim() || inner.includes('[')) return false;
  if (!silent) {
    const [target, label] = inner.split('|');
    const token = state.push('wikilink', '', 0);
    token.meta = { target: target.trim(), label: (label ?? target).trim() };
  }
  state.pos = end + 2;
  return true;
});
md.renderer.rules.wikilink = (tokens, idx) => {
  const { target, label } = tokens[idx].meta as { target: string; label: string };
  return `<a class="wikilink" data-target="${md.utils.escapeHtml(target)}">${md.utils.escapeHtml(label)}</a>`;
};

// asset:<id> 이미지는 src 대신 data-asset-id로 렌더 → 뷰어가 objectURL로 해석.
// (blob/커스텀 스킴을 sanitize에 통과시키는 대신 DOM에서 직접 src를 채운다.)
const defaultImageRule = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const src = token.attrGet('src') ?? '';
  if (src.startsWith('asset:')) {
    const id = src.slice('asset:'.length);
    const alt = token.content ?? '';
    return `<img data-asset-id="${md.utils.escapeHtml(id)}" alt="${md.utils.escapeHtml(alt)}">`;
  }
  return defaultImageRule
    ? defaultImageRule(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

// 제목에 목차용 id를 부여. 같은 문서 순서로 처리하면 render/extractHeadings의 id가 일치.
export function slugify(text: string): string {
  const s = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');
  return s || 'section';
}

function headingIdAssigner(): (text: string) => string {
  const used = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

const defaultHeadingOpen = md.renderer.rules.heading_open;
md.renderer.rules.heading_open = (tokens, idx, options, env, self) => {
  const inline = tokens[idx + 1];
  const text = inline && inline.type === 'inline' ? inline.content : '';
  const e = env as { __assign?: (t: string) => string };
  if (!e.__assign) e.__assign = headingIdAssigner();
  tokens[idx].attrSet('id', e.__assign(text));
  return defaultHeadingOpen
    ? defaultHeadingOpen(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};

export interface HeadingItem {
  level: number;
  text: string;
  id: string;
}

/** 문서의 제목 목록(목차)을 추출. render()와 동일한 id 규칙을 사용. */
export function extractHeadings(markdown: string): HeadingItem[] {
  const tokens = md.parse(markdown, {});
  const assign = headingIdAssigner();
  const out: HeadingItem[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'heading_open') {
      const inline = tokens[i + 1];
      const raw = inline && inline.type === 'inline' ? inline.content : '';
      out.push({
        level: Number(t.tag.slice(1)),
        text: raw.replace(/[*_`~]/g, ''),
        id: assign(raw),
      });
    }
  }
  return out;
}

export function render(markdown: string): string {
  const html = md.render(markdown, {});
  // 외부 링크의 target="_blank" 등을 허용하되 그 외 위험 요소는 제거.
  return DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
}
