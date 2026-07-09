import type { Locale } from '@/components/useI18n';

export interface Template {
  id: string;
  name: string;
  body: string;
}

const NAMES: Record<string, Record<Locale, string>> = {
  meeting: { ko: '회의록', en: 'Meeting notes', ja: '議事録' },
  note: { ko: '기본 노트', en: 'Basic note', ja: '基本ノート' },
};

const BODIES: Record<string, Record<Locale, string>> = {
  meeting: {
    ko: `# 회의록\n\n- 일시: \n- 참석: \n\n## 안건\n\n## 논의\n\n## 결정 사항\n\n## 할 일\n- [ ] \n`,
    en: `# Meeting notes\n\n- Date: \n- Attendees: \n\n## Agenda\n\n## Discussion\n\n## Decisions\n\n## Action items\n- [ ] \n`,
    ja: `# 議事録\n\n- 日時: \n- 出席者: \n\n## 議題\n\n## 議論\n\n## 決定事項\n\n## タスク\n- [ ] \n`,
  },
  note: {
    ko: `# 제목\n\n\n`,
    en: `# Title\n\n\n`,
    ja: `# タイトル\n\n\n`,
  },
};

export function getTemplates(locale: Locale): Template[] {
  return [
    { id: 'meeting', name: NAMES.meeting[locale], body: BODIES.meeting[locale] },
    { id: 'note', name: NAMES.note[locale], body: BODIES.note[locale] },
  ];
}

const DAILY_HEADINGS: Record<Locale, [string, string]> = {
  ko: ['오늘 할 일', '메모'],
  en: ['To-do', 'Notes'],
  ja: ['やること', 'メモ'],
};

/** 데일리 노트 본문. */
export function dailyContent(dateStr: string, locale: Locale): string {
  const [a, b] = DAILY_HEADINGS[locale];
  return `# ${dateStr}\n\n## ${a}\n- [ ] \n\n## ${b}\n\n`;
}

/** YYYY-MM-DD 형식의 오늘 날짜. */
export function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
