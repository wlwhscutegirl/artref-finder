// ============================================
// 이미지 조명 방향 분석기
// Canvas 기반 밝기 그래디언트 분석으로
// 주광원 방향을 추정하는 P1 단계 구현
// ============================================

import type { LightDirection } from '@/types';

/** 3×3 그리드 영역 인덱스 */
type GridIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** 3×3 그리드의 각 영역별 평균 휘도 */
interface BrightnessGrid {
  /** [topLeft, topCenter, topRight, midLeft, midCenter, midRight, botLeft, botCenter, botRight] */
  cells: [number, number, number, number, number, number, number, number, number];
}

/**
 * 이미지 URL로부터 3×3 그리드 평균 휘도를 계산
 * Canvas API를 사용하여 픽셀 단위 밝기 분석
 * @param imageUrl 분석할 이미지 URL
 * @returns 3×3 그리드 휘도 (0~255)
 */
export async function analyzeImageBrightness(imageUrl: string): Promise<BrightnessGrid> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // 분석용 작은 캔버스 (성능 최적화)
      const size = 90; // 3×3 그리드 → 각 셀 30×30
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다'));
        return;
      }

      // 이미지를 캔버스에 축소 그리기
      ctx.drawImage(img, 0, 0, size, size);
      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;

      const cellSize = size / 3;
      const cells: number[] = [];

      // 3×3 그리드 각 셀의 평균 휘도 계산
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          let totalLuminance = 0;
          let pixelCount = 0;

          const startX = Math.floor(col * cellSize);
          const endX = Math.floor((col + 1) * cellSize);
          const startY = Math.floor(row * cellSize);
          const endY = Math.floor((row + 1) * cellSize);

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx = (y * size + x) * 4;
              // ITU-R BT.709 가중 휘도 공식
              const luminance = 0.2126 * pixels[idx] + 0.7152 * pixels[idx + 1] + 0.0722 * pixels[idx + 2];
              totalLuminance += luminance;
              pixelCount++;
            }
          }

          cells.push(pixelCount > 0 ? totalLuminance / pixelCount : 0);
        }
      }

      resolve({ cells: cells as BrightnessGrid['cells'] });
    };

    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다'));
    img.src = imageUrl;
  });
}

/**
 * 3×3 밝기 그리드로부터 주광원 방향을 추정
 * 밝은 영역의 방향 벡터 가중 합산으로 방향 결정
 *
 * 그리드 배치:
 *   [0][1][2]   좌상 / 상 / 우상
 *   [3][4][5]   좌  / 중  / 우
 *   [6][7][8]   좌하 / 하 / 우하
 *
 * @param grid 3×3 밝기 그리드
 * @returns 추정된 조명 방향
 */
export function estimateLightDirection(grid: BrightnessGrid): LightDirection {
  const c = grid.cells;

  // 전체 평균 밝기 (강도 추정용)
  const avgBrightness = c.reduce((sum, v) => sum + v, 0) / 9;

  // 수평 그래디언트: 오른쪽이 밝으면 양수 (빛이 오른쪽에서 옴)
  const horizontalGrad =
    (c[2] + c[5] + c[8]) / 3 - (c[0] + c[3] + c[6]) / 3;

  // 수직 그래디언트: 위쪽이 밝으면 양수 (빛이 위에서 옴)
  const verticalGrad =
    (c[0] + c[1] + c[2]) / 3 - (c[6] + c[7] + c[8]) / 3;

  // 수평 각도(azimuth) 계산: atan2로 방향 결정
  // 정면광(0°) = 카메라 방향, 시계 방향 증가
  let azimuth = Math.atan2(-horizontalGrad, -verticalGrad) * (180 / Math.PI);
  // 0~360 범위로 정규화
  azimuth = ((azimuth % 360) + 360) % 360;

  // 수직 각도(elevation): 그래디언트 크기로 추정
  const gradMagnitude = Math.sqrt(horizontalGrad ** 2 + verticalGrad ** 2);
  // 그래디언트가 약하면 정면광 → elevation ≈ 0
  // 상부가 매우 밝으면 탑라이트 → elevation 높음
  const topAvg = (c[0] + c[1] + c[2]) / 3;
  const botAvg = (c[6] + c[7] + c[8]) / 3;
  const elevation = Math.min(90, Math.max(-30, ((topAvg - botAvg) / 255) * 90));

  // 강도: 밝기 분산으로 추정 (대비가 강하면 하드라이트)
  const variance = c.reduce((sum, v) => sum + (v - avgBrightness) ** 2, 0) / 9;
  const normalizedVariance = Math.min(1, Math.sqrt(variance) / 80);
  const intensity = Math.max(0.2, Math.min(1.0, 0.3 + normalizedVariance * 0.7));

  return { azimuth, elevation, intensity };
}

/**
 * 이미지 URL로부터 조명 방향을 한 번에 분석
 * 편의 함수: analyzeImageBrightness + estimateLightDirection
 */
export async function analyzeLightFromImage(imageUrl: string): Promise<LightDirection> {
  const grid = await analyzeImageBrightness(imageUrl);
  return estimateLightDirection(grid);
}
