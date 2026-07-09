import { storage } from '@/storage';

export interface GraphNode {
  id: string;
  name: string;
}
export interface GraphEdge {
  source: string;
  target: string;
}

/** 위키링크 관계 그래프 (노드=파일, 간선=[[링크]]). */
export async function buildGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const files = (await storage.listNodes()).filter((n) => n.type === 'file');
  const byBase = new Map(
    files.map((f) => [f.name.replace(/\.(md|markdown)$/i, '').toLowerCase(), f.id])
  );
  const edges: GraphEdge[] = [];
  for (const f of files) {
    const content = await storage.readFile(f.id);
    const re = /\[\[([^\]]+)\]\]/g;
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) {
      const target = m[1].split('|')[0].trim().replace(/\.(md|markdown)$/i, '').toLowerCase();
      const tid = byBase.get(target);
      if (tid && tid !== f.id && !seen.has(tid)) {
        seen.add(tid);
        edges.push({ source: f.id, target: tid });
      }
    }
  }
  return { nodes: files.map((f) => ({ id: f.id, name: f.name })), edges };
}
