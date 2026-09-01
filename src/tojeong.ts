import { lunarToSolar } from "./manse.ts";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

// 토정비결 수리에서 쓰는 선천수·중천수의 공개 조견값.
const FIRST_STEM_NUMBERS = [9, 8, 7, 6, 5, 9, 8, 7, 6, 5] as const;
const FIRST_BRANCH_NUMBERS = [9, 8, 7, 6, 5, 4, 9, 8, 7, 6, 5, 4] as const;
const MIDDLE_STEM_NUMBERS = [11, 10, 9, 8, 7, 11, 10, 9, 8, 7] as const;
const MIDDLE_BRANCH_NUMBERS = [9, 11, 8, 8, 11, 7, 7, 11, 10, 10, 11, 9] as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_PILLAR_BASE = Date.UTC(1992, 9, 24);
const DAY_PILLAR_BASE_INDEX = 9;

export type TojeongGuaPart = {
  number: number;
  name: string;
  hanja: string;
};

export type TojeongCalculationInput = {
  lunarBirthYear: number;
  lunarBirthMonth: number;
  lunarBirthDay: number;
  targetYear: number;
};

export type TojeongCalculation = {
  targetYear: number;
  targetYearGanji: string;
  targetMonthGanji: string;
  targetDayGanji: string;
  lunarBirth: { year: number; month: number; day: number };
  koreanAge: number;
  monthDays: 29 | 30;
  numbers: { taese: number; monthGun: number; iljin: number };
  sums: { upper: number; middle: number; lower: number };
  gua: { upper: TojeongGuaPart; middle: TojeongGuaPart; lower: TojeongGuaPart };
  guaCode: string;
  serialNumber: number;
  formulas: { upper: string; middle: string; lower: string };
};

const UPPER_GUA = [
  { hanja: "乾", name: "하늘" },
  { hanja: "兌", name: "못" },
  { hanja: "離", name: "불" },
  { hanja: "震", name: "우레" },
  { hanja: "巽", name: "바람" },
  { hanja: "坎", name: "물" },
  { hanja: "艮", name: "산" },
  { hanja: "坤", name: "땅" },
] as const;

const MIDDLE_GUA = ["싹틔움", "움직임", "확장", "조율", "수확", "정리"] as const;
const LOWER_GUA = ["시작", "전개", "마무리"] as const;

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function remainderAsTraditionalNumber(value: number, divisor: number): number {
  const remainder = mod(value, divisor);
  return remainder === 0 ? divisor : remainder;
}

function validateInput(input: TojeongCalculationInput): void {
  if (!Number.isInteger(input.targetYear) || input.targetYear < 1900 || input.targetYear > 2099) {
    throw new Error("토정비결 대상 연도는 1900년부터 2099년까지 지원합니다.");
  }
  if (!Number.isInteger(input.lunarBirthYear) || input.lunarBirthYear < 1900 || input.lunarBirthYear > 2099) {
    throw new Error("음력 출생 연도는 1900년부터 2099년까지 지원합니다.");
  }
  if (!Number.isInteger(input.lunarBirthMonth) || input.lunarBirthMonth < 1 || input.lunarBirthMonth > 12) {
    throw new Error("음력 출생 월은 1월부터 12월까지 지원합니다.");
  }
  if (!Number.isInteger(input.lunarBirthDay) || input.lunarBirthDay < 1 || input.lunarBirthDay > 30) {
    throw new Error("음력 출생일은 1일부터 30일까지 지원합니다.");
  }
}

function sexagenaryIndex(year: number): number {
  return mod(year - 4, 60);
}

function ganjiFromIndex(index: number): string {
  return `${STEMS[mod(index, 10)]}${BRANCHES[mod(index, 12)]}`;
}

function yearPillar(year: number): { stemIndex: number; branchIndex: number; ganji: string } {
  const index = sexagenaryIndex(year);
  return { stemIndex: index % 10, branchIndex: index % 12, ganji: ganjiFromIndex(index) };
}

function monthPillar(year: number, lunarMonth: number): { stemIndex: number; branchIndex: number; ganji: string } {
  const yearStemIndex = mod(year - 4, 10);
  const firstMonthStem = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0][yearStemIndex];
  const stemIndex = mod(firstMonthStem + lunarMonth - 1, 10);
  const branchIndex = mod(2 + lunarMonth - 1, 12);
  return { stemIndex, branchIndex, ganji: `${STEMS[stemIndex]}${BRANCHES[branchIndex]}` };
}

function dayPillar(year: number, month: number, day: number): { stemIndex: number; branchIndex: number; ganji: string } {
  const targetDate = Date.UTC(year, month - 1, day);
  const daysDiff = Math.floor((targetDate - DAY_PILLAR_BASE) / DAY_MS);
  const index = mod(DAY_PILLAR_BASE_INDEX + daysDiff, 60);
  return { stemIndex: index % 10, branchIndex: index % 12, ganji: ganjiFromIndex(index) };
}

function getNumbers(stemIndex: number, branchIndex: number) {
  return {
    taese: MIDDLE_STEM_NUMBERS[stemIndex] + MIDDLE_BRANCH_NUMBERS[branchIndex],
    monthGun: FIRST_STEM_NUMBERS[stemIndex] + FIRST_BRANCH_NUMBERS[branchIndex],
    iljin: FIRST_STEM_NUMBERS[stemIndex] + MIDDLE_BRANCH_NUMBERS[branchIndex],
  };
}

function lunarMonthDays(year: number, month: number): 29 | 30 {
  // 달의 크기는 해당 연도의 음력 달력에서 확인한다. 30일이 없으면 작은 달이다.
  try {
    lunarToSolar(year, month, 30, false);
    return 30;
  } catch {
    return 29;
  }
}

function toUpperGua(number: number): TojeongGuaPart {
  const item = UPPER_GUA[number - 1];
  return { number, name: item.name, hanja: item.hanja };
}

function toMiddleGua(number: number): TojeongGuaPart {
  return { number, name: MIDDLE_GUA[number - 1], hanja: `中${number}` };
}

function toLowerGua(number: number): TojeongGuaPart {
  return { number, name: LOWER_GUA[number - 1], hanja: `下${number}` };
}

export function calculateTojeong(input: TojeongCalculationInput): TojeongCalculation {
  validateInput(input);

  const targetYear = yearPillar(input.targetYear);
  const targetMonth = monthPillar(input.targetYear, input.lunarBirthMonth);
  const monthDays = lunarMonthDays(input.targetYear, input.lunarBirthMonth);
  // 윤달은 정통 조견표에서 평달의 해당 월로 환산해 사용한다.
  const targetLunarDay = Math.min(input.lunarBirthDay, monthDays);
  const targetSolarDate = lunarToSolar(input.targetYear, input.lunarBirthMonth, targetLunarDay, false);
  const targetDay = dayPillar(targetSolarDate.year, targetSolarDate.month, targetSolarDate.day);

  const targetYearNumbers = getNumbers(targetYear.stemIndex, targetYear.branchIndex);
  const targetMonthNumbers = getNumbers(targetMonth.stemIndex, targetMonth.branchIndex);
  const targetDayNumbers = getNumbers(targetDay.stemIndex, targetDay.branchIndex);
  const koreanAge = input.targetYear - input.lunarBirthYear + 1;
  const upperSum = koreanAge + targetYearNumbers.taese;
  const middleSum = monthDays + targetMonthNumbers.monthGun;
  const lowerSum = input.lunarBirthDay + targetDayNumbers.iljin;
  const upperNumber = remainderAsTraditionalNumber(upperSum, 8);
  const middleNumber = remainderAsTraditionalNumber(middleSum, 6);
  const lowerNumber = remainderAsTraditionalNumber(lowerSum, 3);

  return {
    targetYear: input.targetYear,
    targetYearGanji: targetYear.ganji,
    targetMonthGanji: targetMonth.ganji,
    targetDayGanji: targetDay.ganji,
    lunarBirth: { year: input.lunarBirthYear, month: input.lunarBirthMonth, day: input.lunarBirthDay },
    koreanAge,
    monthDays,
    numbers: {
      taese: targetYearNumbers.taese,
      monthGun: targetMonthNumbers.monthGun,
      iljin: targetDayNumbers.iljin,
    },
    sums: { upper: upperSum, middle: middleSum, lower: lowerSum },
    gua: {
      upper: toUpperGua(upperNumber),
      middle: toMiddleGua(middleNumber),
      lower: toLowerGua(lowerNumber),
    },
    guaCode: `${upperNumber}${middleNumber}${lowerNumber}`,
    serialNumber: (upperNumber - 1) * 18 + (middleNumber - 1) * 3 + lowerNumber,
    formulas: {
      upper: `(${koreanAge} + ${targetYearNumbers.taese}) ÷ 8 = ${upperSum} … ${upperNumber}`,
      middle: `(${monthDays} + ${targetMonthNumbers.monthGun}) ÷ 6 = ${middleSum} … ${middleNumber}`,
      lower: `(${input.lunarBirthDay} + ${targetDayNumbers.iljin}) ÷ 3 = ${lowerSum} … ${lowerNumber}`,
    },
  };
}

