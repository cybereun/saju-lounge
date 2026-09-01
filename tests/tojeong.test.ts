import { test } from "node:test";
import { calculateTojeong } from "../src/tojeong.ts";
import { getTojeongContent, TOJEONG_CONTENT } from "../src/tojeong-content.ts";

function assertEquals<T>(actual: T, expected: T, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\nexpected: ${e}\nactual:   ${a}`);
}

test("traditional example: 2018 戊戌 / lunar 1952-01-07", () => {
  const result = calculateTojeong({
    lunarBirthYear: 1952,
    lunarBirthMonth: 1,
    lunarBirthDay: 7,
    targetYear: 2018,
  });

  assertEquals(result.targetYearGanji, "戊戌", "target year ganji");
  assertEquals(result.targetMonthGanji, "甲寅", "target month ganji");
  assertEquals(result.targetDayGanji, "乙酉", "target day ganji");
  assertEquals(result.numbers, { taese: 18, monthGun: 16, iljin: 18 }, "60-gapja numbers");
  assertEquals(result.guaCode, "531", "traditional three-digit gua code");
  assertEquals(result.serialNumber, 79, "serial position in 144 gua combinations");
});

test("traditional example: 2010 庚寅 / lunar 1979-07-15", () => {
  const result = calculateTojeong({
    lunarBirthYear: 1979,
    lunarBirthMonth: 7,
    lunarBirthDay: 15,
    targetYear: 2010,
  });

  assertEquals(result.targetMonthGanji, "甲申", "target month ganji");
  assertEquals(result.targetDayGanji, "丙午", "target day ganji");
  assertEquals(result.monthDays, 29, "2010 lunar seventh month is a small month");
  assertEquals(result.guaCode, "232", "traditional three-digit gua code");
});

test("every input resolves to one of the 144 combinations", () => {
  for (let month = 1; month <= 12; month += 1) {
    for (let day = 1; day <= 30; day += 1) {
      const result = calculateTojeong({
        lunarBirthYear: 1990,
        lunarBirthMonth: month,
        lunarBirthDay: day,
        targetYear: 2026,
      });
      if (!/^[1-8][1-6][1-3]$/.test(result.guaCode)) {
        throw new Error(`invalid gua code: ${result.guaCode}`);
      }
      if (result.serialNumber < 1 || result.serialNumber > 144) {
        throw new Error(`invalid serial number: ${result.serialNumber}`);
      }
    }
  }
});

test("the app has a distinct in-house interpretation for all 144 gua codes", () => {
  assertEquals(TOJEONG_CONTENT.length, 144, "content count");
  assertEquals(new Set(TOJEONG_CONTENT.map((content) => content.code)).size, 144, "unique gua codes");

  for (const content of TOJEONG_CONTENT) {
    assertEquals(getTojeongContent(content.code), content, `content lookup for ${content.code}`);
    assertEquals(content.months.length, 12, `monthly content for ${content.code}`);
    assertEquals(content.themes.length, 4, `theme content for ${content.code}`);
  }
});
