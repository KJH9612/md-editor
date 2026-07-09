import { create } from 'zustand';

export type Locale = 'ko' | 'en' | 'ja';

const KEY = 'md-viewer:locale';

function read(): Locale {
  if (typeof window === 'undefined') return 'ko';
  const v = localStorage.getItem(KEY);
  return v === 'en' || v === 'ja' ? v : 'ko';
}

type Entry = { ko: string; en: string; ja: string };
type Dict = Record<string, Entry>;

const D: Dict = {
  import: { ko: '⬆ 가져오기', en: '⬆ Import', ja: '⬆ インポート' },
  newFile: { ko: '＋ 파일', en: '＋ File', ja: '＋ ファイル' },
  newFolder: { ko: '＋ 폴더', en: '＋ Folder', ja: '＋ フォルダ' },
  searchPlaceholder: { ko: '파일·내용 검색', en: 'Search files & content', ja: 'ファイル・内容を検索' },
  caseSensitive: { ko: '대소문자 구분', en: 'Match case', ja: '大文字と小文字を区別' },
  favorites: { ko: '⭐ 즐겨찾기', en: '⭐ Favorites', ja: '⭐ お気に入り' },
  tags: { ko: '# 태그', en: '# Tags', ja: '# タグ' },
  view: { ko: '보기', en: 'View', ja: '表示' },
  edit: { ko: '편집', en: 'Edit', ja: '編集' },
  toc: { ko: '목차', en: 'Outline', ja: '目次' },
  backlinks: { ko: '백링크', en: 'Backlinks', ja: 'バックリンク' },
  history: { ko: '히스토리', en: 'History', ja: '履歴' },
  export: { ko: '내보내기 ▾', en: 'Export ▾', ja: 'エクスポート ▾' },
  autoSave: { ko: '자동 저장', en: 'Auto-save', ja: '自動保存' },
  saving: { ko: '저장 중…', en: 'Saving…', ja: '保存中…' },
  saved: { ko: '저장됨', en: 'Saved', ja: '保存済み' },
  save: { ko: '저장', en: 'Save', ja: '保存' },
  close: { ko: '닫기', en: 'Close', ja: '閉じる' },
  more: { ko: '더보기', en: 'More', ja: 'その他' },
  help: { ko: '도움말 · 사용법', en: 'Help · Guide', ja: 'ヘルプ・使い方' },
  graph: { ko: '그래프 뷰', en: 'Graph view', ja: 'グラフビュー' },
  dailyNote: { ko: '오늘 노트', en: 'Daily note', ja: '今日のノート' },
  backupExport: { ko: '백업 내보내기', en: 'Export backup', ja: 'バックアップを書き出す' },
  backupRestore: { ko: '백업에서 복원', en: 'Restore backup', ja: 'バックアップから復元' },
  hideSidebar: { ko: '사이드바 숨기기', en: 'Hide sidebar', ja: 'サイドバーを隠す' },
  showSidebar: { ko: '사이드바 열기', en: 'Show sidebar', ja: 'サイドバーを開く' },
  toLight: { ko: '라이트 모드로', en: 'Switch to light', ja: 'ライトモードへ' },
  toDark: { ko: '다크 모드로', en: 'Switch to dark', ja: 'ダークモードへ' },
  language: { ko: '언어', en: 'Language', ja: '言語' },
  dlMd: { ko: '.md 다운로드', en: 'Download .md', ja: '.md をダウンロード' },
  dlHtml: { ko: 'HTML 다운로드', en: 'Download HTML', ja: 'HTML をダウンロード' },
  print: { ko: '인쇄 · PDF', en: 'Print · PDF', ja: '印刷 · PDF' },
  palettePlaceholder: { ko: '파일 이름으로 빠르게 열기…', en: 'Quick open by name…', ja: '名前で素早く開く…' },
  words: { ko: '단어', en: 'words', ja: '語' },
  chars: { ko: '자', en: 'chars', ja: '字' },
  readMin: { ko: '분', en: 'min', ja: '分' },
  newDocFrom: { ko: '새 문서', en: 'New', ja: '新規' },

  // 공통 버튼
  ok: { ko: '확인', en: 'OK', ja: 'OK' },
  cancel: { ko: '취소', en: 'Cancel', ja: 'キャンセル' },
  delete: { ko: '삭제', en: 'Delete', ja: '削除' },
  restore: { ko: '복원', en: 'Restore', ja: '復元' },
  revert: { ko: '되돌리기', en: 'Revert', ja: '元に戻す' },
  clear: { ko: '해제', en: 'Clear', ja: '解除' },

  // 프롬프트/확인 다이얼로그
  newFolderTitle: { ko: '새 폴더 이름', en: 'New folder name', ja: '新しいフォルダ名' },
  newFileTitle: { ko: '새 파일 이름', en: 'New file name', ja: '新しいファイル名' },
  newFileDefault: { ko: '제목없음.md', en: 'untitled.md', ja: '無題.md' },
  newDocTitle: { ko: '새 문서 이름', en: 'New document name', ja: '新規ドキュメント名' },
  renameTitle: { ko: '이름 변경', en: 'Rename', ja: '名前を変更' },
  deleteTitle: { ko: '삭제 확인', en: 'Confirm delete', ja: '削除の確認' },
  deleteFolderMsg: {
    ko: '폴더 "{name}"과 하위 항목을 모두 삭제합니다.',
    en: 'Delete folder "{name}" and all its contents.',
    ja: 'フォルダ「{name}」とその中身をすべて削除します。',
  },
  deleteFileMsg: {
    ko: '"{name}"을 삭제합니다.',
    en: 'Delete "{name}".',
    ja: '「{name}」を削除します。',
  },
  restoreTitle: { ko: '백업 복원', en: 'Restore backup', ja: 'バックアップから復元' },
  restoreMsg: {
    ko: '현재 저장소의 모든 내용이 백업 데이터로 대체됩니다. 계속할까요?',
    en: 'All current content will be replaced with the backup. Continue?',
    ja: '現在の内容はすべてバックアップに置き換えられます。続けますか？',
  },
  restoreFailTitle: { ko: '복원 실패', en: 'Restore failed', ja: '復元失敗' },
  restoreFailMsg: {
    ko: '올바른 백업 파일이 아닙니다.',
    en: 'Not a valid backup file.',
    ja: '有効なバックアップファイルではありません。',
  },
  revertTitle: { ko: '이 버전으로 되돌리기', en: 'Revert to this version', ja: 'このバージョンに戻す' },
  revertMsg: {
    ko: '{time} 버전으로 되돌립니다. 현재 내용은 새 버전으로 남습니다.',
    en: 'Revert to the {time} version. Current content is kept as a new version.',
    ja: '{time} のバージョンに戻します。現在の内容は新しいバージョンとして残ります。',
  },

  // 트리
  favTitle: { ko: '즐겨찾기', en: 'Favorite', ja: 'お気に入り' },
  tabClose: { ko: '탭 닫기', en: 'Close tab', ja: 'タブを閉じる' },
  unsaved: { ko: '저장 안 됨', en: 'Unsaved', ja: '未保存' },
  treeEmpty1: { ko: '아직 파일이 없습니다.', en: 'No files yet.', ja: 'まだファイルがありません。' },
  treeEmpty2: {
    ko: '.md 파일을 가져오세요.',
    en: 'Import .md files.',
    ja: '.md ファイルをインポートしてください。',
  },

  // 에디터 툴바
  fmtBold: { ko: '굵게 (Ctrl+B)', en: 'Bold (Ctrl+B)', ja: '太字 (Ctrl+B)' },
  fmtItalic: { ko: '기울임 (Ctrl+I)', en: 'Italic (Ctrl+I)', ja: '斜体 (Ctrl+I)' },
  fmtHeading: { ko: '제목', en: 'Heading', ja: '見出し' },
  fmtLink: { ko: '링크 (Ctrl+K)', en: 'Link (Ctrl+K)', ja: 'リンク (Ctrl+K)' },
  fmtList: { ko: '목록', en: 'List', ja: 'リスト' },
  fmtQuote: { ko: '인용', en: 'Quote', ja: '引用' },
  fmtCode: { ko: '인라인 코드', en: 'Inline code', ja: 'インラインコード' },
  fmtFind: { ko: '찾기·바꾸기 (Ctrl+F)', en: 'Find & replace (Ctrl+F)', ja: '検索・置換 (Ctrl+F)' },
  image: { ko: '🖼 이미지', en: '🖼 Image', ja: '🖼 画像' },
  imageHint: {
    ko: '붙여넣기·드래그로도 첨부',
    en: 'Also via paste or drag',
    ja: '貼り付け・ドラッグでも添付',
  },
  imageTitle: { ko: '이미지 첨부', en: 'Attach image', ja: '画像を添付' },

  // 뷰어/패널
  viewerEmpty: {
    ko: '왼쪽에서 파일을 선택하거나 .md 파일을 가져오세요.',
    en: 'Select a file on the left, or import .md files.',
    ja: '左でファイルを選択するか、.md ファイルをインポートしてください。',
  },
  tocEmpty: { ko: '제목이 없습니다.', en: 'No headings.', ja: '見出しがありません。' },
  backlinksEmpty: {
    ko: '이 문서를 참조하는 문서가 없습니다.',
    en: 'No documents link here.',
    ja: 'このドキュメントを参照する文書はありません。',
  },
  loading: { ko: '불러오는 중…', en: 'Loading…', ja: '読み込み中…' },
  historyTitle: { ko: '버전 히스토리', en: 'Version history', ja: 'バージョン履歴' },
  historyEmpty: {
    ko: '저장된 버전이 없습니다. 편집 후 저장하면 기록됩니다.',
    en: 'No saved versions yet. Save after editing to record them.',
    ja: '保存されたバージョンがありません。編集して保存すると記録されます。',
  },
  latest: { ko: '최신', en: 'latest', ja: '最新' },
  emptyDoc: { ko: '(빈 문서)', en: '(empty)', ja: '(空のドキュメント)' },
  graphDocs: { ko: '문서', en: 'docs', ja: '文書' },
  graphEdges: { ko: '연결', en: 'links', ja: 'リンク' },
  graphNone: { ko: '문서가 없습니다.', en: 'No documents.', ja: '文書がありません。' },
  paletteEmpty: { ko: '일치하는 파일이 없습니다.', en: 'No matching files.', ja: '一致するファイルがありません。' },
  searchNoResult: {
    ko: '“{q}” 검색 결과가 없습니다.',
    en: 'No results for “{q}”.',
    ja: '「{q}」の検索結果はありません。',
  },
  favEmpty1: { ko: '즐겨찾기가 없습니다.', en: 'No favorites.', ja: 'お気に入りがありません。' },
  favEmpty2: {
    ko: '파일에 마우스를 올려 ☆를 누르세요.',
    en: 'Hover a file and click ☆.',
    ja: 'ファイルにカーソルを合わせて ☆ をクリック。',
  },
  tagEmpty: {
    ko: '태그가 없습니다. 본문에 #태그 형식으로 적으세요.',
    en: 'No tags. Write #tag in the content.',
    ja: 'タグがありません。本文に #タグ 形式で記述してください。',
  },

  // 템플릿
  tplMeeting: { ko: '회의록', en: 'Meeting notes', ja: '議事録' },
  tplNote: { ko: '기본 노트', en: 'Basic note', ja: '基本ノート' },

  // 단축키 설정
  shortcutsMenu: { ko: '단축키 설정', en: 'Keyboard shortcuts', ja: 'ショートカット設定' },
  shortcutsTitle: { ko: '단축키 설정', en: 'Keyboard shortcuts', ja: 'ショートカット設定' },
  kbChange: { ko: '변경', en: 'Change', ja: '変更' },
  kbPress: { ko: '키를 누르세요…', en: 'Press keys…', ja: 'キーを押してください…' },
  kbConflict: {
    ko: '중복된 단축키가 있습니다.',
    en: 'Some shortcuts conflict.',
    ja: '重複するショートカットがあります。',
  },
  kbReset: { ko: '기본값으로', en: 'Reset to defaults', ja: 'デフォルトに戻す' },
  actQuickOpen: { ko: '빠른 열기', en: 'Quick open', ja: 'クイックオープン' },
  actFind: { ko: '찾기', en: 'Find', ja: '検索' },
  actSave: { ko: '저장', en: 'Save', ja: '保存' },
  actBold: { ko: '굵게', en: 'Bold', ja: '太字' },
  actItalic: { ko: '기울임', en: 'Italic', ja: '斜体' },
  actLink: { ko: '링크', en: 'Link', ja: 'リンク' },
};

/** 언어 선택 목록 (네이티브 표기). */
export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
];

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useI18n = create<I18nState>((set) => ({
  locale: read(),
  setLocale: (locale) => {
    try {
      localStorage.setItem(KEY, locale);
    } catch {
      /* ignore */
    }
    set({ locale });
  },
}));

/** 현재 locale에 맞는 번역 함수 (컴포넌트에서 useT()로 사용, locale 변경 시 리렌더). */
export function useT(): (key: string) => string {
  const locale = useI18n((s) => s.locale);
  return (key: string) => D[key]?.[locale] ?? key;
}

/** React 밖(핸들러/다이얼로그)에서 쓰는 번역 함수. 호출 시점 locale 사용. */
export function tr(key: string): string {
  const locale = useI18n.getState().locale;
  return D[key]?.[locale] ?? key;
}
