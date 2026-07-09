'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKeybindings, ACTIONS, eventToCombo, displayCombo, type ActionId } from './useKeybindings';
import { useT } from '@/components/useI18n';

export function KeybindingsDialog({ onClose }: { onClose: () => void }) {
  const bindings = useKeybindings((s) => s.bindings);
  const setBinding = useKeybindings((s) => s.setBinding);
  const reset = useKeybindings((s) => s.reset);
  const t = useT();
  const [recording, setRecording] = useState<ActionId | null>(null);

  // 녹화 중: 키 입력을 캡처해 바인딩으로 저장 (다른 핸들러보다 먼저 가로챔).
  useEffect(() => {
    if (!recording) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === 'Escape') {
        setRecording(null);
        return;
      }
      const combo = eventToCombo(e);
      if (!combo) return; // 수식어만 눌린 상태면 대기
      setBinding(recording, combo);
      setRecording(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [recording, setBinding]);

  // 충돌(중복) 액션 집합.
  const conflicts = useMemo(() => {
    const byCombo = new Map<string, ActionId[]>();
    for (const a of ACTIONS) {
      const arr = byCombo.get(bindings[a.id]) ?? [];
      arr.push(a.id);
      byCombo.set(bindings[a.id], arr);
    }
    const s = new Set<ActionId>();
    for (const [, ids] of byCombo) if (ids.length > 1) ids.forEach((id) => s.add(id));
    return s;
  }, [bindings]);

  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="kb-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="kb-header">
          <span>{t('shortcutsTitle')}</span>
          <button className="toc-close" onClick={onClose} title={t('close')}>
            ×
          </button>
        </div>
        <ul className="kb-list">
          {ACTIONS.map((a) => (
            <li key={a.id} className={`kb-row${conflicts.has(a.id) ? ' conflict' : ''}`}>
              <span className="kb-label">{t(a.labelKey)}</span>
              <span className={`kb-combo${recording === a.id ? ' rec' : ''}`}>
                {recording === a.id ? t('kbPress') : displayCombo(bindings[a.id])}
              </span>
              <button className="kb-change" onClick={() => setRecording(a.id)}>
                {t('kbChange')}
              </button>
            </li>
          ))}
        </ul>
        {conflicts.size > 0 && <div className="kb-warn">⚠ {t('kbConflict')}</div>}
        <div className="kb-footer">
          <button className="btn-secondary" onClick={reset}>
            {t('kbReset')}
          </button>
          <button className="btn-primary" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
