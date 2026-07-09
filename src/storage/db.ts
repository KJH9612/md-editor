import Dexie, { type Table } from 'dexie';
import type { FsNode, FileDoc, Asset, Snapshot } from '@/types/models';

/** 앱 내부 저장소 (IndexedDB). 브라우저에서만 인스턴스화된다 (AppShell이 ssr:false). */
export class MdViewerDB extends Dexie {
  nodes!: Table<FsNode, string>;
  files!: Table<FileDoc, string>;
  assets!: Table<Asset, string>;
  snapshots!: Table<Snapshot, string>;

  constructor() {
    super('md-viewer');
    this.version(1).stores({
      nodes: 'id, parentId, type, order',
      files: 'nodeId',
      assets: 'id, nodeId',
    });
    this.version(2).stores({
      snapshots: 'id, nodeId, savedAt', // 버전 히스토리
    });
  }
}

export const db = new MdViewerDB();
