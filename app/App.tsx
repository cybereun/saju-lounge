import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { calculateSaju } from "../src/calculate.ts";
import type { CalendarType, Gender, PillarKey, SajuInput, SajuResult } from "../src/types.ts";

type View = "home" | "saju" | "daily" | "compatibility" | "zodiac" | "tojeong";

type BirthProfile = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  timeUnknown: boolean;
  gender: Gender;
  calendar: CalendarType;
  leap: boolean;
  applyLocalMeanTime: boolean;
};

type BirthProfileUpdate = Partial<BirthProfile>;

type ServiceCard = {
  id: Exclude<View, "home">;
  icon: string;
  label: string;
  title: string;
  description: string;
  tone: string;
  detail: string;
};

type DailyReading = {
  score: number;
  label: string;
  title: string;
  summary: string;
  keyword: string;
  cards: Array<{ label: string; title: string; body: string }>;
};

type CompatibilityReading = {
  score: number;
  title: string;
  summary: string;
  axes: Array<{ label: string; value: number; body: string }>;
  strengths: string[];
  caution: string;
};

type TojeongReading = {
  year: number;
  score: number;
  title: string;
  summary: string;
  keywords: string[];
  themes: Array<{ label: string; title: string; body: string; tone: string }>;
  months: Array<{ month: number; name: string; phase: string; body: string; score: number }>;
  caution: string;
};

const PROFILE_STORAGE_KEY = "saju-lounge-profile-v1";
type TopicReading = {
  id: string;
  icon: string;
  label: string;
  title: string;
  body: string;
  detail: string;
  tip: string;
  caution: string;
  score: number;
  tone: string;
};

const SERVICES: ServiceCard[] = [
  {
    id: "saju",
    icon: "命",
    label: "CORE READING",
    title: "내 사주 분석",
    description: "사주 8글자와 오행, 대운의 흐름을 한눈에 살펴보세요.",
    tone: "plum",
    detail: "생년월일시",
  },
  {
    id: "daily",
    icon: "日",
    label: "DAILY RHYTHM",
    title: "오늘의 운세",
    description: "오늘의 흐름을 가볍게 확인하고 하루의 방향을 잡아보세요.",
    tone: "gold",
    detail: "사주 기반",
  },
  {
    id: "tojeong",
    icon: "年",
    label: "YEARLY GUIDE",
    title: "토정비결",
    description: "한 해의 큰 흐름과 달마다 달라지는 리듬을 살펴보세요.",
    tone: "gold",
    detail: "올해의 흐름",
  },
  {
    id: "compatibility",
    icon: "緣",
    label: "TWO OF US",
    title: "궁합 분석",
    description: "두 사람의 기질과 리듬을 비교해 관계의 힌트를 찾아보세요.",
    tone: "rose",
    detail: "두 사람 입력",
  },
  {
    id: "zodiac",
    icon: "星",
    label: "STAR MAP",
    title: "별자리 운세",
    description: "태어난 날의 별자리와 띠가 건네는 키워드를 만나보세요.",
    tone: "blue",
    detail: "생년월일",
  },
];

const PILLAR_META: Array<{ key: PillarKey; title: string; subtitle: string }> = [
  { key: "year", title: "년주", subtitle: "뿌리와 배경" },
  { key: "month", title: "월주", subtitle: "사회적 기질" },
  { key: "day", title: "일주", subtitle: "나의 중심" },
  { key: "hour", title: "시주", subtitle: "가능성과 표현" },
];

const ELEMENT_ORDER = ["목", "화", "토", "금", "수"];

const ZODIAC_INFO = [
  { name: "염소자리", start: 1222, end: 119, trait: "천천히, 그러나 오래 가는 힘" },
  { name: "물병자리", start: 120, end: 218, trait: "새로운 관점을 여는 독창성" },
  { name: "물고기자리", start: 219, end: 320, trait: "섬세한 감각과 깊은 공감" },
  { name: "양자리", start: 321, end: 419, trait: "망설임보다 먼저 움직이는 용기" },
  { name: "황소자리", start: 420, end: 520, trait: "좋은 것을 오래 지키는 꾸준함" },
  { name: "쌍둥이자리", start: 521, end: 620, trait: "호기심으로 연결을 만드는 재치" },
  { name: "게자리", start: 621, end: 722, trait: "사람과 공간을 돌보는 다정함" },
  { name: "사자자리", start: 723, end: 822, trait: "빛을 나누며 분위기를 이끄는 존재감" },
  { name: "처녀자리", start: 823, end: 922, trait: "작은 차이를 알아채는 정교함" },
  { name: "천칭자리", start: 923, end: 1022, trait: "서로 다른 마음 사이의 균형감" },
  { name: "전갈자리", start: 1023, end: 1121, trait: "한 번 정한 마음을 깊게 파고드는 집중력" },
  { name: "사수자리", start: 1122, end: 1221, trait: "더 넓은 세계로 향하는 낙관성" },
];

const BRANCH_ANIMALS: Record<string, string> = {
  자: "쥐띠",
  축: "소띠",
  인: "호랑이띠",
  묘: "토끼띠",
  진: "용띠",
  사: "뱀띠",
  오: "말띠",
  미: "양띠",
  신: "원숭이띠",
  유: "닭띠",
  술: "개띠",
  해: "돼지띠",
};

const EMPTY_PROFILE: BirthProfile = {
  year: "",
  month: "",
  day: "",
  hour: "",
  minute: "",
  timeUnknown: false,
  gender: "여",
  calendar: "solar",
  leap: false,
  applyLocalMeanTime: true,
};

function createEmptyProfile(): BirthProfile {
  return { ...EMPTY_PROFILE };
}

function loadStoredProfile(): BirthProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) || "null") as Partial<BirthProfile> | null;
    if (!parsed || typeof parsed.year !== "string" || typeof parsed.month !== "string" || typeof parsed.day !== "string") {
      return null;
    }

    return {
      ...createEmptyProfile(),
      ...parsed,
      calendar: parsed.calendar === "lunar" ? "lunar" : "solar",
      gender: parsed.gender === "남" ? "남" : "여",
      timeUnknown: Boolean(parsed.timeUnknown),
      leap: Boolean(parsed.leap),
      applyLocalMeanTime: parsed.applyLocalMeanTime !== false,
    };
  } catch {
    return null;
  }
}

function saveStoredProfile(profile: BirthProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

function toInteger(value: string, label: string, min: number, max: number): number {
  if (!value.trim()) throw new Error(`${label}을(를) 입력해주세요.`);
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < min || numberValue > max) {
    throw new Error(`${label}은(는) ${min}~${max} 사이의 숫자로 입력해주세요.`);
  }
  return numberValue;
}

function profileToInput(profile: BirthProfile): SajuInput {
  const input: SajuInput = {
    year: toInteger(profile.year, "출생 연도", 1900, 2099),
    month: toInteger(profile.month, "출생 월", 1, 12),
    day: toInteger(profile.day, "출생 일", 1, 31),
    gender: profile.gender,
    calendar: profile.calendar,
    leap: profile.calendar === "lunar" ? profile.leap : false,
    applyLocalMeanTime: profile.applyLocalMeanTime,
    longitude: profile.applyLocalMeanTime ? 126.9784 : undefined,
    timezone: "Asia/Seoul",
  };

  if (!profile.timeUnknown) {
    input.hour = toInteger(profile.hour, "출생 시", 0, 23);
    input.minute = toInteger(profile.minute || "0", "출생 분", 0, 59);
  }

  return input;
}

function calculateProfile(profile: BirthProfile): SajuResult {
  return calculateSaju(profileToInput(profile));
}

function safeCalculateProfile(profile: BirthProfile | null): SajuResult | null {
  if (!profile) return null;
  try {
    return calculateProfile(profile);
  } catch {
    return null;
  }
}

function profileLabel(profile: BirthProfile): string {
  const calendar = profile.calendar === "solar" ? "양력" : "음력";
  const date = `${profile.year}.${profile.month.padStart(2, "0")}.${profile.day.padStart(2, "0")}`;
  const time = profile.timeUnknown ? "시간 미상" : `${profile.hour.padStart(2, "0")}:${(profile.minute || "0").padStart(2, "0")}`;
  return `${date} ${time} · ${calendar}`;
}

function resultDateLabel(result: SajuResult): string {
  return `${result.solar.year}.${String(result.solar.month).padStart(2, "0")}.${String(result.solar.day).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function leadingElement(result: SajuResult): string {
  return Object.entries(result.fiveElements).sort(([, first], [, second]) => second - first)[0]?.[0] || "목";
}

function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  return Promise.resolve();
}

function getZodiacInfo(result: SajuResult) {
  const monthDay = result.solar.month * 100 + result.solar.day;
  const zodiac = ZODIAC_INFO.find((item) =>
    item.start <= item.end ? monthDay >= item.start && monthDay <= item.end : monthDay >= item.start || monthDay <= item.end,
  ) ?? ZODIAC_INFO[0];
  const branch = result.pillarDetails.year.branchKo;

  return {
    zodiac,
    animal: BRANCH_ANIMALS[branch] || `${branch}띠`,
  };
}

function buildDailyReading(result: SajuResult, date: string): DailyReading {
  const seed = [...date].reduce((sum, character) => sum + character.charCodeAt(0), 0) + result.pillarDetails.day.stemIdx * 11;
  const element = leadingElement(result);
  const score = clamp(67 + (seed % 28), 50, 95);
  const labels = ["정리의 날", "연결의 날", "표현의 날", "회복의 날"];
  const titles = ["작게 정리한 것이 큰 흐름을 만듭니다", "좋은 대화가 다음 장면을 엽니다", "생각을 밖으로 꺼내면 운이 움직입니다", "속도를 낮출수록 감각이 선명해집니다"];
  const keywords = ["정돈", "대화", "표현", "호흡"];
  const labelIndex = seed % labels.length;

  return {
    score,
    label: labels[labelIndex],
    title: titles[labelIndex],
    keyword: keywords[labelIndex],
    summary: `${date.replaceAll("-", ".")}의 흐름은 ${element} 기운의 장점을 살릴 때 더 편안해집니다. 오늘은 결과를 서두르기보다 내가 조절할 수 있는 한 가지에 집중해보세요.`,
    cards: [
      {
        label: "관계",
        title: labelIndex === 1 ? "먼저 안부를 건네보세요" : "대답보다 경청에 운이 있습니다",
        body: "상대의 말 속에 있는 진짜 의도를 한 번 더 살피면 관계의 온도가 부드러워집니다.",
      },
      {
        label: "일과 돈",
        title: labelIndex === 0 ? "미뤄둔 한 가지부터" : "작은 실행이 흐름을 만듭니다",
        body: "한 번에 많이 바꾸기보다 오늘 끝낼 수 있는 단위를 정하면 집중력이 살아납니다.",
      },
      {
        label: "몸과 마음",
        title: labelIndex === 3 ? "회복을 일정에 넣기" : "잠깐의 여백이 필요해요",
        body: "화면에서 눈을 떼고 물을 마시는 짧은 휴식만으로도 생각의 결이 달라질 수 있습니다.",
      },
    ],
  };
}

function buildTojeongReading(result: SajuResult): TojeongReading {
  const year = result.currentYear;
  const element = leadingElement(result);
  const seed = result.input.year + result.input.month * 7 + result.input.day * 13 + result.pillarDetails.day.stemIdx * 17 + result.pillarDetails.day.branchIdx * 5 + year;
  const score = clamp(67 + (seed % 25), 58, 94);
  const title = score >= 84 ? "움직인 만큼 길이 열리는 한 해" : score >= 74 ? "차분한 준비가 기회를 부르는 한 해" : "속도를 조절하며 내실을 다지는 한 해";
  const months = result.wolun.map((item) => {
    const monthScore = clamp(61 + ((seed + item.month * 11) % 31), 55, 94);
    const phase = monthScore >= 82 ? "확장" : monthScore >= 70 ? "전환" : "정리";
    const name = item.monthName || item.month_name || `${item.month}월`;
    return {
      month: item.month,
      name,
      phase,
      score: monthScore,
      body: `${item.ganzhi}의 기운이 만나는 달입니다. ${phase === "확장" ? "사람과 기회를 넓혀보세요." : phase === "전환" ? "하던 방식을 조금 바꿔보세요." : "속도를 늦추고 기반을 다져보세요."}`,
    };
  });

  return {
    year,
    score,
    title,
    summary: `${year}년은 ${element} 기운의 장점을 생활 속 선택으로 옮길수록 흐름이 선명해지는 해예요. 한 번에 크게 바꾸기보다 계절마다 한 가지씩 방향을 조정해보세요.`,
    keywords: score >= 84 ? ["확장", "표현", "기회"] : score >= 74 ? ["준비", "연결", "균형"] : ["정리", "회복", "기초"],
    themes: [
      {
        label: "큰 흐름",
        title: score >= 78 ? "작은 움직임이 다음 문을 엽니다" : "비워낸 자리에 새 흐름이 들어옵니다",
        body: "올해는 결과를 서둘러 확정하기보다, 계속 이어갈 수 있는 방향을 고르는 일이 중요해요.",
        tone: "plum",
      },
      {
        label: "재물 운",
        title: "관리하는 습관이 가장 오래 남아요",
        body: "수입과 지출을 한눈에 보는 간단한 기준을 만들면 좋은 기회를 알아보는 감각도 함께 자랍니다.",
        tone: "gold",
      },
      {
        label: "일과 관계",
        title: "혼자보다 함께할 때 속도가 맞춰져요",
        body: "나의 역할을 분명히 말하고 상대의 속도도 존중하면 일과 관계의 피로가 한결 가벼워집니다.",
        tone: "rose",
      },
      {
        label: "올해의 실천",
        title: "계절마다 한 가지씩 정리하기",
        body: "해야 할 일을 늘리기보다 지금의 생활에서 덜어낼 한 가지를 정하면 운의 방향이 선명해져요.",
        tone: "blue",
      },
    ],
    months,
    caution: "토정비결은 전통 운세 형식을 바탕으로 만든 자기이해용 참고 콘텐츠이며, 중요한 결정을 대신하지 않습니다.",
  };
}

function buildCompatibilityReading(first: SajuResult, second: SajuResult): CompatibilityReading {
  const firstElements = first.fiveElements;
  const secondElements = second.fiveElements;
  const difference = ELEMENT_ORDER.reduce((sum, element) => sum + Math.abs((firstElements[element] || 0) - (secondElements[element] || 0)), 0);
  const dayStemDistance = Math.abs(first.pillarDetails.day.stemIdx - second.pillarDetails.day.stemIdx);
  const score = clamp(86 - difference * 2 - Math.min(dayStemDistance, 5) + ((first.pillarDetails.day.branchIdx + second.pillarDetails.day.branchIdx) % 7) - 2, 52, 94);
  const sharedElement = leadingElement(first) === leadingElement(second);
  const scoreLabel = score >= 82 ? "서로의 결을 잘 살리는 사이" : score >= 68 ? "다름이 대화가 되는 사이" : "속도를 맞추며 깊어지는 사이";

  return {
    score,
    title: scoreLabel,
    summary: sharedElement
      ? "비슷한 감각을 공유하기 때문에 처음부터 편안함을 느끼기 쉽습니다. 익숙함 속에서도 각자의 시간을 존중하면 관계가 오래 갑니다."
      : "서로 다른 기질이 관계에 새로운 시선을 더합니다. 상대를 바꾸려 하기보다 차이를 번역해주는 대화가 중요합니다.",
    axes: [
      {
        label: "대화 리듬",
        value: clamp(78 - dayStemDistance * 4 + (sharedElement ? 8 : 0), 48, 94),
        body: sharedElement ? "비슷한 온도로 이야기를 시작하기 쉽습니다." : "결론을 내리는 속도가 다를 수 있어요.",
      },
      {
        label: "생활 균형",
        value: clamp(82 - difference * 2, 50, 92),
        body: difference < 6 ? "서로의 빈 곳을 자연스럽게 채워줍니다." : "각자의 루틴을 먼저 인정하면 편안해집니다.",
      },
      {
        label: "함께 성장",
        value: clamp(72 + ((first.pillarDetails.day.branchIdx + second.pillarDetails.day.branchIdx) % 18), 55, 92),
        body: "한 사람이 움직이면 다른 사람도 새로운 가능성을 봅니다.",
      },
    ],
    strengths: [
      sharedElement ? "공통 관심사에서 빠르게 가까워질 수 있어요." : "서로에게 없는 관점을 배울 수 있어요.",
      "문제가 생겼을 때 역할을 나누면 해결 속도가 빨라집니다.",
      "상대의 장점을 말로 표현할수록 관계의 좋은 면이 커집니다.",
    ],
    caution: "궁합 점수는 관계의 결론이 아니라 대화를 시작하기 위한 참고 지표입니다.",
  };
}

function buildTopicReadings(result: SajuResult): TopicReading[] {
  const element = leadingElement(result);
  const strength = result.advanced.dayStrength.strength;
  const base = result.pillarDetails.day.stemIdx + result.pillarDetails.day.branchIdx;
  const score = (start: number, spread: number) => clamp(start + (base % spread), 58, 94);

  return [
    {
      id: "love",
      icon: "\u2661",
      label: "\uc5f0\uc560",
      title: strength === "strong" ? "\ub9c8\uc74c\uc744 \uc194\uc9c1\ud558\uac8c \ubcf4\uc5ec\uc904\uc218\ub85d \uac00\uae4c\uc6cc\uc838\uc694" : "\uc791\uc740 \uc548\ubd80\uc5d0\uc11c \uc2dc\uc791\ud558\ub294 \uad00\uacc4",
      body: strength === "strong" ? "\ub610\ub837\ud55c \ud45c\ud604\ubcf4\ub2e4 \uc0c1\ub300\uc758 \ub9ac\ub4ec\uc744 \ud568\uaed8 \ubcf4\uba74 \uad00\uacc4\uc758 \uc628\ub3c4\uac00 \ub192\uc544\uc838\uc694." : "\uc11c\ub450\ub974\uc9c0 \uc54a\uc740 \ub300\ud654\uc640 \uc791\uc740 \ud45c\ud604\uc774 \uc2e0\ub8b0\ub97c \ud0a4\uc6cc\uc694.",
      detail: "나의 일간 강약을 기준으로 보면 관계에서 먼저 표현할 때와 천천히 확인할 때의 균형이 중요해요. 상대의 반응을 기다리는 여백이 마음을 더 오래 전합니다.",
      tip: "짧은 안부나 고마웠던 일을 먼저 전해보세요.",
      caution: "감정을 혼자 해석하기보다 한 번은 부드럽게 물어보세요.",
      score: score(72, 22),
      tone: "rose",
    },
    {
      id: "money",
      icon: "\u25c7",
      label: "\uc7ac\ubb3c",
      title: "\ud070 \uacb0\uc815\ubcf4\ub2e4 \uc791\uc740 \uc2b5\uad00\uc774 \uc6b4\uc744 \ub9cc\ub4e4\uc5b4\uc694",
      body: element + " \uae30\uc6b4\uc758 \uc7a5\uc810\uc744 \uc0b4\ub9ac\ub294 \ud558\ub8e8\uc608\uc694. \ud558\ub8e8 \ud558\ub098\uc758 \uc9c0\ucd9c\uacfc \ubaa9\ud45c\ub97c \uae30\ub85d\ud574\ubcf4\uc138\uc694.",
      detail: "가장 선명한 오행의 장점을 생활 습관으로 옮길 때 재물 흐름이 안정됩니다. 큰 결정보다 반복 가능한 관리가 먼저예요.",
      tip: "오늘의 지출 한 가지와 다음 목표 하나를 기록하세요.",
      caution: "점수만으로 투자나 소비 결정을 내리지는 마세요.",
      score: score(68, 25),
      tone: "gold",
    },
    {
      id: "work",
      icon: "\u25c7",
      label: "\uc9c1\uc5c5",
      title: strength === "weak" ? "\ud63c\uc790 \ubc00\uc5b4\ubd99\uae30\ubcf4\ub2e4 \uc5f0\uacb0\uc5d0\uc11c \ud798\uc774 \uc0dd\uaca8\uc694" : "\ubc29\ud5a5\uc744 \ubd84\uba85\ud788 \ud558\uba74 \ucd94\uc9c4\ub825\uc774 \uc0dd\uae30\uc5d0\uc694",
      body: strength === "weak" ? "\ud544\uc694\ud55c \ub3c4\uc6c0\uc744 \uc694\uccad\ud558\uace0 \uc5ed\ud560\uc744 \ub098\ub204\ub294 \uac83\uc774 \uc2e4\ub825\uc744 \ub9cc\ub4e4\uc5b4\uc694." : "\uc911\uc2ec \uac00\uce58\ub97c \uba3c\uc800 \uc815\ud558\uba74 \uc624\ub298\uc758 \uc77c\uc774 \uc120\uba85\ud574\uc838\uc694.",
      detail: "일간 강약이 약한 편이면 연결과 협업이, 강한 편이면 방향과 우선순위가 능력을 더 잘 드러내게 해요.",
      tip: "오늘 반드시 끝낼 일 한 가지를 가장 먼저 정하세요.",
      caution: "모든 일을 혼자 책임지려 하지 않아도 괜찮아요.",
      score: score(70, 24),
      tone: "plum",
    },
    {
      id: "health",
      icon: "\u2022",
      label: "\uac74\uac15",
      title: "\ub9ac\ub4ec\uc744 \uc9c0\ud0a4\ub294 \uac83\uc774 \uac00\uc7a5 \uc911\uc694\ud574\uc694",
      body: "\ubab8\uc758 \uc2e0\ud638\ub97c \uacb0\uacfc\ubcf4\ub2e4 \uba3c\uc800 \ub4e4\uc5b4\ubcf4\uc138\uc694. \uc7a0\uacfc \uc2dd\uc0ac\uc758 \ub9ac\ub4ec\uc744 \uc791\uac8c\ub77c\ub3c4 \ubc18\ubcf5\ud574\ubcf4\uc138\uc694.",
      detail: "건강 카드는 의료적 판단이 아니라 생활 리듬을 돌아보는 참고 신호입니다. 몸이 보내는 작은 피로를 무시하지 않는 것이 핵심이에요.",
      tip: "물 마시기·스트레칭·취침 시간을 하나만 정해 반복해보세요.",
      caution: "불편한 증상이 있으면 전문가의 진료와 상담을 우선하세요.",
      score: score(74, 19),
      tone: "blue",
    },
  ];
}
function PageIntro(props: { eyebrow: string; title: string; description: string; onBack: () => void }) {
  return (
    <div className="page-intro">
      <button className="back-link" type="button" onClick={props.onBack}>
        <span aria-hidden="true">←</span> 서비스 목록
      </button>
      <p className="eyebrow">{props.eyebrow}</p>
      <h1>{props.title}</h1>
      <p className="page-description">{props.description}</p>
    </div>
  );
}

function ProfileForm(props: {
  profile: BirthProfile;
  onChange: (next: BirthProfileUpdate) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  description: string;
  submitLabel: string;
  error: string;
  idPrefix: string;
}) {
  const { profile, onChange } = props;

  return (
    <form className="profile-card" onSubmit={props.onSubmit}>
      <div className="card-heading">
        <div>
          <p className="eyebrow">YOUR PROFILE</p>
          <h2>{props.title}</h2>
          <p>{props.description}</p>
        </div>
        <span className="input-badge">브라우저에만 저장</span>
      </div>

      <div className="calendar-switch" aria-label="달력 종류">
        <button
          type="button"
          className={profile.calendar === "solar" ? "active" : ""}
          onClick={() => onChange({ calendar: "solar", leap: false })}
        >
          양력
        </button>
        <button type="button" className={profile.calendar === "lunar" ? "active" : ""} onClick={() => onChange({ calendar: "lunar" })}>
          음력
        </button>
      </div>

      <div className="date-grid">
        <label>
          <span>출생 연도</span>
          <input id={`${props.idPrefix}-year`} type="number" inputMode="numeric" placeholder="1992" value={profile.year} onChange={(event) => onChange({ year: event.target.value })} />
        </label>
        <label>
          <span>월</span>
          <input id={`${props.idPrefix}-month`} type="number" inputMode="numeric" placeholder="10" value={profile.month} onChange={(event) => onChange({ month: event.target.value })} />
        </label>
        <label>
          <span>일</span>
          <input id={`${props.idPrefix}-day`} type="number" inputMode="numeric" placeholder="24" value={profile.day} onChange={(event) => onChange({ day: event.target.value })} />
        </label>
      </div>

      {profile.calendar === "lunar" ? (
        <label className="check-line leap-line">
          <input type="checkbox" checked={profile.leap} onChange={(event) => onChange({ leap: event.target.checked })} />
          <span>윤달이에요</span>
        </label>
      ) : null}

      <div className="time-heading">
        <div>
          <span className="field-label">출생 시간</span>
          <small>시간을 알면 시주와 대운을 더 세밀하게 볼 수 있어요.</small>
        </div>
        <label className="check-line compact-check">
          <input type="checkbox" checked={profile.timeUnknown} onChange={(event) => onChange({ timeUnknown: event.target.checked })} />
          <span>시간 모름</span>
        </label>
      </div>

      <div className="time-grid">
        <label>
          <span>시</span>
          <input disabled={profile.timeUnknown} type="number" inputMode="numeric" placeholder="05" value={profile.hour} onChange={(event) => onChange({ hour: event.target.value })} />
        </label>
        <label>
          <span>분</span>
          <input disabled={profile.timeUnknown} type="number" inputMode="numeric" placeholder="30" value={profile.minute} onChange={(event) => onChange({ minute: event.target.value })} />
        </label>
        <label>
          <span>성별</span>
          <select value={profile.gender} onChange={(event) => onChange({ gender: event.target.value as Gender })}>
            <option value="여">여성</option>
            <option value="남">남성</option>
          </select>
        </label>
      </div>

      <label className="check-line">
        <input type="checkbox" checked={profile.applyLocalMeanTime} onChange={(event) => onChange({ applyLocalMeanTime: event.target.checked })} />
        <span>서울 기준 진태양시 보정 적용 <small>고급 명리 옵션</small></span>
      </label>

      {props.error ? <p className="form-error" role="alert">{props.error}</p> : null}

      <button className="primary-button full-button" type="submit">
        {props.submitLabel} <span aria-hidden="true">→</span>
      </button>
      <p className="form-footnote">입력 정보는 이 기기의 브라우저에만 저장되며, 회원가입이 필요하지 않습니다.</p>
    </form>
  );
}

function Header(props: { view: View; hasProfile: boolean; onHome: () => void; onSaved: () => void }) {
  return (
    <header className="site-header">
      <button className="brand" type="button" onClick={props.onHome} aria-label="사주살롱 홈">
        <span className="brand-mark">ㅅ</span>
        <span className="brand-copy">
          <strong>사주살롱</strong>
          <small>SAJU LOUNGE</small>
        </span>
      </button>
      <nav className="header-nav" aria-label="주요 메뉴">
        <button className={props.view === "home" ? "active" : ""} type="button" onClick={props.onHome}>홈</button>
        <button className={props.hasProfile && props.view === "saju" ? "active" : ""} type="button" onClick={props.onSaved} disabled={!props.hasProfile}>내 결과</button>
      </nav>
      <button className="header-cta" type="button" onClick={props.hasProfile ? props.onSaved : props.onHome}>
        {props.hasProfile ? "내 사주" : "시작하기"}
      </button>
    </header>
  );
}

function HomeView(props: { hasProfile: boolean; result: SajuResult | null; onSelect: (view: Exclude<View, "home">) => void }) {
  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">A QUIET MOMENT FOR YOU</p>
          <h1>오늘의 나를,<br /><em>조금 더 깊이</em> 읽는 시간</h1>
          <p className="hero-description">사주부터 별자리까지. 복잡한 운세를 쉽고 따뜻한 언어로 만나보세요.</p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => props.onSelect("saju")}>
              {props.hasProfile ? "내 사주 다시 보기" : "무료로 시작하기"} <span aria-hidden="true">→</span>
            </button>
            <span className="hero-note"><i /> 회원가입 없이 바로 이용</span>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />
          <div className="hero-sun"><span>命</span><small>나를 읽는<br />작은 지도</small></div>
          <span className="floating-symbol symbol-top">木</span>
          <span className="floating-symbol symbol-right">月</span>
          <span className="floating-symbol symbol-bottom">水</span>
        </div>
      </section>

      <section className="section-block service-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">EXPLORE YOUR RHYTHM</p>
            <h2>무엇부터 만나볼까요?</h2>
          </div>
          <p>필요한 서비스만 골라<br className="desktop-break" /> 가볍게 시작해보세요.</p>
        </div>
        <div className="service-grid">
          {SERVICES.map((service) => (
            <button className={`service-card ${service.tone}`} type="button" key={service.id} onClick={() => props.onSelect(service.id)}>
              <div className="service-card-top"><span className="service-icon">{service.icon}</span><span className="service-detail">{service.detail}</span></div>
              <div><p className="service-label">{service.label}</p><h3>{service.title}</h3><p className="service-description">{service.description}</p></div>
              <span className="service-arrow" aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>

      {props.hasProfile && props.result ? (
        <section className="section-block resume-section">
          <div className="resume-card">
            <div>
              <p className="eyebrow">WELCOME BACK</p>
              <h2>당신의 지도를 다시 펼쳐볼까요?</h2>
              <p>{resultDateLabel(props.result)} · {props.result.pillars.day} 일주 · {props.result.advanced.geukguk}</p>
            </div>
            <button className="text-button" type="button" onClick={() => props.onSelect("saju")}>결과 보기 <span aria-hidden="true">→</span></button>
          </div>
        </section>
      ) : null}

      <section className="section-block trust-section">
        <div className="trust-card"><span className="trust-number">01</span><div><h3>입력은 한 번만</h3><p>프로필을 저장해두면 다른 서비스도 바로 이어서 볼 수 있어요.</p></div></div>
        <div className="trust-card"><span className="trust-number">02</span><div><h3>결과는 내 기기에</h3><p>초기 버전은 회원가입 없이 브라우저 저장만 사용합니다.</p></div></div>
        <div className="trust-card"><span className="trust-number">03</span><div><h3>결정은 나의 몫</h3><p>운세는 정답이 아니라 오늘을 생각하는 하나의 관점입니다.</p></div></div>
      </section>
    </div>
  );
}

function SectionTitle(props: { eyebrow?: string; title: string; children?: ReactNode }) {
  return <div className="content-section-title">{props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}<h2>{props.title}</h2>{props.children}</div>;
}

function SajuResultView(props: { result: SajuResult; profile: BirthProfile; onEdit: () => void; onBack: () => void }) {
  const [shareStatus, setShareStatus] = useState("");
  const currentDaeun = props.result.daeun.current;
  const currentSeyun = props.result.seyun.find((item) => item.year === props.result.currentYear);
  const topicReadings = buildTopicReadings(props.result);
  const [selectedTopicId, setSelectedTopicId] = useState(topicReadings[0]?.id || "love");
  const selectedTopic = topicReadings.find((topic) => topic.id === selectedTopicId) || topicReadings[0];
  const resultShareText = `사주살롱\n${resultDateLabel(props.result)} · ${props.result.pillars.year} ${props.result.pillars.month} ${props.result.pillars.day} ${props.result.pillars.hour}\n일주: ${props.result.pillars.day}\n${props.result.advanced.interpretation}`;

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "사주살롱 사주 결과", text: resultShareText });
        setShareStatus("공유 창을 열었습니다.");
      } else {
        await copyText(resultShareText);
        setShareStatus("결과를 클립보드에 복사했습니다.");
      }
    } catch {
      setShareStatus("공유를 취소했거나 브라우저가 지원하지 않습니다.");
    }
  }

  return (
    <div className="result-page">
      <div className="result-topbar"><button className="back-link" type="button" onClick={props.onBack}><span aria-hidden="true">←</span> 서비스 목록</button><div className="result-actions"><button className="secondary-button" type="button" onClick={props.onEdit}>입력 수정</button><button className="primary-button small-button" type="button" onClick={handleShare}>결과 공유</button></div></div>
      {shareStatus ? <p className="share-status" role="status">{shareStatus}</p> : null}

      <section className="result-hero-card">
        <div><p className="eyebrow">YOUR FOUR PILLARS</p><h1>당신의 사주 지도</h1><p>{profileLabel(props.profile)} · 양력 환산 {resultDateLabel(props.result)}</p></div>
        <div className="day-pillar-badge"><small>나의 중심 · 일주</small><strong>{props.result.pillars.day}</strong><span>{props.result.pillarDetails.day.stemKo} {props.result.pillarDetails.day.branchKo}</span></div>
      </section>

      <section className="content-section">
        <SectionTitle eyebrow="FOUR PILLARS" title="사주 8글자" />
        <div className="pillar-grid">
          {PILLAR_META.map((pillar) => {
            const detail = props.result.pillarDetails[pillar.key];
            return <article className={pillar.key === "day" ? "pillar-card highlight" : "pillar-card"} key={pillar.key}><div className="pillar-card-heading"><span>{pillar.title}</span><small>{pillar.subtitle}</small></div><strong>{detail.stemKo}{detail.branchKo}</strong><span className="pillar-hanja">{detail.stem}{detail.branch}</span><div className="pillar-tags"><span>{detail.element.stem}</span><span>{detail.element.branch}</span></div></article>;
          })}
        </div>
      </section>

      <section className="content-section insight-section">
        <div className="insight-main"><p className="eyebrow">A FIRST NOTE FROM YOUR CHART</p><h2>당신의 중심은<br /><em>{props.result.advanced.dayStrength.strength === "strong" ? "단단하게 뻗는" : props.result.advanced.dayStrength.strength === "weak" ? "유연하게 흐르는" : "균형을 찾아가는"} 기운</em>에 가까워요.</h2><p className="insight-copy">{props.result.advanced.interpretation}</p></div>
        <div className="insight-stat"><span>일간 강약</span><strong>{props.result.advanced.dayStrength.strength === "strong" ? "강" : props.result.advanced.dayStrength.strength === "weak" ? "약" : "중화"}</strong><small>{props.result.advanced.dayStrength.score} point</small></div>
      </section>

      <section className="content-section">
        <SectionTitle eyebrow="FIVE ELEMENTS" title="오행의 균형" />
        <div className="element-card"><div className="element-bars">{ELEMENT_ORDER.map((element) => { const count = props.result.fiveElements[element] || 0; return <div className="element-row" key={element}><span>{element}</span><div className="element-track"><i className={`element-fill element-${element}`} style={{ width: `${Math.max(8, count * 12)}%` }} /></div><strong>{count}</strong></div>; })}</div><div className="element-note"><span>오늘의 힌트</span><p><b>{leadingElement(props.result)}</b> 기운이 가장 선명합니다. 이 기운의 장점을 살리는 선택부터 시도해보세요.</p></div></div>
      </section>

      <section className="content-section topic-section">
        <SectionTitle eyebrow="FOUR DIRECTIONS" title="지금 궁금한 주제를 골라보세요" />
        <div className="topic-grid">
          {topicReadings.map((topic) => (
            <button className={"topic-card " + topic.tone + (selectedTopic?.id === topic.id ? " selected" : "")} type="button" key={topic.id} onClick={() => setSelectedTopicId(topic.id)} aria-pressed={selectedTopic?.id === topic.id}>
              <div className="topic-card-top"><span className="topic-icon">{topic.icon}</span><span className="topic-label">{topic.label}</span><strong>{topic.score}</strong></div>
              <h3>{topic.title}</h3>
              <p>{topic.body}</p>
              <div className="topic-track" aria-label={topic.label + " " + topic.score + "\uc810"}><i style={{ width: topic.score + "%" }} /></div>
            </button>
          ))}
        </div>
        {selectedTopic ? (
          <article className={"topic-detail " + selectedTopic.tone} aria-live="polite">
            <div className="topic-detail-heading">
              <div><p className="eyebrow">TODAY'S FOCUS</p><h3>{selectedTopic.label} · {selectedTopic.title}</h3></div>
              <div className="topic-detail-score"><strong>{selectedTopic.score}</strong><span>점</span></div>
            </div>
            <p className="topic-detail-copy">{selectedTopic.detail}</p>
            <div className="topic-detail-grid">
              <div><span>오늘 해볼 일</span><p>{selectedTopic.tip}</p></div>
              <div><span>기억할 점</span><p>{selectedTopic.caution}</p></div>
            </div>
          </article>
        ) : null}
        <p className="topic-note">각 점수는 정밀한 예측이 아니라, 현재 관심을 기울이는 참고 지표입니다.</p>
      </section>
      <section className="stat-grid">
        <article className="mini-stat"><span>격국</span><strong>{props.result.advanced.geukguk}</strong><small>차트의 기본 구조</small></article>
        <article className="mini-stat"><span>용신</span><strong>{props.result.advanced.yongsin.join(" · ") || "-"}</strong><small>보완하면 좋은 기운</small></article>
        <article className="mini-stat"><span>공망</span><strong>{props.result.gongmang.branchesKo.join(" · ")}</strong><small>비워두면 좋은 자리</small></article>
        <article className="mini-stat"><span>현재 대운</span><strong>{currentDaeun?.ganzhi || "-"}</strong><small>{currentDaeun ? `${currentDaeun.startAge}~${currentDaeun.endAge}세` : "흐름 확인"}</small></article>
      </section>

      <section className="content-section forecast-section">
        <SectionTitle eyebrow="YOUR FLOW" title="시간의 흐름 속에서" />
        <div className="forecast-grid"><article className="forecast-card current"><span>현재 대운</span><strong>{currentDaeun?.ganzhi || "-"}</strong><p>{currentDaeun ? `${currentDaeun.startAge}세부터 ${currentDaeun.endAge}세까지` : "대운 정보를 확인해보세요."}</p><small>{currentDaeun?.stemTenGod} · {currentDaeun?.branchTenGod}</small></article><article className="forecast-card"><span>{props.result.currentYear}년 세운</span><strong>{currentSeyun?.ganzhi || "-"}</strong><p>지금의 계절과 만나는 해의 기운</p><small>{currentSeyun?.tenGodStem} · {currentSeyun?.tenGodBranch}</small></article><article className="forecast-card"><span>올해의 키워드</span><strong>{props.result.advanced.yongsin[0] || leadingElement(props.result)}</strong><p>부족한 곳을 채우기보다 잘하는 것을 먼저 사용하세요.</p><small>나만의 속도</small></article></div>
      </section>

      <p className="disclaimer">이 결과는 전통 명리 해석을 바탕으로 한 참고 콘텐츠이며, 삶의 중요한 결정을 대신하지 않습니다.</p>
    </div>
  );
}

function SajuScreen(props: { initialProfile: BirthProfile | null; initialResult: SajuResult | null; onSaved: (profile: BirthProfile, result: SajuResult) => void; onBack: () => void }) {
  const [profile, setProfile] = useState<BirthProfile>(props.initialProfile ? { ...props.initialProfile } : createEmptyProfile());
  const [result, setResult] = useState<SajuResult | null>(props.initialResult);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!props.initialResult);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextResult = calculateProfile(profile);
      setResult(nextResult);
      setError("");
      setEditing(false);
      props.onSaved(profile, nextResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "입력값을 확인해주세요.");
    }
  }

  if (!editing && result) return <SajuResultView result={result} profile={profile} onEdit={() => setEditing(true)} onBack={props.onBack} />;

  return <div className="page-shell"><PageIntro eyebrow="CORE READING" title="내 사주 분석" description="태어난 순간의 하늘과 땅이 건네는 나만의 리듬을 살펴봅니다." onBack={props.onBack} /><ProfileForm profile={profile} onChange={(next) => setProfile((current) => ({ ...current, ...next }))} onSubmit={handleSubmit} title="출생 정보를 알려주세요" description="정확한 계산을 위해 양력·음력과 출생 시간을 선택해주세요." submitLabel="사주 분석 시작하기" error={error} idPrefix="saju" /></div>;
}

function DailyScreen(props: { initialProfile: BirthProfile | null; initialResult: SajuResult | null; onSaved: (profile: BirthProfile, result: SajuResult) => void; onBack: () => void }) {
  const [profile, setProfile] = useState<BirthProfile>(props.initialProfile ? { ...props.initialProfile } : createEmptyProfile());
  const [result, setResult] = useState<SajuResult | null>(props.initialResult);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!props.initialResult);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const reading = useMemo(() => (result ? buildDailyReading(result, date) : null), [result, date]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextResult = calculateProfile(profile);
      setResult(nextResult);
      setError("");
      setEditing(false);
      props.onSaved(profile, nextResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "입력값을 확인해주세요.");
    }
  }

  if (editing || !result || !reading) return <div className="page-shell"><PageIntro eyebrow="DAILY RHYTHM" title="오늘의 운세" description="내 사주의 리듬과 오늘의 날짜가 만나는 지점을 가볍게 살펴봅니다." onBack={props.onBack} /><ProfileForm profile={profile} onChange={(next) => setProfile((current) => ({ ...current, ...next }))} onSubmit={handleSubmit} title="오늘의 운세를 위한 정보" description="처음 한 번만 입력하면 다음부터는 바로 오늘의 흐름을 볼 수 있어요." submitLabel="오늘의 운세 보기" error={error} idPrefix="daily" /></div>;

  return <div className="result-page"><div className="result-topbar"><button className="back-link" type="button" onClick={props.onBack}><span aria-hidden="true">←</span> 서비스 목록</button><button className="secondary-button" type="button" onClick={() => setEditing(true)}>프로필 수정</button></div><section className="daily-hero"><div><p className="eyebrow">DAILY RHYTHM · {date.replaceAll("-", ".")}</p><h1>{reading.title}</h1><p>{reading.summary}</p></div><div className="daily-score"><span>오늘의 흐름</span><strong>{reading.score}</strong><small>/ 100</small></div></section><div className="daily-controls"><label><span>다른 날짜 보기</span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><span className="keyword-chip">KEYWORD · {reading.keyword}</span></div><section className="daily-cards">{reading.cards.map((card) => <article className="daily-card" key={card.label}><span>{card.label}</span><h2>{card.title}</h2><p>{card.body}</p></article>)}</section><section className="daily-reflection"><p className="eyebrow">A SMALL QUESTION</p><h2>오늘 내가 선택할 수 있는<br /><em>가장 작은 변화는 무엇일까요?</em></h2><p>운세를 정답처럼 맞히기보다, 하루를 조금 더 다정하게 설계하는 질문으로 사용해보세요.</p></section><p className="disclaimer">오늘의 운세는 사주 데이터를 바탕으로 만든 참고용 콘텐츠입니다.</p></div>;
}

function TojeongResultView(props: { result: SajuResult; profile: BirthProfile; reading: TojeongReading; onEdit: () => void; onBack: () => void }) {
  const [shareStatus, setShareStatus] = useState("");
  const shareText = `사주살롱 토정비결\n${props.reading.year}년 · ${props.reading.title}\n${props.reading.summary}`;

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "사주살롱 토정비결", text: shareText });
      } else {
        await copyText(shareText);
      }
      setShareStatus("토정비결을 공유할 준비가 되었습니다.");
    } catch {
      setShareStatus("공유를 취소했거나 브라우저가 지원하지 않습니다.");
    }
  }

  return (
    <div className="result-page">
      <div className="result-topbar"><button className="back-link" type="button" onClick={props.onBack}><span aria-hidden="true">←</span> 서비스 목록</button><div className="result-actions"><button className="secondary-button" type="button" onClick={props.onEdit}>프로필 수정</button><button className="primary-button small-button" type="button" onClick={handleShare}>결과 공유</button></div></div>
      {shareStatus ? <p className="share-status" role="status">{shareStatus}</p> : null}
      <section className="tojeong-hero">
        <div><p className="eyebrow">YEARLY GUIDE · {props.reading.year}</p><h1>{props.reading.title}</h1><p>{profileLabel(props.profile)} · 한 해의 큰 흐름을 살펴보세요.</p></div>
        <div className="tojeong-score"><span>올해의 흐름</span><strong>{props.reading.score}</strong><small>점</small></div>
      </section>
      <section className="tojeong-overview">
        <div><p className="eyebrow">TOJEONG BIG PICTURE</p><h2>{props.reading.year}년, 나의 흐름을 읽는 법</h2><p>{props.reading.summary}</p></div>
        <div className="tojeong-keywords">{props.reading.keywords.map((keyword) => <span key={keyword}>#{keyword}</span>)}</div>
      </section>
      <section className="content-section"><SectionTitle eyebrow="YEARLY THEMES" title="올해의 네 가지 장면" /><div className="tojeong-theme-grid">{props.reading.themes.map((theme) => <article className={`tojeong-theme ${theme.tone}`} key={theme.label}><span>{theme.label}</span><h3>{theme.title}</h3><p>{theme.body}</p></article>)}</div></section>
      <section className="content-section"><SectionTitle eyebrow="MONTH BY MONTH" title="달마다 달라지는 흐름" /><div className="tojeong-month-grid">{props.reading.months.map((month) => <article className="tojeong-month" key={month.month}><div className="tojeong-month-top"><span>{month.name}</span><strong>{month.score}</strong></div><div className="tojeong-month-track"><i style={{ width: `${month.score}%` }} /></div><b>{month.phase}</b><p>{month.body}</p></article>)}</div></section>
      <p className="disclaimer">{props.reading.caution}</p>
    </div>
  );
}

function TojeongScreen(props: { initialProfile: BirthProfile | null; initialResult: SajuResult | null; onSaved: (profile: BirthProfile, result: SajuResult) => void; onBack: () => void }) {
  const [profile, setProfile] = useState<BirthProfile>(props.initialProfile ? { ...props.initialProfile } : createEmptyProfile());
  const [result, setResult] = useState<SajuResult | null>(props.initialResult);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!props.initialResult);
  const reading = useMemo(() => (result ? buildTojeongReading(result) : null), [result]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextResult = calculateProfile(profile);
      setResult(nextResult);
      setError("");
      setEditing(false);
      props.onSaved(profile, nextResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "입력값을 확인해주세요.");
    }
  }

  if (!editing && result && reading) return <TojeongResultView result={result} profile={profile} reading={reading} onEdit={() => setEditing(true)} onBack={props.onBack} />;

  return <div className="page-shell"><PageIntro eyebrow="YEARLY GUIDE" title="토정비결" description="한 해의 큰 흐름과 달마다 달라지는 리듬을 차분히 살펴봅니다." onBack={props.onBack} /><ProfileForm profile={profile} onChange={(next) => setProfile((current) => ({ ...current, ...next }))} onSubmit={handleSubmit} title="올해의 흐름을 위한 정보" description="사주 분석에 사용한 출생정보를 바탕으로 토정비결을 안내합니다." submitLabel="토정비결 보기" error={error} idPrefix="tojeong" /></div>;
}

function CompatibilityResultView(props: { first: BirthProfile; second: BirthProfile; firstResult: SajuResult; secondResult: SajuResult; reading: CompatibilityReading; onEdit: () => void; onBack: () => void }) {
  const [shareStatus, setShareStatus] = useState("");
  async function handleShare() {
    const text = `사주살롱 궁합 분석\n${props.reading.title}\n궁합 점수 ${props.reading.score}점\n${props.reading.summary}`;
    try {
      if (navigator.share) await navigator.share({ title: "사주살롱 궁합 분석", text });
      else await copyText(text);
      setShareStatus("결과를 공유할 준비가 되었습니다.");
    } catch {
      setShareStatus("공유를 취소했거나 브라우저가 지원하지 않습니다.");
    }
  }

  return <div className="result-page"><div className="result-topbar"><button className="back-link" type="button" onClick={props.onBack}><span aria-hidden="true">←</span> 서비스 목록</button><div className="result-actions"><button className="secondary-button" type="button" onClick={props.onEdit}>다시 입력</button><button className="primary-button small-button" type="button" onClick={handleShare}>결과 공유</button></div></div>{shareStatus ? <p className="share-status" role="status">{shareStatus}</p> : null}<section className="compat-hero"><div><p className="eyebrow">TWO OF US · COMPATIBILITY</p><h1>{props.reading.title}</h1><p>{props.reading.summary}</p></div><div className="compat-score"><span>우리의 리듬</span><strong>{props.reading.score}</strong><small>점</small></div></section><div className="pair-pillars"><article><span>나의 일주</span><strong>{props.firstResult.pillars.day}</strong><small>{profileLabel(props.first)}</small></article><div className="pair-symbol">+</div><article><span>상대의 일주</span><strong>{props.secondResult.pillars.day}</strong><small>{profileLabel(props.second)}</small></article></div><section className="content-section"><SectionTitle eyebrow="RELATIONSHIP AXES" title="우리 사이의 세 가지 결" /><div className="compat-axis-grid">{props.reading.axes.map((axis) => <article className="compat-axis" key={axis.label}><div><span>{axis.label}</span><strong>{axis.value}</strong></div><div className="axis-track"><i style={{ width: `${axis.value}%` }} /></div><p>{axis.body}</p></article>)}</div></section><section className="strength-section"><div><p className="eyebrow">GOOD TO KNOW</p><h2>이 관계가 가진<br /><em>좋은 가능성</em></h2></div><ul>{props.reading.strengths.map((strength) => <li key={strength}><span>✓</span>{strength}</li>)}</ul></section><p className="disclaimer">{props.reading.caution}</p></div>;
}

function CompatibilityScreen(props: { initialProfile: BirthProfile | null; onSaved: (profile: BirthProfile, result: SajuResult) => void; onBack: () => void }) {
  const [first, setFirst] = useState<BirthProfile>(props.initialProfile ? { ...props.initialProfile } : createEmptyProfile());
  const [second, setSecond] = useState<BirthProfile>(createEmptyProfile());
  const [reading, setReading] = useState<CompatibilityReading | null>(null);
  const [firstResult, setFirstResult] = useState<SajuResult | null>(null);
  const [secondResult, setSecondResult] = useState<SajuResult | null>(null);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextFirstResult = calculateProfile(first);
      const nextSecondResult = calculateProfile(second);
      setFirstResult(nextFirstResult);
      setSecondResult(nextSecondResult);
      setReading(buildCompatibilityReading(nextFirstResult, nextSecondResult));
      setError("");
      props.onSaved(first, nextFirstResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "두 사람의 입력값을 확인해주세요.");
    }
  }

  if (reading && firstResult && secondResult) return <CompatibilityResultView first={first} second={second} firstResult={firstResult} secondResult={secondResult} reading={reading} onEdit={() => setReading(null)} onBack={props.onBack} />;

  return <div className="page-shell"><PageIntro eyebrow="TWO OF US" title="궁합 분석" description="잘 맞는다는 말보다, 서로를 이해하는 방식에 집중해볼게요." onBack={props.onBack} /><form className="compat-form" onSubmit={handleSubmit}><div className="compat-person"><div className="person-heading"><span className="person-dot me" /><div><p className="eyebrow">PERSON 01</p><h2>나의 정보</h2></div></div><ProfileForm profile={first} onChange={(next) => setFirst((current) => ({ ...current, ...next }))} onSubmit={(event) => event.preventDefault()} title="" description="" submitLabel="" error="" idPrefix="compat-first" /></div><div className="compat-divider" aria-hidden="true">×</div><div className="compat-person"><div className="person-heading"><span className="person-dot partner" /><div><p className="eyebrow">PERSON 02</p><h2>상대의 정보</h2></div></div><ProfileForm profile={second} onChange={(next) => setSecond((current) => ({ ...current, ...next }))} onSubmit={(event) => event.preventDefault()} title="" description="" submitLabel="" error="" idPrefix="compat-second" /></div><div className="compat-submit"><p className="form-error">{error}</p><button className="primary-button full-button" type="submit">우리의 궁합 보기 <span aria-hidden="true">→</span></button></div></form></div>;
}

function ZodiacResultView(props: { result: SajuResult; profile: BirthProfile; onEdit: () => void; onBack: () => void }) {
  const zodiac = getZodiacInfo(props.result);
  const zodiacCopy: Record<string, string> = {
    염소자리: "목표를 향해 한 걸음씩 나아갈 때 가장 자연스러운 매력이 드러납니다.",
    물병자리: "남들과 다른 생각을 숨기지 않을 때 새로운 흐름이 시작됩니다.",
    물고기자리: "당신의 섬세함은 약점이 아니라 사람을 이해하는 특별한 감각입니다.",
    양자리: "작은 용기를 행동으로 옮기는 순간, 주변의 공기도 함께 달라집니다.",
    황소자리: "꾸준히 쌓아온 취향과 실력이 시간이 지날수록 더 큰 힘이 됩니다.",
    쌍둥이자리: "질문을 멈추지 않는 호기심이 사람과 기회를 연결합니다.",
    게자리: "소중한 것을 지키는 마음이 당신만의 단단한 기준을 만들어줍니다.",
    사자자리: "당신이 즐겁게 빛날 때 주변 사람도 자기다운 모습을 찾습니다.",
    처녀자리: "세심하게 다듬는 능력이 복잡한 일을 선명하게 바꿔놓습니다.",
    천칭자리: "서로의 입장을 살피는 균형감이 관계를 아름답게 만듭니다.",
    전갈자리: "깊이 있는 관심과 집중력이 쉽게 흔들리지 않는 결과를 만듭니다.",
    사수자리: "새로운 경험을 향해 나아갈 때 삶의 반경이 자연스럽게 넓어집니다.",
  };

  return <div className="result-page"><div className="result-topbar"><button className="back-link" type="button" onClick={props.onBack}><span aria-hidden="true">←</span> 서비스 목록</button><button className="secondary-button" type="button" onClick={props.onEdit}>다시 입력</button></div><section className="zodiac-hero"><div className="zodiac-orb" aria-hidden="true"><span>✦</span></div><div><p className="eyebrow">STAR MAP · {resultDateLabel(props.result)}</p><h1>{zodiac.zodiac.name}</h1><p>{zodiac.zodiac.trait}</p></div></section><section className="zodiac-duo"><article><span>서양 별자리</span><strong>{zodiac.zodiac.name}</strong><p>{zodiacCopy[zodiac.zodiac.name]}</p></article><article><span>사주 기준 띠</span><strong>{zodiac.animal}</strong><p>{props.result.pillarDetails.year.branchKo} 기운의 해에 태어난 당신의 기본적인 리듬입니다.</p></article></section><section className="zodiac-message"><p className="eyebrow">A NOTE FOR YOU</p><h2>당신의 다름은<br /><em>방향을 찾는 감각</em>이에요.</h2><p>별자리와 띠는 나를 규정하는 라벨이 아니라, 나를 바라보는 또 하나의 언어입니다. 마음에 닿는 문장만 골라 오늘의 선택에 가볍게 사용해보세요.</p><div className="zodiac-tags"><span>{zodiac.zodiac.name}</span><span>{zodiac.animal}</span><span>{leadingElement(props.result)} 기운</span></div></section><p className="disclaimer">별자리 운세는 생년월일을 바탕으로 한 가벼운 참고 콘텐츠입니다.</p></div>;
}

function ZodiacScreen(props: { initialProfile: BirthProfile | null; initialResult: SajuResult | null; onSaved: (profile: BirthProfile, result: SajuResult) => void; onBack: () => void }) {
  const [profile, setProfile] = useState<BirthProfile>(props.initialProfile ? { ...props.initialProfile } : createEmptyProfile());
  const [result, setResult] = useState<SajuResult | null>(props.initialResult);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(!props.initialResult);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const nextResult = calculateProfile(profile);
      setResult(nextResult);
      setError("");
      setEditing(false);
      props.onSaved(profile, nextResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "입력값을 확인해주세요.");
    }
  }

  if (!editing && result) return <ZodiacResultView result={result} profile={profile} onEdit={() => setEditing(true)} onBack={props.onBack} />;

  return <div className="page-shell"><PageIntro eyebrow="STAR MAP" title="별자리 운세" description="생년월일이 알려주는 별자리와 사주 기준 띠를 함께 확인해보세요." onBack={props.onBack} /><ProfileForm profile={profile} onChange={(next) => setProfile((current) => ({ ...current, ...next }))} onSubmit={handleSubmit} title="태어난 날을 알려주세요" description="별자리는 양력 날짜로 환산해 보여드리고, 띠는 사주 기준으로 안내합니다." submitLabel="나의 별자리 보기" error={error} idPrefix="zodiac" /></div>;
}

function Footer() {
  return <footer className="site-footer"><div><strong>사주살롱</strong><span>나를 읽는 조용한 시간</span></div><p>본 서비스의 모든 결과는 자기이해를 돕기 위한 참고 콘텐츠입니다.</p></footer>;
}

export function App() {
  const [savedProfile, setSavedProfile] = useState<BirthProfile | null>(() => loadStoredProfile());
  const [savedResult, setSavedResult] = useState<SajuResult | null>(() => safeCalculateProfile(loadStoredProfile()));
  const [view, setView] = useState<View>("home");

  function openView(nextView: View) {
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSaved(profile: BirthProfile, result: SajuResult) {
    setSavedProfile({ ...profile });
    setSavedResult(result);
    saveStoredProfile(profile);
  }

  let content: ReactNode;
  if (view === "home") content = <HomeView hasProfile={Boolean(savedProfile && savedResult)} result={savedResult} onSelect={(nextView) => openView(nextView)} />;
  if (view === "saju") content = <SajuScreen initialProfile={savedProfile} initialResult={savedResult} onSaved={handleSaved} onBack={() => openView("home")} />;
  if (view === "daily") content = <DailyScreen initialProfile={savedProfile} initialResult={savedResult} onSaved={handleSaved} onBack={() => openView("home")} />;
  if (view === "tojeong") content = <TojeongScreen initialProfile={savedProfile} initialResult={savedResult} onSaved={handleSaved} onBack={() => openView("home")} />;
  if (view === "compatibility") content = <CompatibilityScreen initialProfile={savedProfile} onSaved={handleSaved} onBack={() => openView("home")} />;
  if (view === "zodiac") content = <ZodiacScreen initialProfile={savedProfile} initialResult={savedResult} onSaved={handleSaved} onBack={() => openView("home")} />;

  return <div className="app"><Header view={view} hasProfile={Boolean(savedProfile && savedResult)} onHome={() => openView("home")} onSaved={() => openView("saju")} /><main>{content}</main><Footer /></div>;
}
