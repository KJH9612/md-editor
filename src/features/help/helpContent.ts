import type { Locale } from '@/components/useI18n';

const KO = `# MD Editor 사용법

마크다운 파일을 가져와 폴더로 정리하고, 보고, 편집하는 도구입니다.
모든 데이터는 이 브라우저 안(내부 저장소)에 저장됩니다.

## 시작하기
- **가져오기**: \`⬆ 가져오기\` 버튼 또는 \`.md\` 파일을 사이드바로 **드래그**
- **새 파일 / 새 폴더**: \`＋ 파일\`, \`＋ 폴더\` 버튼
- **편집**: 파일을 연 뒤 상단 \`편집\` → 좌측 편집 / 우측 실시간 미리보기

## 파일 관리
- **이동**: 드래그해서 다른 폴더로 (여러 개 선택: \`Ctrl/⌘·Shift+클릭\`)
- **이미지**: 편집 화면에서 \`🖼\` 버튼, 또는 붙여넣기 / 드래그

## 검색·이동
- **전체 검색**: 사이드바 검색창 / **문서 내 찾기**: 보기 중 \`Ctrl/⌘+F\`
- **빠른 열기**: \`Ctrl/⌘+P\` / **목차·백링크·히스토리**: 보기 툴바

## 그 밖에
- **위키링크** \`[[문서]]\`, **태그** \`#태그\`, **그래프 뷰**, **버전 히스토리**
- **백업**: \`⋯\` 메뉴 → 백업 내보내기/복원 (데이터 안전)

## 단축키
| 키 (Mac은 ⌘, 그 외 Ctrl) | 동작 |
|---|---|
| \`Ctrl/⌘ + S\` | 저장 |
| \`Ctrl/⌘ + B / I / K\` | 굵게 / 기울임 / 링크 |
| \`Ctrl/⌘ + Z\` (\`⇧Z\` 다시 실행) | 실행 취소 |
| \`Ctrl/⌘ + F\` | 찾기 (보기: 문서 내 / 편집: 찾기·바꾸기) |
| \`Ctrl/⌘ + P\` | 빠른 열기(파일 이동) |
| \`Enter\` / \`Esc\` / \`↑ ↓\` | 대화상자·팔레트·찾기바 조작 |

## 마크다운
\`\`\`markdown
# 제목
**굵게**, *기울임*, \`코드\`
- [ ] 할 일
| 표 | 머리 |
$E = mc^2$   (수식)
\`\`\`
`;

const EN = `# MD Editor Guide

Import, organize, view and edit Markdown files.
All data is stored inside this browser (local storage).

## Getting started
- **Import**: the \`⬆ Import\` button, or **drag** \`.md\` files into the sidebar
- **New file / folder**: \`＋ File\`, \`＋ Folder\`
- **Edit**: open a file, then \`Edit\` — editor on the left, live preview on the right

## Managing files
- **Move**: drag into another folder (multi-select: \`Ctrl/⌘·Shift+click\`)
- **Images**: the \`🖼\` button while editing, or paste / drag

## Search & navigate
- **Search all**: sidebar search box / **Find in doc**: \`Ctrl/⌘+F\` while viewing
- **Quick open**: \`Ctrl/⌘+P\` / **Outline, Backlinks, History**: view toolbar

## More
- **Wikilinks** \`[[doc]]\`, **tags** \`#tag\`, **graph view**, **version history**
- **Backup**: \`⋯\` menu → export / restore (keep your data safe)

## Shortcuts
| Key (⌘ on Mac, Ctrl elsewhere) | Action |
|---|---|
| \`Ctrl/⌘ + S\` | Save |
| \`Ctrl/⌘ + B / I / K\` | Bold / Italic / Link |
| \`Ctrl/⌘ + Z\` (\`⇧Z\` to redo) | Undo |
| \`Ctrl/⌘ + F\` | Find (view: in-doc / edit: find & replace) |
| \`Ctrl/⌘ + P\` | Quick open |
| \`Enter\` / \`Esc\` / \`↑ ↓\` | Dialog · palette · find bar |

## Markdown
\`\`\`markdown
# Heading
**bold**, *italic*, \`code\`
- [ ] to-do
| table | head |
$E = mc^2$   (math)
\`\`\`
`;

const JA = `# MD Editor の使い方

Markdown ファイルをインポートし、フォルダで整理・閲覧・編集できます。
すべてのデータはこのブラウザ内（内部ストレージ）に保存されます。

## はじめに
- **インポート**: \`⬆ インポート\` ボタン、または \`.md\` ファイルをサイドバーへ**ドラッグ**
- **新規ファイル / フォルダ**: \`＋ ファイル\`, \`＋ フォルダ\`
- **編集**: ファイルを開いて \`編集\` — 左が編集、右がライブプレビュー

## ファイル管理
- **移動**: 別のフォルダへドラッグ（複数選択: \`Ctrl/⌘・Shift+クリック\`）
- **画像**: 編集中に \`🖼\` ボタン、または貼り付け / ドラッグ

## 検索・移動
- **全体検索**: サイドバーの検索 / **文書内検索**: 表示中に \`Ctrl/⌘+F\`
- **クイックオープン**: \`Ctrl/⌘+P\` / **目次・バックリンク・履歴**: 表示ツールバー

## その他
- **ウィキリンク** \`[[文書]]\`、**タグ** \`#タグ\`、**グラフビュー**、**バージョン履歴**
- **バックアップ**: \`⋯\` メニュー → 書き出し / 復元

## ショートカット
| キー (Mac は ⌘、その他は Ctrl) | 動作 |
|---|---|
| \`Ctrl/⌘ + S\` | 保存 |
| \`Ctrl/⌘ + B / I / K\` | 太字 / 斜体 / リンク |
| \`Ctrl/⌘ + Z\` (\`⇧Z\` でやり直し) | 元に戻す |
| \`Ctrl/⌘ + F\` | 検索 (表示: 文書内 / 編集: 検索・置換) |
| \`Ctrl/⌘ + P\` | クイックオープン |
| \`Enter\` / \`Esc\` / \`↑ ↓\` | ダイアログ・パレット・検索バー |

## Markdown
\`\`\`markdown
# 見出し
**太字**, *斜体*, \`コード\`
- [ ] タスク
| 表 | 見出し |
$E = mc^2$   (数式)
\`\`\`
`;

export function helpMd(locale: Locale): string {
  return locale === 'en' ? EN : locale === 'ja' ? JA : KO;
}
