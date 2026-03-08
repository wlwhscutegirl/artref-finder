// ============================================
// 이미지 색상 팔레트 추출 (Phase 6)
// Canvas API getImageData 기반 주요 색상 추출
// ============================================

/** RGB 색상 */
interface RGB {
  r: number;
  g: number;
  b: number;
}

/** RGB → hex 변환 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** 두 RGB 색상 간 거리 (유클리드) */
function colorDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

/**
 * 중앙값 분할(Median Cut) 기반 색상 양자화
 * 이미지 픽셀을 count개의 대표 색상으로 클러스터링
 */
function medianCut(pixels: RGB[], count: number): RGB[] {
  if (pixels.length === 0) return [];
  if (count <= 1 || pixels.length <= count) {
    // 평균 색상 반환
    const avg = pixels.reduce(
      (acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }),
      { r: 0, g: 0, b: 0 }
    );
    const n = pixels.length;
    return [{ r: Math.round(avg.r / n), g: Math.round(avg.g / n), b: Math.round(avg.b / n) }];
  }

  // 각 채널의 범위 계산
  let rMin = 255, rMax = 0, gMin = 255, gMax = 0, bMin = 255, bMax = 0;
  for (const p of pixels) {
    if (p.r < rMin) rMin = p.r;
    if (p.r > rMax) rMax = p.r;
    if (p.g < gMin) gMin = p.g;
    if (p.g > gMax) gMax = p.g;
    if (p.b < bMin) bMin = p.b;
    if (p.b > bMax) bMax = p.b;
  }

  // 범위가 가장 넓은 채널을 기준으로 분할
  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  let sortKey: keyof RGB;
  if (rRange >= gRange && rRange >= bRange) sortKey = 'r';
  else if (gRange >= bRange) sortKey = 'g';
  else sortKey = 'b';

  pixels.sort((a, b) => a[sortKey] - b[sortKey]);

  const mid = Math.floor(pixels.length / 2);
  const left = medianCut(pixels.slice(0, mid), Math.ceil(count / 2));
  const right = medianCut(pixels.slice(mid), Math.floor(count / 2));

  return [...left, ...right];
}

/**
 * 이미지 URL에서 주요 색상 N개 추출
 * @param imageUrl 이미지 URL
 * @param count 추출할 색상 수 (기본 5)
 * @returns hex 색상 배열
 */
export async function extractPalette(imageUrl: string, count: number = 5): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 성능을 위해 작은 캔버스에 리사이즈
      const maxSize = 64;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;

      // 픽셀 데이터를 RGB 배열로 변환 (너무 어둡거나 밝은 픽셀 제외)
      const pixels: RGB[] = [];
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        // 투명 픽셀 제외, 극단적 흑백 제외
        if (a < 128) continue;
        const brightness = (r + g + b) / 3;
        if (brightness < 15 || brightness > 240) continue;
        pixels.push({ r, g, b });
      }

      if (pixels.length === 0) {
        resolve([]);
        return;
      }

      // 중앙값 분할로 대표 색상 추출
      const palette = medianCut(pixels, count);

      // 중복 비슷한 색상 제거 (거리 30 미만이면 병합)
      const unique: RGB[] = [];
      for (const color of palette) {
        if (!unique.some((u) => colorDistance(u, color) < 30)) {
          unique.push(color);
        }
      }

      resolve(unique.slice(0, count).map((c) => rgbToHex(c.r, c.g, c.b)));
    };

    img.onerror = () => resolve([]);
    img.src = imageUrl;
  });
}

/**
 * 여러 이미지의 팔레트를 병합하여 통합 팔레트 생성
 * @param palettes 각 이미지의 hex 색상 배열
 * @param count 최종 팔레트 색상 수 (기본 8)
 */
export function mergePalettes(palettes: string[][], count: number = 8): string[] {
  // 모든 색상을 모아서 빈도 카운트
  const freq = new Map<string, number>();
  for (const palette of palettes) {
    for (const hex of palette) {
      freq.set(hex, (freq.get(hex) || 0) + 1);
    }
  }

  // 빈도 순 정렬 후 상위 count개 반환
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([hex]) => hex);
}
