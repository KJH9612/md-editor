export interface DocStats {
  chars: number; // 공백 포함 글자 수
  words: number; // 공백 기준 단어 수
  minutes: number; // 대략 읽기 시간(분)
}

export function docStats(text: string): DocStats {
  const chars = text.length;
  const noSpace = text.replace(/\s/g, '').length;
  const words = (text.trim().match(/\S+/g) || []).length;
  // 한글·영문 혼용 대략치: 분당 500자 기준, 최소 1분.
  const minutes = Math.max(1, Math.round(noSpace / 500));
  return { chars, words, minutes };
}
