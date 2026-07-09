'use client';

import { useCallback, useEffect, useState } from 'react';
import { storage } from '@/storage';
import { useTreeStore } from '@/features/tree/useTreeStore';
import { confirmDialog } from '@/components/dialog';
import { useT, tr } from '@/components/useI18n';
import type { Snapshot } from '@/types/models';

interface Props {
  fileId: string | null;
  onClose: () => void;
}

export function HistoryPanel({ fileId, onClose }: Props) {
  const [snaps, setSnaps] = useState<Snapshot[]>([]);
  const applyExternalContent = useTreeStore((s) => s.applyExternalContent);
  const selectedContent = useTreeStore((s) => s.selectedContent);
  const t = useT();

  const load = useCallback(async () => {
    if (!fileId) return setSnaps([]);
    setSnaps(await storage.listSnapshots(fileId));
  }, [fileId]);

  useEffect(() => {
    void load();
  }, [load, selectedContent]); // 저장(내용 변경) 때마다 갱신

  const restore = async (snap: Snapshot) => {
    const ok = await confirmDialog(
      tr('revertTitle'),
      tr('revertMsg').replace('{time}', new Date(snap.savedAt).toLocaleString()),
      { okLabel: tr('revert') }
    );
    if (!ok || !fileId) return;
    await applyExternalContent(fileId, snap.content);
    await load();
  };

  return (
    <div className="toc-panel">
      <div className="toc-header">
        <span>{t('historyTitle')}</span>
        <button className="toc-close" onClick={onClose} title={t('close')}>
          ×
        </button>
      </div>
      {snaps.length === 0 ? (
        <div className="toc-empty">{t('historyEmpty')}</div>
      ) : (
        <ul className="hist-list">
          {snaps.map((s, i) => (
            <li key={s.id} className="hist-item" onClick={() => void restore(s)}>
              <div className="hist-time">
                {new Date(s.savedAt).toLocaleString()}
                {i === 0 && <span className="hist-badge">{t('latest')}</span>}
              </div>
              <div className="hist-preview">
                {s.content.replace(/\s+/g, ' ').trim().slice(0, 60) || t('emptyDoc')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
