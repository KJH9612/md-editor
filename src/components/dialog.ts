import { create } from 'zustand';
import { tr } from './useI18n';

type DialogKind = 'prompt' | 'confirm';

interface DialogState {
  open: boolean;
  kind: DialogKind;
  title: string;
  message?: string;
  defaultValue: string;
  okLabel: string;
  danger: boolean;
  resolve: ((value: string | boolean | null) => void) | null;
  close: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  open: false,
  kind: 'prompt',
  title: '',
  message: undefined,
  defaultValue: '',
  okLabel: '확인',
  danger: false,
  resolve: null,
  close: () => set({ open: false, resolve: null }),
}));

/** 중앙 모달로 텍스트 입력을 받는다. 취소 시 null. */
export function promptDialog(title: string, defaultValue = ''): Promise<string | null> {
  return new Promise((resolve) => {
    useDialogStore.setState({
      open: true,
      kind: 'prompt',
      title,
      message: undefined,
      defaultValue,
      okLabel: tr('ok'),
      danger: false,
      resolve: (v) => resolve(v as string | null),
    });
  });
}

/** 중앙 모달로 확인/취소를 받는다. */
export function confirmDialog(
  title: string,
  message?: string,
  opts?: { okLabel?: string; danger?: boolean }
): Promise<boolean> {
  return new Promise((resolve) => {
    useDialogStore.setState({
      open: true,
      kind: 'confirm',
      title,
      message,
      defaultValue: '',
      okLabel: opts?.okLabel ?? tr('ok'),
      danger: opts?.danger ?? false,
      resolve: (v) => resolve(Boolean(v)),
    });
  });
}
