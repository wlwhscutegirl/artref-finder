// ============================================
// 무드보드 내보내기 유틸 (Phase 6)
// html2canvas 기반 이미지/PDF 캡처
// lz-string 기반 공유 URL 인코딩
// ============================================

import html2canvas from 'html2canvas';
import LZString from 'lz-string';
import type { Collection } from '@/types';

/** 내보내기 옵션 */
interface ExportOptions {
  /** 이미지 포맷 (기본: png) */
  format?: 'png' | 'jpeg';
  /** JPEG 품질 (0~1, 기본: 0.9) */
  quality?: number;
  /** 파일 이름 (확장자 제외) */
  fileName?: string;
}

/**
 * 무드보드 DOM 요소를 이미지로 캡처하여 다운로드
 * @param element 캡처할 DOM 요소
 * @param options 내보내기 옵션
 */
export async function exportAsImage(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { format = 'png', quality = 0.9, fileName } = options;

  // html2canvas로 DOM → Canvas 변환
  const canvas = await html2canvas(element, {
    backgroundColor: '#0a0a0a', // 다크 배경
    scale: 2, // 2배 해상도 (레티나)
    useCORS: true, // 외부 이미지 CORS 허용
    logging: false,
  });

  // Canvas → Blob → 다운로드
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpeg' ? 'jpg' : 'png';
  const name = fileName || `moodboard_${new Date().toISOString().slice(0, 10)}`;

  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    },
    mimeType,
    quality
  );
}

/**
 * 컬렉션 데이터를 LZ-string 압축 → base64 URL 인코딩
 * 공유 URL 생성용
 */
export function encodeShareUrl(collection: Collection): string {
  // 공유에 필요한 최소 데이터만 직렬화
  const shareData = {
    n: collection.name,
    d: collection.description || '',
    i: collection.imageIds,
    l: collection.layout || 'grid',
    c: collection.gridColumns || 3,
    a: collection.annotations || {},
  };

  const json = JSON.stringify(shareData);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return compressed;
}

/**
 * 압축된 공유 URL 데이터를 디코딩하여 컬렉션 데이터 복원
 */
export function decodeShareUrl(encoded: string): Partial<Collection> | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;

    const data = JSON.parse(json);
    return {
      name: data.n || '공유된 무드보드',
      description: data.d || '',
      imageIds: data.i || [],
      layout: data.l || 'grid',
      gridColumns: data.c || 3,
      annotations: data.a || {},
    };
  } catch {
    return null;
  }
}
