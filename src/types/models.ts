export type NodeType = 'folder' | 'file';

/** 폴더 트리의 한 노드 (파일 또는 폴더). 인접 리스트(parentId) 방식. */
export interface FsNode {
  id: string;
  parentId: string | null; // null = 루트
  type: NodeType;
  name: string;
  order: number; // 형제 정렬용
  createdAt: number;
  updatedAt: number;
}

/** 파일 본문 (원본 markdown). nodeId는 FsNode.id와 동일. */
export interface FileDoc {
  nodeId: string;
  content: string;
}

/** 이미지 등 바이너리 첨부 (MVP 이후 사용). */
export interface Asset {
  id: string;
  nodeId: string; // 소유 문서
  blob: Blob;
  mime: string;
}

/** 검색 결과 한 건. */
export interface SearchHit {
  nodeId: string;
  name: string;
  snippet: string | null; // 내용 매칭 시 주변 텍스트 (이름만 매칭이면 null)
}

/** 문서 버전 스냅샷. */
export interface Snapshot {
  id: string;
  nodeId: string;
  content: string;
  savedAt: number;
}

/** 전체 백업 데이터 (JSON 직렬화용). assets는 base64로 인코딩. */
export interface BackupData {
  version: 1;
  exportedAt: string;
  nodes: FsNode[];
  files: FileDoc[];
  assets: { id: string; nodeId: string; mime: string; data: string }[];
}
