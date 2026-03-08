// ============================================
// 관절 각도 → 태그 자동 추천 (설계서 §11-2)
// 기즈모로 조작된 관절 각도를 분석하여
// 매칭되는 포즈 태그를 추천
// ============================================

import type { JointId } from '@/stores/pose-store';

/** 라디안 → 도(degrees) 변환 */
function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** 추천 태그 규칙 정의 */
interface TagRule {
  /** 추천할 태그 이름 */
  tag: string;
  /** 조건 판별 함수 (관절 회전값 Map → 조건 충족 여부) */
  condition: (joints: Record<JointId, [number, number, number]>) => boolean;
}

/**
 * 태그 추천 규칙 목록
 * 각 규칙은 관절 회전 상태를 분석하여 해당 포즈 태그를 추천
 */
const TAG_RULES: TagRule[] = [
  // ──── 상체 관련 태그 ────
  {
    // 양팔 들기 (어깨 Z축 회전 > 60°)
    tag: '만세',
    condition: (j) => {
      const leftZ = Math.abs(radToDeg(j.leftShoulder[2]));
      const rightZ = Math.abs(radToDeg(j.rightShoulder[2]));
      return leftZ > 60 && rightZ > 60;
    },
  },
  {
    // 한쪽 팔만 올림 (어깨 Z축 회전 > 60°)
    tag: '팔들기',
    condition: (j) => {
      const leftZ = Math.abs(radToDeg(j.leftShoulder[2]));
      const rightZ = Math.abs(radToDeg(j.rightShoulder[2]));
      return (leftZ > 60 && rightZ <= 60) || (rightZ > 60 && leftZ <= 60);
    },
  },
  {
    // 팔 뻗기 (어깨 X축 회전 > 45°)
    tag: '팔뻗기',
    condition: (j) => {
      const leftX = Math.abs(radToDeg(j.leftShoulder[0]));
      const rightX = Math.abs(radToDeg(j.rightShoulder[0]));
      return leftX > 45 || rightX > 45;
    },
  },
  {
    // 팔짱 (양쪽 팔꿈치 X축 굽힘 > 90° + 어깨 약간 회전)
    tag: '팔짱',
    condition: (j) => {
      const leftElbowX = Math.abs(radToDeg(j.leftElbow[0]));
      const rightElbowX = Math.abs(radToDeg(j.rightElbow[0]));
      return leftElbowX > 80 && rightElbowX > 80;
    },
  },

  // ──── 머리/목 관련 태그 ────
  {
    // 고개 숙이기 (목 X축 회전 > 20°)
    tag: '고개숙임',
    condition: (j) => {
      return radToDeg(j.neck[0]) > 20;
    },
  },
  {
    // 고개 돌림 (목 Y축 회전 > 25°)
    tag: '고개돌림',
    condition: (j) => {
      return Math.abs(radToDeg(j.neck[1])) > 25;
    },
  },
  {
    // 뒤돌아보기 (골반 Y축 + 목 Y축이 반대 방향)
    tag: '뒤돌아보기',
    condition: (j) => {
      const pelvisY = radToDeg(j.pelvis[1]);
      const neckY = radToDeg(j.neck[1]);
      return Math.abs(pelvisY) > 20 && Math.abs(neckY) > 20 && Math.sign(pelvisY) !== Math.sign(neckY);
    },
  },

  // ──── 하체 관련 태그 ────
  {
    // 앉기 (양쪽 엉덩이 X축 굽힘 > 60°)
    tag: '앉기',
    condition: (j) => {
      const leftHipX = radToDeg(j.leftHip[0]);
      const rightHipX = radToDeg(j.rightHip[0]);
      return leftHipX > 60 && rightHipX > 60;
    },
  },
  {
    // 웅크리기 (엉덩이 + 무릎 모두 굽힘)
    tag: '웅크리기',
    condition: (j) => {
      const leftHipX = radToDeg(j.leftHip[0]);
      const leftKneeX = radToDeg(j.leftKnee[0]);
      const rightHipX = radToDeg(j.rightHip[0]);
      const rightKneeX = radToDeg(j.rightKnee[0]);
      return leftHipX > 80 && leftKneeX > 80 && rightHipX > 80 && rightKneeX > 80;
    },
  },
  {
    // 걷기 (양쪽 다리가 전후로 벌어짐)
    tag: '걷기',
    condition: (j) => {
      const leftHipX = radToDeg(j.leftHip[0]);
      const rightHipX = radToDeg(j.rightHip[0]);
      // 한쪽은 앞으로, 한쪽은 뒤로 (부호 반대 + 각도 > 15°)
      return Math.abs(leftHipX - rightHipX) > 30 && Math.abs(leftHipX) > 15 && Math.abs(rightHipX) > 15;
    },
  },
  {
    // 달리기 (걷기보다 큰 벌림 + 무릎 굽힘)
    tag: '달리기',
    condition: (j) => {
      const leftHipX = radToDeg(j.leftHip[0]);
      const rightHipX = radToDeg(j.rightHip[0]);
      const kneeFlexion = Math.max(
        Math.abs(radToDeg(j.leftKnee[0])),
        Math.abs(radToDeg(j.rightKnee[0]))
      );
      return Math.abs(leftHipX - rightHipX) > 50 && kneeFlexion > 30;
    },
  },
  {
    // 점프 (양 무릎 굽힘 + 양 팔 올림)
    tag: '점프',
    condition: (j) => {
      const leftShoulderZ = Math.abs(radToDeg(j.leftShoulder[2]));
      const rightShoulderZ = Math.abs(radToDeg(j.rightShoulder[2]));
      const leftKneeX = Math.abs(radToDeg(j.leftKnee[0]));
      const rightKneeX = Math.abs(radToDeg(j.rightKnee[0]));
      return leftShoulderZ > 45 && rightShoulderZ > 45 && leftKneeX > 30 && rightKneeX > 30;
    },
  },

  // ──── 전신 포즈 태그 ────
  {
    // 기대기 (척추/흉부 Z축 기울어짐)
    tag: '기대기',
    condition: (j) => {
      const spineZ = Math.abs(radToDeg(j.spine[2]));
      const chestZ = Math.abs(radToDeg(j.chest[2]));
      return spineZ > 15 || chestZ > 15;
    },
  },
  {
    // 서있기 (모든 관절이 거의 기본 상태에 가까움)
    tag: '서있기',
    condition: (j) => {
      const threshold = 10; // 10도 이내면 "거의 안 움직임"
      const checkJoints: JointId[] = ['pelvis', 'spine', 'chest', 'leftHip', 'rightHip', 'leftKnee', 'rightKnee'];
      return checkJoints.every((id) =>
        j[id].every((v) => Math.abs(radToDeg(v)) < threshold)
      );
    },
  },
];

/**
 * 현재 관절 회전 상태에서 매칭되는 태그 목록 추출
 * @param joints 모든 관절의 회전값 (라디안)
 * @returns 매칭된 태그 이름 배열
 */
export function recommendTagsFromJoints(
  joints: Record<JointId, [number, number, number]>
): string[] {
  const matched: string[] = [];

  for (const rule of TAG_RULES) {
    try {
      if (rule.condition(joints)) {
        matched.push(rule.tag);
      }
    } catch {
      // 관절 데이터 누락 시 무시
    }
  }

  return matched;
}
