export type TojeongContentTheme = {
  label: string;
  title: string;
  body: string;
  tone: string;
};

export type TojeongContentMonth = {
  phase: string;
  body: string;
};

export type TojeongContent = {
  code: string;
  title: string;
  overview: string;
  keywords: [string, string, string];
  themes: [TojeongContentTheme, TojeongContentTheme, TojeongContentTheme, TojeongContentTheme];
  months: [
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
    TojeongContentMonth,
  ];
};

const UPPER_PROFILES = [
  { name: "하늘", hanja: "乾", title: "스스로 방향을 세우는 힘", overview: "큰 그림을 먼저 세울수록 선택의 기준이 또렷해집니다.", work: "주도권을 잡되 혼자 모든 일을 떠안지는 마세요.", money: "장기 계획과 원칙 있는 관리가 재물의 바탕이 됩니다." },
  { name: "못", hanja: "兌", title: "기쁨과 대화가 여는 흐름", overview: "좋은 말과 유연한 만남이 막혀 있던 기회를 움직입니다.", work: "협업과 설득의 장점을 살리면 성과가 커집니다.", money: "사람을 통한 기회가 생기지만 즉흥 지출은 점검하세요." },
  { name: "불", hanja: "離", title: "빛을 내며 존재감을 드러내는 흐름", overview: "당신의 생각과 재능을 밖으로 보여줄수록 흐름이 선명해집니다.", work: "발표·표현·브랜딩처럼 보이는 일이 힘을 얻습니다.", money: "가치를 잘 설명하는 능력이 수입과 연결될 수 있습니다." },
  { name: "우레", hanja: "震", title: "움직임이 변화를 깨우는 흐름", overview: "머뭇거리던 일을 작게라도 시작하면 다음 장면이 열립니다.", work: "빠른 실행이 강점이지만 일정과 약속은 두 번 확인하세요.", money: "새로운 수입원을 실험하되 큰 투자는 단계적으로 접근하세요." },
  { name: "바람", hanja: "巽", title: "부드럽게 스며들어 넓어지는 흐름", overview: "강하게 밀기보다 꾸준히 연결할 때 기회가 오래 남습니다.", work: "조율·기획·관계 관리에서 섬세함이 빛납니다.", money: "작은 수익을 반복해서 쌓는 구조가 잘 맞습니다." },
  { name: "물", hanja: "坎", title: "깊이를 만들며 단단해지는 흐름", overview: "쉽지 않은 장면도 경험으로 바꾸면 내공이 됩니다.", work: "위험 요소를 미리 살피고 안전장치를 마련하세요.", money: "불확실한 제안보다 현금 흐름과 계약 조건을 우선하세요." },
  { name: "산", hanja: "艮", title: "멈춤과 집중으로 기준을 세우는 흐름", overview: "덜어내고 집중할수록 필요한 기회가 또렷하게 보입니다.", work: "전문성을 깊게 파고드는 선택이 유리합니다.", money: "지출을 줄이는 것만으로도 재물의 방향이 안정됩니다." },
  { name: "땅", hanja: "坤", title: "받아주고 키우며 결실을 만드는 흐름", overview: "주변의 필요를 살피고 꾸준히 돌본 일이 결과로 돌아옵니다.", work: "팀을 받쳐주는 역할에서 신뢰와 실력이 함께 자랍니다.", money: "기초 자산과 생활 기반을 차분하게 다져보세요." },
] as const;

const MIDDLE_PROFILES = [
  { name: "싹틔움", phase: "기초", body: "새 계획은 크게 선언하기보다 오늘 할 수 있는 첫 단계를 정하세요.", money: "예산의 틀을 먼저 만들면 작은 기회도 놓치지 않습니다." },
  { name: "움직임", phase: "전개", body: "변화가 시작되는 시기입니다. 완벽한 준비보다 빠른 피드백이 도움이 됩니다.", money: "작게 시험하고 반응을 본 뒤 규모를 키우는 흐름이 좋습니다." },
  { name: "확장", phase: "성장", body: "관심과 활동 반경이 넓어집니다. 선택과 집중으로 분산을 막아보세요.", money: "수입의 가능성은 넓어지지만 고정비도 함께 점검해야 합니다." },
  { name: "조율", phase: "균형", body: "서로 다른 의견을 연결하는 과정이 올해의 중요한 실력이 됩니다.", money: "나누고 협의하는 과정에서 안정적인 기회가 만들어집니다." },
  { name: "수확", phase: "결실", body: "지금까지 쌓은 경험을 결과로 바꾸는 시기입니다. 성과를 기록해두세요.", money: "받을 몫과 지킬 몫을 분명히 구분하면 실속이 생깁니다." },
  { name: "정리", phase: "정돈", body: "불필요한 약속과 방식을 덜어야 다음 기회를 맞을 자리가 생깁니다.", money: "새로운 수익보다 새는 돈을 막는 일이 먼저입니다." },
] as const;

const LOWER_PROFILES = [
  { name: "시작", title: "첫 단추를 가볍게 끼우기", body: "결론을 서두르지 말고 작고 분명한 행동 하나를 남겨보세요.", relationship: "먼저 안부를 건네는 용기가 관계의 문을 엽니다." },
  { name: "전개", title: "과정의 속도를 믿고 이어가기", body: "중간에 방향을 점검하되, 작은 흔들림을 실패로 단정하지 마세요.", relationship: "상대의 속도를 존중하는 대화가 오래 가는 신뢰를 만듭니다." },
  { name: "마무리", title: "남길 것과 놓을 것을 고르기", body: "올해의 경험을 정리해 다음 선택에 쓸 기준으로 바꿔보세요.", relationship: "고마움과 경계를 함께 표현하면 관계가 건강해집니다." },
] as const;

const MONTH_FRAMES = [
  { phase: "정초의 기준", body: "올해 꼭 지킬 원칙을 한 문장으로 적어보세요." },
  { phase: "관계의 문", body: "혼자 판단하기보다 필요한 사람에게 먼저 의견을 물어보세요." },
  { phase: "작은 실행", body: "미뤄둔 일을 가장 작은 단위로 쪼개 시작하기 좋습니다." },
  { phase: "속도 조절", body: "늘리는 일과 멈출 일을 구분하면 에너지가 새지 않습니다." },
  { phase: "기회의 확장", body: "새 제안을 검토하되 조건과 역할을 문서로 남겨두세요." },
  { phase: "중간 점검", body: "처음 세운 계획을 현실에 맞게 한 번 조정해보세요." },
  { phase: "생활의 균형", body: "일의 성과만큼 몸과 마음의 회복 시간을 확보하세요." },
  { phase: "표현의 계절", body: "생각을 밖으로 꺼내 공유할수록 다음 연결이 생깁니다." },
  { phase: "실속 챙기기", body: "계약·지출·일정을 다시 살피면 작은 누수를 막을 수 있습니다." },
  { phase: "정리의 결실", body: "이어갈 것과 내려놓을 것을 정하면 연말의 피로가 줄어듭니다." },
  { phase: "감사의 연결", body: "도움을 주고받은 사람에게 마음을 표현하면 관계가 단단해집니다." },
  { phase: "다음 준비", body: "올해의 기록을 돌아보고 다음 해에 가져갈 한 가지를 고르세요." },
] as const;

function makeContent(upperNumber: number, middleNumber: number, lowerNumber: number): TojeongContent {
  const upper = UPPER_PROFILES[upperNumber - 1];
  const middle = MIDDLE_PROFILES[middleNumber - 1];
  const lower = LOWER_PROFILES[lowerNumber - 1];
  const code = `${upperNumber}${middleNumber}${lowerNumber}`;

  return {
    code,
    title: `${upper.title}, ${middle.name}을 지나 ${lower.name}에 닿는 해`,
    overview: `${upper.overview} ${middle.body} ${lower.body}`,
    keywords: [upper.name, middle.name, lower.name],
    themes: [
      {
        label: `총운 · ${upper.hanja} ${upper.name}`,
        title: upper.title,
        body: `${upper.overview} ${middle.body}`,
        tone: "plum",
      },
      {
        label: "재물·일",
        title: `${middle.name}의 흐름에 맞춰 실속을 챙기기`,
        body: `${upper.work} ${upper.money} ${middle.money}`,
        tone: "gold",
      },
      {
        label: "관계·마음",
        title: lower.title,
        body: `${lower.relationship} ${lower.body}`,
        tone: "rose",
      },
      {
        label: "올해의 실천",
        title: `${middle.phase} 뒤에 ${lower.name}을 준비하기`,
        body: "운세를 결론으로 삼기보다, 한 달에 한 번 실제 생활의 변화를 기록해보세요.",
        tone: "blue",
      },
    ],
    months: MONTH_FRAMES.map((month, index) => ({
      phase: `${month.phase} · ${middle.phase}`,
      body: `${month.body} ${index % 3 === lowerNumber - 1 ? lower.body : upper.overview}`,
    })) as TojeongContent["months"],
  };
}

export const TOJEONG_CONTENT: TojeongContent[] = Array.from({ length: 8 }, (_, upperIndex) =>
  Array.from({ length: 6 }, (_, middleIndex) =>
    Array.from({ length: 3 }, (_, lowerIndex) => makeContent(upperIndex + 1, middleIndex + 1, lowerIndex + 1)),
  ),
).flat(2);

const CONTENT_BY_CODE = new Map(TOJEONG_CONTENT.map((content) => [content.code, content]));

export function getTojeongContent(code: string): TojeongContent {
  const content = CONTENT_BY_CODE.get(code);
  if (!content) throw new Error(`지원하지 않는 토정비결 괘 코드입니다: ${code}`);
  return content;
}

