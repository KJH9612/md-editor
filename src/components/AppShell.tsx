'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import { storage } from '@/storage';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { useImport } from '@/features/import/useImport';
import { MarkdownViewer } from '@/features/viewer/MarkdownViewer';
import { MarkdownEditor } from '@/features/editor/MarkdownEditor';
import { DialogHost } from '@/components/DialogHost';
import { promptDialog, confirmDialog } from '@/components/dialog';
import { useTheme } from '@/components/useTheme';
import { useSidebar, NARROW_BREAKPOINT } from '@/components/useSidebar';
import { SearchBox } from '@/features/search/SearchBox';
import { useSearchStore } from '@/features/search/useSearchStore';
import { SidebarBody } from '@/features/library/SidebarBody';
import { useRecent } from '@/features/library/useRecent';
import { readDragIds } from '@/features/tree/treeUtils';
import { FindBar } from '@/features/find/FindBar';
import { OutlinePanel } from '@/features/outline/OutlinePanel';
import { BacklinksPanel } from '@/features/backlinks/BacklinksPanel';
import { CommandPalette } from '@/features/palette/CommandPalette';
import { HistoryPanel } from '@/features/history/HistoryPanel';
import { GraphView } from '@/features/graph/GraphView';
import { downloadMarkdown, downloadHtml, downloadBlob } from '@/features/export/exportDoc';
import { helpMd } from '@/features/help/helpContent';
import { docStats } from '@/features/stats/docStats';
import { getTemplates, dailyContent, todayStr, type Template } from '@/features/templates/templates';
import { useT, useI18n, LOCALES, tr } from '@/components/useI18n';
import { useKeybindings, eventToCombo } from '@/features/keybindings/useKeybindings';
import { KeybindingsDialog } from '@/features/keybindings/KeybindingsDialog';
import type { BackupData } from '@/types/models';

const TAB_DRAG_TYPE = 'application/x-mdviewer-tab';

export default function AppShell() {
  const refresh = useTreeStore((s) => s.refresh);
  const selectedFileId = useTreeStore((s) => s.selectedFileId);
  const selectedContent = useTreeStore((s) => s.selectedContent);
  const selectedTitle = useTreeStore((s) => s.selectedTitle);
  const mode = useTreeStore((s) => s.mode);
  const draft = useTreeStore((s) => s.draft);
  const dirty = useTreeStore((s) => s.dirty);
  const setMode = useTreeStore((s) => s.setMode);
  const updateDraft = useTreeStore((s) => s.updateDraft);
  const save = useTreeStore((s) => s.save);
  const autoSave = useTreeStore((s) => s.autoSave);
  const setAutoSave = useTreeStore((s) => s.setAutoSave);
  const moveNodes = useTreeStore((s) => s.moveNodes);
  const tabs = useTreeStore((s) => s.tabs);
  const activeId = useTreeStore((s) => s.activeId);
  const setActiveTab = useTreeStore((s) => s.setActiveTab);
  const closeTab = useTreeStore((s) => s.closeTab);
  const reorderTabs = useTreeStore((s) => s.reorderTabs);

  const theme = useTheme((s) => s.theme);
  const toggleTheme = useTheme((s) => s.toggle);
  const t = useT();
  const locale = useI18n((s) => s.locale);
  const setLocale = useI18n((s) => s.setLocale);
  const bindings = useKeybindings((s) => s.bindings);

  const width = useSidebar((s) => s.width);
  const narrow = useSidebar((s) => s.narrow);
  const narrowOpen = useSidebar((s) => s.narrowOpen);
  const userCollapsed = useSidebar((s) => s.userCollapsed);
  const setWidth = useSidebar((s) => s.setWidth);
  const setNarrow = useSidebar((s) => s.setNarrow);
  const toggleSidebar = useSidebar((s) => s.toggle);
  const closeOverlay = useSidebar((s) => s.closeOverlay);
  const sidebarVisible = narrow ? narrowOpen : !userCollapsed;

  const searchQuery = useSearchStore((s) => s.query);
  const searchCaseSensitive = useSearchStore((s) => s.caseSensitive);
  const setSearchResults = useSearchStore((s) => s.setResults);

  const { importFiles } = useImport();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const draggingRef = useRef(false);
  const viewScrollRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [backlinksOpen, setBacklinksOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [kbOpen, setKbOpen] = useState(false);
  const [overTabId, setOverTabId] = useState<string | null>(null);

  const currentContent = mode === 'edit' ? draft : selectedContent;
  const stats = currentContent != null ? docStats(currentContent) : null;

  // 파일을 열거나 보기 모드로 전환할 때 스크롤을 최상단으로 (찾기 중이면 유지).
  useEffect(() => {
    if (mode === 'view' && !findOpen && viewScrollRef.current) {
      viewScrollRef.current.scrollTop = 0;
    }
  }, [selectedFileId, mode, findOpen]);

  // 보기 모드 찾기 (편집 모드는 CodeMirror 자체 검색). 사용자 지정 단축키 사용.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (selectedFileId && mode === 'view' && eventToCombo(e) === bindings.find) {
        e.preventDefault();
        setFindOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedFileId, mode, bindings.find]);

  // 빠른 열기(명령 팔레트). 사용자 지정 단축키 사용.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (eventToCombo(e) === bindings.quickOpen) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bindings.quickOpen]);

  // 파일을 열면 도움말 화면 닫기 + 최근 목록 기록.
  useEffect(() => {
    if (selectedFileId) {
      setShowHelp(false);
      useRecent.getState().push(selectedFileId);
    }
  }, [selectedFileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 디바운스 검색: 입력이 멈춘 뒤 200ms에 저장소 전체 검색.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      const hits = await storage.searchFiles(q, searchCaseSensitive);
      if (!cancelled) setSearchResults(hits);
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchQuery, searchCaseSensitive, setSearchResults]);

  // 창 폭 감시 → 좁아지면 자동 숨김.
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < NARROW_BREAKPOINT);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setNarrow]);

  // 사이드바 폭 드래그 조절.
  const onResizerDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    const onMove = (ev: MouseEvent) => {
      if (draggingRef.current) setWidth(ev.clientX);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // 자동 저장: 켜져 있고 미저장 변경이 있으면 입력이 멈춘 뒤 800ms 후 저장.
  useEffect(() => {
    if (!autoSave || !dirty) return;
    const t = setTimeout(() => void save(), 800);
    return () => clearTimeout(t);
  }, [autoSave, dirty, draft, save]);

  // 편집 모드: 에디터 ↔ 프리뷰 스크롤 비율 동기화.
  useEffect(() => {
    if (mode !== 'edit' || !selectedFileId) return;
    const editor = document.querySelector<HTMLElement>('.edit-editor .cm-scroller');
    const preview = document.querySelector<HTMLElement>('.edit-preview');
    if (!editor || !preview) return;
    let lock = false;
    const sync = (from: HTMLElement, to: HTMLElement) => () => {
      if (lock) return;
      lock = true;
      const denom = from.scrollHeight - from.clientHeight || 1;
      to.scrollTop = (from.scrollTop / denom) * (to.scrollHeight - to.clientHeight);
      requestAnimationFrame(() => {
        lock = false;
      });
    };
    const onEd = sync(editor, preview);
    const onPv = sync(preview, editor);
    editor.addEventListener('scroll', onEd);
    preview.addEventListener('scroll', onPv);
    return () => {
      editor.removeEventListener('scroll', onEd);
      preview.removeEventListener('scroll', onPv);
    };
  }, [mode, selectedFileId]);

  const targetParentId = (): string | null => {
    const { nodes, selectedNodeId } = useTreeStore.getState();
    const sel = nodes.find((n) => n.id === selectedNodeId);
    return sel ? (sel.type === 'folder' ? sel.id : sel.parentId) : null;
  };

  const onNewFolder = async () => {
    const parentId = targetParentId();
    const name = await promptDialog(tr('newFolderTitle'));
    if (name && name.trim()) {
      await storage.createFolder(parentId, name.trim());
      await refresh();
    }
  };

  const onNewFile = async () => {
    const parentId = targetParentId();
    let name = await promptDialog(tr('newFileTitle'), tr('newFileDefault'));
    if (!name || !name.trim()) return;
    name = name.trim();
    if (!/\.(md|markdown)$/i.test(name)) name += '.md';
    const node = await storage.importFile(parentId, name, '');
    await refresh();
    await useTreeStore.getState().openFile(node);
    setMode('edit');
  };

  const createFromTemplate = async (tpl: Template) => {
    setMenuOpen(false);
    const parentId = targetParentId();
    let name = await promptDialog(tr('newDocTitle'), `${tpl.name}.md`);
    if (!name || !name.trim()) return;
    name = name.trim();
    if (!/\.(md|markdown)$/i.test(name)) name += '.md';
    const node = await storage.importFile(parentId, name, tpl.body);
    await refresh();
    await useTreeStore.getState().openFile(node);
    setMode('edit');
  };

  const onDailyNote = async () => {
    setMenuOpen(false);
    const ds = todayStr();
    const fname = `${ds}.md`;
    const existing = useTreeStore.getState().nodes.find(
      (n) => n.type === 'file' && n.name === fname
    );
    if (existing) {
      await useTreeStore.getState().openFile(existing);
      return;
    }
    const node = await storage.importFile(null, fname, dailyContent(ds, locale));
    await refresh();
    await useTreeStore.getState().openFile(node);
    setMode('edit');
  };

  // 빈 영역(루트) 드롭: 내부 노드면 루트로 이동, OS 파일이면 import.
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const ids = readDragIds(e.dataTransfer);
    if (ids.length) {
      void moveNodes(ids, null);
      return;
    }
    if (e.dataTransfer.files.length) void importFiles(e.dataTransfer.files);
  };

  const onTreeDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // 내부 노드/파일 드롭 모두 허용
    if (e.dataTransfer.types.includes('Files')) setDragOver(true);
  };

  // 이미지 파일을 현재 파일 소유의 asset으로 저장 → id 반환.
  const attachImage = useCallback(async (file: File): Promise<string> => {
    const fileId = useTreeStore.getState().selectedFileId;
    if (!fileId) return '';
    return storage.addAsset(fileId, file, file.type || 'image/png');
  }, []);

  const exportBackup = async () => {
    setMenuOpen(false);
    const data = await storage.exportAll();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(
      `md-viewer-backup-${stamp}.json`,
      new Blob([JSON.stringify(data)], { type: 'application/json' })
    );
  };

  const onRestoreFile = async (file: File) => {
    let data: BackupData;
    try {
      data = JSON.parse(await file.text());
    } catch {
      await confirmDialog(tr('restoreFailTitle'), tr('restoreFailMsg'), { okLabel: tr('ok') });
      return;
    }
    if (!data || data.version !== 1 || !Array.isArray(data.nodes)) {
      await confirmDialog(tr('restoreFailTitle'), tr('restoreFailMsg'), { okLabel: tr('ok') });
      return;
    }
    const ok = await confirmDialog(tr('restoreTitle'), tr('restoreMsg'), {
      okLabel: tr('restore'),
      danger: true,
    });
    if (!ok) return;
    await storage.importAll(data);
    await refresh();
  };

  return (
    <div className="app">
      {sidebarVisible && narrow && (
        <div className="sidebar-backdrop" onClick={closeOverlay} />
      )}
      {sidebarVisible && (
        <aside className={`sidebar${narrow ? ' overlay' : ''}`} style={{ width }}>
          <div className="sidebar-header">
            <div className="sidebar-title-row">
              <span className="app-title">MD Viewer</span>
              <div className="header-buttons">
                <button
                  className="icon-btn"
                  onClick={toggleTheme}
                  title={theme === 'dark' ? t('toLight') : t('toDark')}
                >
                  {theme === 'dark' ? '☀️' : '🌙'}
                </button>
                <div className="menu-wrap">
                  <button
                    className="icon-btn"
                    onClick={() => setMenuOpen((v) => !v)}
                    title={t('more')}
                  >
                    ⋯
                  </button>
                  {menuOpen && (
                    <>
                      <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                      <div className="menu-dropdown">
                        <button onClick={() => { setMenuOpen(false); setGraphOpen(true); }}>
                          {t('graph')}
                        </button>
                        <button onClick={() => void onDailyNote()}>{t('dailyNote')}</button>
                        {getTemplates(locale).map((tpl) => (
                          <button key={tpl.id} onClick={() => void createFromTemplate(tpl)}>
                            {t('newDocFrom')}: {tpl.name}
                          </button>
                        ))}
                        <div className="menu-sep" />
                        <button onClick={() => { setMenuOpen(false); setKbOpen(true); }}>
                          {t('shortcutsMenu')}
                        </button>
                        <button onClick={() => { setMenuOpen(false); setShowHelp(true); }}>
                          {t('help')}
                        </button>
                        <button onClick={() => void exportBackup()}>{t('backupExport')}</button>
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            restoreInputRef.current?.click();
                          }}
                        >
                          {t('backupRestore')}
                        </button>
                        <div className="menu-sep" />
                        <div className="menu-label">{t('language')}</div>
                        {LOCALES.map((l) => (
                          <button
                            key={l.code}
                            className={locale === l.code ? 'active' : ''}
                            onClick={() => { setMenuOpen(false); setLocale(l.code); }}
                          >
                            {locale === l.code ? '● ' : ''}
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button className="icon-btn" onClick={toggleSidebar} title={t('hideSidebar')}>
                  «
                </button>
              </div>
            </div>
          <div className="sidebar-actions">
            <button onClick={() => fileInputRef.current?.click()}>{t('import')}</button>
            <button onClick={onNewFile}>{t('newFile')}</button>
            <button onClick={onNewFolder}>{t('newFolder')}</button>
          </div>
          <SearchBox />
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) void importFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <input
            ref={restoreInputRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onRestoreFile(f);
              e.target.value = '';
            }}
          />
        </div>
        <div
          className={`sidebar-tree${dragOver ? ' drag-over' : ''}`}
          onDragOver={onTreeDragOver}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
            <SidebarBody />
          </div>
          {!narrow && <div className="resizer" onMouseDown={onResizerDown} />}
        </aside>
      )}
      {!sidebarVisible && (
        <button className="sidebar-show" onClick={toggleSidebar} title={t('showSidebar')}>
          ☰
        </button>
      )}
      <main className="main">
        {showHelp ? (
          <div className="editor-pane">
            <div className="toolbar" style={sidebarVisible ? undefined : { paddingLeft: 52 }}>
              <span className="toolbar-title">{t('help')}</span>
              <div className="toolbar-actions">
                <button className="toolbar-btn" onClick={() => setShowHelp(false)}>
                  {t('close')}
                </button>
              </div>
            </div>
            <div className="pane-scroll">
              <MarkdownViewer content={helpMd(locale)} title={null} />
            </div>
          </div>
        ) : selectedFileId ? (
          <div className="editor-pane">
            {tabs.length > 0 && (
              <div className="tab-bar">
                {tabs.map((tab) => (
                  <div
                    key={tab.fileId}
                    className={`tab${tab.fileId === activeId ? ' active' : ''}${
                      overTabId === tab.fileId ? ' tab-drop' : ''
                    }`}
                    onClick={() => void setActiveTab(tab.fileId)}
                    title={tab.title}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(TAB_DRAG_TYPE, tab.fileId);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (e.dataTransfer.types.includes(TAB_DRAG_TYPE)) {
                        e.preventDefault();
                        setOverTabId(tab.fileId);
                      }
                    }}
                    onDragLeave={() =>
                      setOverTabId((o) => (o === tab.fileId ? null : o))
                    }
                    onDrop={(e) => {
                      if (e.dataTransfer.types.includes(TAB_DRAG_TYPE)) {
                        e.preventDefault();
                        const id = e.dataTransfer.getData(TAB_DRAG_TYPE);
                        if (id) reorderTabs(id, tab.fileId);
                        setOverTabId(null);
                      }
                    }}
                  >
                    <span className="tab-title">{tab.title}</span>
                    {tab.dirty && <span className="tab-dot" />}
                    <button
                      className="tab-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        void closeTab(tab.fileId);
                      }}
                      title={t('tabClose')}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              className="toolbar"
              style={sidebarVisible ? undefined : { paddingLeft: 52 }}
            >
              <span className="toolbar-title">
                {selectedTitle}
                {dirty && <span className="dirty-dot" title={t('unsaved')} />}
              </span>
              <div className="toolbar-actions">
                <div className="mode-toggle">
                  <button
                    className={mode === 'view' ? 'active' : ''}
                    onClick={() => setMode('view')}
                  >
                    {t('view')}
                  </button>
                  <button
                    className={mode === 'edit' ? 'active' : ''}
                    onClick={() => setMode('edit')}
                  >
                    {t('edit')}
                  </button>
                </div>
                {mode === 'view' && (
                  <>
                    <button
                      className={`toolbar-btn${tocOpen ? ' active' : ''}`}
                      onClick={() => setTocOpen((v) => !v)}
                    >
                      {t('toc')}
                    </button>
                    <button
                      className={`toolbar-btn${backlinksOpen ? ' active' : ''}`}
                      onClick={() => setBacklinksOpen((v) => !v)}
                    >
                      {t('backlinks')}
                    </button>
                    <button
                      className={`toolbar-btn${historyOpen ? ' active' : ''}`}
                      onClick={() => setHistoryOpen((v) => !v)}
                    >
                      {t('history')}
                    </button>
                  </>
                )}
                <div className="menu-wrap">
                  <button className="toolbar-btn" onClick={() => setExportOpen((v) => !v)}>
                    {t('export')}
                  </button>
                  {exportOpen && (
                    <>
                      <div className="menu-backdrop" onClick={() => setExportOpen(false)} />
                      <div className="menu-dropdown menu-right">
                        <button
                          onClick={() => {
                            setExportOpen(false);
                            if (selectedTitle && currentContent != null)
                              downloadMarkdown(selectedTitle, currentContent);
                          }}
                        >
                          {t('dlMd')}
                        </button>
                        <button
                          onClick={() => {
                            setExportOpen(false);
                            const el = document.querySelector<HTMLElement>('.editor-pane .markdown-body');
                            if (el && selectedTitle) void downloadHtml(el, selectedTitle);
                          }}
                        >
                          {t('dlHtml')}
                        </button>
                        <button
                          onClick={() => {
                            setExportOpen(false);
                            // 화면의 렌더 결과(KaTeX·Mermaid 포함)를 그대로 인쇄.
                            setTimeout(() => window.print(), 50);
                          }}
                        >
                          {t('print')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
                {mode === 'edit' && (
                  <>
                    <label className="autosave-toggle">
                      <input
                        type="checkbox"
                        checked={autoSave}
                        onChange={(e) => setAutoSave(e.target.checked)}
                      />
                      {t('autoSave')}
                    </label>
                    {autoSave ? (
                      <span className="save-status">{dirty ? t('saving') : t('saved')}</span>
                    ) : (
                      <button
                        className="btn-save"
                        onClick={() => void save()}
                        disabled={!dirty}
                      >
                        {t('save')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            {mode === 'view' ? (
              <div className="view-wrap">
                {findOpen && (
                  <FindBar
                    containerRef={viewScrollRef}
                    contentKey={selectedFileId}
                    onClose={() => setFindOpen(false)}
                  />
                )}
                <div className="view-body">
                  <div className="pane-scroll" ref={viewScrollRef}>
                    <MarkdownViewer content={selectedContent} title={null} />
                  </div>
                  {backlinksOpen && (
                    <BacklinksPanel
                      fileId={selectedFileId}
                      name={selectedTitle}
                      onClose={() => setBacklinksOpen(false)}
                    />
                  )}
                  {tocOpen && (
                    <OutlinePanel
                      content={selectedContent}
                      containerRef={viewScrollRef}
                      onClose={() => setTocOpen(false)}
                    />
                  )}
                  {historyOpen && (
                    <HistoryPanel fileId={selectedFileId} onClose={() => setHistoryOpen(false)} />
                  )}
                </div>
              </div>
            ) : (
              <div className="edit-split">
                <div className="edit-editor">
                  <MarkdownEditor
                    key={selectedFileId}
                    initialDoc={draft}
                    onChange={updateDraft}
                    onSave={() => void save()}
                    onAttachImage={attachImage}
                  />
                </div>
                <div className="edit-preview pane-scroll">
                  <MarkdownViewer content={draft} title={null} />
                </div>
              </div>
            )}
            {stats && (
              <div className="statusbar">
                {stats.words.toLocaleString()} {t('words')} · {stats.chars.toLocaleString()}{' '}
                {t('chars')} · ~{stats.minutes} {t('readMin')}
              </div>
            )}
          </div>
        ) : (
          <MarkdownViewer content={null} title={null} />
        )}
      </main>
      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      {graphOpen && <GraphView onClose={() => setGraphOpen(false)} />}
      {kbOpen && <KeybindingsDialog onClose={() => setKbOpen(false)} />}
      <DialogHost />
    </div>
  );
}
