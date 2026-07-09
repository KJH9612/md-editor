import { db } from './db';
import type { StorageAdapter } from './StorageAdapter';
import type { FsNode, Asset, SearchHit, BackupData, Snapshot } from '@/types/models';

function now(): number {
  return Date.now();
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** 매칭 위치 주변 텍스트를 잘라 스니펫으로 만든다. */
function makeSnippet(content: string, idx: number, len: number): string {
  const start = Math.max(0, idx - 30);
  const end = Math.min(content.length, idx + len + 40);
  let s = content.slice(start, end).replace(/\s+/g, ' ').trim();
  if (start > 0) s = '…' + s;
  if (end < content.length) s = s + '…';
  return s;
}

/** IndexedDB(Dexie) 기반 StorageAdapter 구현. */
export class IndexedDbAdapter implements StorageAdapter {
  async listNodes(): Promise<FsNode[]> {
    return db.nodes.toArray();
  }

  async readFile(nodeId: string): Promise<string> {
    const doc = await db.files.get(nodeId);
    return doc?.content ?? '';
  }

  async updateFile(nodeId: string, content: string): Promise<void> {
    await db.transaction('rw', db.files, db.nodes, async () => {
      await db.files.put({ nodeId, content });
      await db.nodes.update(nodeId, { updatedAt: now() });
    });
  }

  private async nextOrder(parentId: string | null): Promise<number> {
    // IndexedDB는 null을 키로 조회할 수 없으므로 루트는 인메모리 필터로 센다.
    if (parentId === null) {
      return db.nodes.filter((n) => n.parentId === null).count();
    }
    return db.nodes.where('parentId').equals(parentId).count();
  }

  async createFolder(parentId: string | null, name: string): Promise<FsNode> {
    const ts = now();
    const node: FsNode = {
      id: crypto.randomUUID(),
      parentId,
      type: 'folder',
      name,
      order: await this.nextOrder(parentId),
      createdAt: ts,
      updatedAt: ts,
    };
    await db.nodes.add(node);
    return node;
  }

  async importFile(parentId: string | null, name: string, content: string): Promise<FsNode> {
    const ts = now();
    const node: FsNode = {
      id: crypto.randomUUID(),
      parentId,
      type: 'file',
      name,
      order: await this.nextOrder(parentId),
      createdAt: ts,
      updatedAt: ts,
    };
    await db.transaction('rw', db.nodes, db.files, async () => {
      await db.nodes.add(node);
      await db.files.add({ nodeId: node.id, content });
    });
    return node;
  }

  async rename(nodeId: string, name: string): Promise<void> {
    await db.nodes.update(nodeId, { name, updatedAt: now() });
  }

  async move(nodeId: string, parentId: string | null): Promise<void> {
    await db.nodes.update(nodeId, {
      parentId,
      order: await this.nextOrder(parentId),
      updatedAt: now(),
    });
  }

  async delete(nodeId: string): Promise<void> {
    // 하위 노드를 재귀적으로 모아 한 번에 삭제.
    const all = await db.nodes.toArray();
    const childrenOf = new Map<string | null, FsNode[]>();
    for (const n of all) {
      const list = childrenOf.get(n.parentId) ?? [];
      list.push(n);
      childrenOf.set(n.parentId, list);
    }

    const toDelete: string[] = [];
    const stack = [nodeId];
    while (stack.length) {
      const id = stack.pop()!;
      toDelete.push(id);
      for (const child of childrenOf.get(id) ?? []) {
        stack.push(child.id);
      }
    }

    await db.transaction('rw', db.nodes, db.files, db.assets, db.snapshots, async () => {
      await db.nodes.bulkDelete(toDelete);
      await db.files.bulkDelete(toDelete);
      for (const id of toDelete) {
        await db.assets.where('nodeId').equals(id).delete();
        await db.snapshots.where('nodeId').equals(id).delete();
      }
    });
  }

  async addSnapshot(nodeId: string, content: string): Promise<void> {
    const list = await db.snapshots.where('nodeId').equals(nodeId).sortBy('savedAt');
    if (list.length && list[list.length - 1].content === content) return; // 동일하면 스킵
    await db.snapshots.add({ id: crypto.randomUUID(), nodeId, content, savedAt: now() });
    const all = await db.snapshots.where('nodeId').equals(nodeId).sortBy('savedAt');
    if (all.length > 50) {
      await db.snapshots.bulkDelete(all.slice(0, all.length - 50).map((s) => s.id));
    }
  }

  async listSnapshots(nodeId: string): Promise<Snapshot[]> {
    const list = await db.snapshots.where('nodeId').equals(nodeId).sortBy('savedAt');
    return list.reverse(); // 최신 우선
  }

  async getSnapshot(id: string): Promise<Snapshot | undefined> {
    return db.snapshots.get(id);
  }

  async addAsset(nodeId: string, blob: Blob, mime: string): Promise<string> {
    const id = crypto.randomUUID();
    await db.assets.add({ id, nodeId, blob, mime });
    return id;
  }

  async readAsset(assetId: string): Promise<Asset | undefined> {
    return db.assets.get(assetId);
  }

  async searchFiles(query: string, caseSensitive = false): Promise<SearchHit[]> {
    const raw = query.trim();
    if (!raw) return [];
    const q = caseSensitive ? raw : raw.toLowerCase();
    const norm = (s: string) => (caseSensitive ? s : s.toLowerCase());
    const fileNodes = await db.nodes.where('type').equals('file').toArray();
    const hits: SearchHit[] = [];
    for (const node of fileNodes) {
      const nameMatch = norm(node.name).includes(q);
      const content = (await db.files.get(node.id))?.content ?? '';
      const idx = norm(content).indexOf(q);
      if (nameMatch || idx >= 0) {
        hits.push({
          nodeId: node.id,
          name: node.name,
          snippet: idx >= 0 ? makeSnippet(content, idx, q.length) : null,
        });
      }
    }
    // 이름 매칭을 먼저, 그다음 이름순.
    hits.sort((a, b) => a.name.localeCompare(b.name));
    return hits;
  }

  async exportAll(): Promise<BackupData> {
    const [nodes, files, assetRows] = await Promise.all([
      db.nodes.toArray(),
      db.files.toArray(),
      db.assets.toArray(),
    ]);
    const assets = await Promise.all(
      assetRows.map(async (a) => ({
        id: a.id,
        nodeId: a.nodeId,
        mime: a.mime,
        data: await blobToBase64(a.blob),
      }))
    );
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      nodes,
      files,
      assets,
    };
  }

  async importAll(data: BackupData): Promise<void> {
    await db.transaction('rw', db.nodes, db.files, db.assets, db.snapshots, async () => {
      await Promise.all([db.nodes.clear(), db.files.clear(), db.assets.clear(), db.snapshots.clear()]);
      await db.nodes.bulkAdd(data.nodes);
      await db.files.bulkAdd(data.files);
      await db.assets.bulkAdd(
        data.assets.map((a) => ({
          id: a.id,
          nodeId: a.nodeId,
          mime: a.mime,
          blob: base64ToBlob(a.data, a.mime),
        }))
      );
    });
  }
}
