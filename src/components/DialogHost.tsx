'use client';

import { useEffect, useState } from 'react';
import { useDialogStore } from './dialog';
import { useT } from './useI18n';

/** 앱에 하나만 두는 중앙 모달 호스트. dialog.ts의 promptDialog/confirmDialog로 구동된다. */
export function DialogHost() {
  const { open, kind, title, message, defaultValue, okLabel, danger, resolve, close } =
    useDialogStore();
  const t = useT();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue(defaultValue);
  }, [open, defaultValue]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'Enter') finish(kind === 'prompt' ? value : true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, value]);

  if (!open) return null;

  const finish = (result: string | boolean | null) => {
    resolve?.(result);
    close();
  };

  const onOk = () => finish(kind === 'prompt' ? value : true);
  const onCancel = () => finish(kind === 'prompt' ? null : false);

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {message && <div className="modal-message">{message}</div>}
        {kind === 'prompt' && (
          <input
            className="modal-input"
            value={value}
            autoFocus
            onFocus={(e) => e.target.select()}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            {t('cancel')}
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onOk}
            disabled={kind === 'prompt' && value.trim() === ''}
          >
            {okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
