import { IndexedDbAdapter } from './IndexedDbAdapter';
import type { StorageAdapter } from './StorageAdapter';

/**
 * 앱 전역에서 사용하는 저장소 인스턴스 (DI 지점).
 * 데스크톱(Tauri) 전환 시 이 한 줄만 TauriFsAdapter로 바꾸면 된다.
 */
export const storage: StorageAdapter = new IndexedDbAdapter();
