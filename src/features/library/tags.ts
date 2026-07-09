import { storage } from '@/storage';

// #뒤에 공백 없이 이어지는 단어를 태그로 (제목 '# 제목'은 공백이라 제외).
const TAG_RE = /(?:^|\s)#([\p{L}\p{N}_/-]+)/gu;

export function extractTags(content: string): string[] {
  const tags = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = TAG_RE.exec(content))) tags.add(m[1]);
  return [...tags];
}

/** 전체 파일을 스캔해 태그 → 파일 id 목록 맵을 만든다. */
export async function collectTags(): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  const files = (await storage.listNodes()).filter((n) => n.type === 'file');
  for (const f of files) {
    const content = await storage.readFile(f.id);
    for (const tag of extractTags(content)) {
      const arr = map.get(tag) ?? [];
      arr.push(f.id);
      map.set(tag, arr);
    }
  }
  return map;
}
