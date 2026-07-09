import type { FsNode, Asset, SearchHit, BackupData, Snapshot } from '@/types/models';

/**
 * 모든 저장소 접근이 통과하는 인터페이스.
 * 이 추상화 덕분에 나중에 IndexedDbAdapter → TauriFsAdapter로 교체해도
 * UI/렌더러/스토어는 손대지 않는다. (데스크톱 이관의 핵심)
 */
export interface StorageAdapter {
  /** 전체 노드(폴더+파일) 평면 리스트. 트리는 화면단에서 조립. */
  listNodes(): Promise<FsNode[]>;
  /** 파일 본문(원본 markdown) 읽기. */
  readFile(nodeId: string): Promise<string>;
  /** 파일 본문 저장 (에디터 확장 대비). */
  updateFile(nodeId: string, content: string): Promise<void>;
  /** 폴더 생성. */
  createFolder(parentId: string | null, name: string): Promise<FsNode>;
  /** 파일 가져오기(import) — 앱 내부 저장소에 새 파일로 저장. */
  importFile(parentId: string | null, name: string, content: string): Promise<FsNode>;
  /** 이름 변경. */
  rename(nodeId: string, name: string): Promise<void>;
  /** 다른 폴더로 이동. */
  move(nodeId: string, parentId: string | null): Promise<void>;
  /** 삭제 (폴더면 하위까지 재귀 삭제). */
  delete(nodeId: string): Promise<void>;
  /** 첨부(이미지 등) 추가. 생성된 asset id 반환. */
  addAsset(nodeId: string, blob: Blob, mime: string): Promise<string>;
  /** 첨부(이미지 등) 읽기. */
  readAsset(assetId: string): Promise<Asset | undefined>;
  /** 파일 이름·내용 전체 검색 (기본은 대소문자 무시). */
  searchFiles(query: string, caseSensitive?: boolean): Promise<SearchHit[]>;
  /** 문서 버전 스냅샷 기록 (직전과 동일하면 스킵, 파일당 최근 50개 유지). */
  addSnapshot(nodeId: string, content: string): Promise<void>;
  /** 문서의 스냅샷 목록 (최신 우선). */
  listSnapshots(nodeId: string): Promise<Snapshot[]>;
  /** 스냅샷 한 건 조회. */
  getSnapshot(id: string): Promise<Snapshot | undefined>;
  /** 전체 저장소를 백업 데이터로 내보내기. */
  exportAll(): Promise<BackupData>;
  /** 백업 데이터로 전체 복원 (기존 데이터는 대체). */
  importAll(data: BackupData): Promise<void>;
}
