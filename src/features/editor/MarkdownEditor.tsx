'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Compartment, EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { oneDark } from '@codemirror/theme-one-dark';
import { openSearchPanel } from '@codemirror/search';
import { useTheme } from '@/components/useTheme';
import { useT } from '@/components/useI18n';
import { useKeybindings, comboToCM } from '@/features/keybindings/useKeybindings';

interface Props {
  /** 마운트 시점의 초기 문서. 파일 전환은 상위에서 key로 remount해 반영. */
  initialDoc: string;
  onChange: (text: string) => void;
  onSave: () => void;
  /** 이미지 파일을 저장소에 저장하고 asset id를 반환. */
  onAttachImage: (file: File) => Promise<string>;
}

const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px', backgroundColor: 'var(--bg)' },
  '.cm-scroller': {
    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
    lineHeight: '1.6',
  },
  '.cm-content': { padding: '16px 0' },
});

function imageMarkdown(file: File, id: string): string {
  const name =
    (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[[\]()]/g, '').trim() || 'image';
  return `![${name}](asset:${id})`;
}

/** 선택 영역을 before/after로 감싼다 (굵게·기울임·인라인 코드). */
function wrapSelection(view: EditorView, before: string, after = before) {
  const { from, to } = view.state.selection.main;
  const sel = view.state.sliceDoc(from, to);
  view.dispatch({
    changes: { from, to, insert: `${before}${sel}${after}` },
    selection: { anchor: from + before.length, head: from + before.length + sel.length },
  });
  view.focus();
}

/** 선택된 각 줄 앞에 prefix를 붙인다 (제목·인용·목록). */
function prefixLines(view: EditorView, prefix: string) {
  const { from, to } = view.state.selection.main;
  const startLine = view.state.doc.lineAt(from).number;
  const endLine = view.state.doc.lineAt(to).number;
  const changes = [];
  for (let n = startLine; n <= endLine; n++) {
    changes.push({ from: view.state.doc.line(n).from, insert: prefix });
  }
  view.dispatch({ changes });
  view.focus();
}

/** [텍스트](url) 삽입 후 url 부분을 선택. */
function insertLink(view: EditorView) {
  const { from, to } = view.state.selection.main;
  const sel = view.state.sliceDoc(from, to) || '링크';
  const text = `[${sel}](url)`;
  view.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length - 4, head: from + text.length - 1 },
  });
  view.focus();
}

export function MarkdownEditor({ initialDoc, onChange, onSave, onAttachImage }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themeComp = useRef(new Compartment());
  const keymapComp = useRef(new Compartment());
  const theme = useTheme((s) => s.theme);
  const t = useT();
  const bindings = useKeybindings((s) => s.bindings);

  // 최신 콜백 참조 (에디터는 한 번만 생성).
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const attachRef = useRef(onAttachImage);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;
  attachRef.current = onAttachImage;

  const insertImages = useCallback(async (files: FileList | File[]) => {
    const view = viewRef.current;
    if (!view) return;
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) continue;
      const id = await attachRef.current(f);
      if (!id) continue;
      view.dispatch(view.state.replaceSelection(imageMarkdown(f, id) + '\n'));
    }
    view.focus();
  }, []);
  const insertRef = useRef(insertImages);
  insertRef.current = insertImages;

  // 사용자 지정 단축키로 키맵 구성 (변경 시 compartment로 재구성).
  const buildKeymap = (b: typeof bindings) =>
    Prec.high(
      keymap.of([
        { key: comboToCM(b.save), preventDefault: true, run: () => (onSaveRef.current(), true) },
        { key: comboToCM(b.bold), preventDefault: true, run: (v) => (wrapSelection(v, '**'), true) },
        { key: comboToCM(b.italic), preventDefault: true, run: (v) => (wrapSelection(v, '*'), true) },
        { key: comboToCM(b.link), preventDefault: true, run: (v) => (insertLink(v), true) },
        { key: comboToCM(b.find), preventDefault: true, run: (v) => (openSearchPanel(v), true) },
      ])
    );

  useEffect(() => {
    if (!hostRef.current) return;

    const state = EditorState.create({
      doc: initialDoc,
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        EditorView.lineWrapping,
        editorTheme,
        themeComp.current.of(theme === 'dark' ? oneDark : []),
        keymapComp.current.of(buildKeymap(bindings)),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
        EditorView.domEventHandlers({
          paste(event) {
            const items = event.clipboardData?.items;
            if (!items) return false;
            const imgs: File[] = [];
            for (const it of Array.from(items)) {
              if (it.kind === 'file') {
                const f = it.getAsFile();
                if (f && f.type.startsWith('image/')) imgs.push(f);
              }
            }
            if (imgs.length) {
              event.preventDefault();
              void insertRef.current(imgs);
              return true;
            }
            return false;
          },
          drop(event) {
            const files = event.dataTransfer?.files;
            if (!files || !files.length) return false;
            const imgs = Array.from(files).filter((f) => f.type.startsWith('image/'));
            if (imgs.length) {
              event.preventDefault();
              void insertRef.current(imgs);
              return true;
            }
            return false;
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    view.focus();
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // initialDoc은 마운트 시 1회만 사용 (파일 전환은 key remount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 테마 변경 시 색상만 재구성.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeComp.current.reconfigure(theme === 'dark' ? oneDark : []),
    });
  }, [theme]);

  // 단축키 변경 시 키맵 재구성.
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: keymapComp.current.reconfigure(buildKeymap(bindings)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bindings]);

  return (
    <div className="editor-host">
      <div className="editor-toolbar">
        <button className="fmt-btn" title={t('fmtBold')} onClick={() => viewRef.current && wrapSelection(viewRef.current, '**')}>
          <b>B</b>
        </button>
        <button className="fmt-btn" title={t('fmtItalic')} onClick={() => viewRef.current && wrapSelection(viewRef.current, '*')}>
          <i>I</i>
        </button>
        <button className="fmt-btn" title={t('fmtHeading')} onClick={() => viewRef.current && prefixLines(viewRef.current, '## ')}>
          H
        </button>
        <button className="fmt-btn" title={t('fmtLink')} onClick={() => viewRef.current && insertLink(viewRef.current)}>
          🔗
        </button>
        <button className="fmt-btn" title={t('fmtList')} onClick={() => viewRef.current && prefixLines(viewRef.current, '- ')}>
          •
        </button>
        <button className="fmt-btn" title={t('fmtQuote')} onClick={() => viewRef.current && prefixLines(viewRef.current, '> ')}>
          ❝
        </button>
        <button className="fmt-btn" title={t('fmtCode')} onClick={() => viewRef.current && wrapSelection(viewRef.current, '`')}>
          {'</>'}
        </button>
        <button
          className="fmt-btn"
          title={t('fmtFind')}
          onClick={() => viewRef.current && openSearchPanel(viewRef.current)}
        >
          🔍
        </button>
        <span className="fmt-sep" />
        <button className="editor-tool-btn" onClick={() => fileInputRef.current?.click()} title={t('imageTitle')}>
          {t('image')}
        </button>
        <span className="editor-tool-hint">{t('imageHint')}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) void insertImages(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      <div className="cm-host" ref={hostRef} />
    </div>
  );
}
