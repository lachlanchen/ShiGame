import type { Locale } from "@shi/game-core";

// Describes the retained listening image; no new historical event or dialogue.
export const rainSceneDescription = {
  en: "Chen Sheng listens beneath a shelter while rain falls outside.",
  ar: "يستمع تشن شنغ تحت المأوى بينما يهطل المطر في الخارج.",
  de: "Chen Sheng hört unter einem Unterstand zu, während draußen Regen fällt.",
  es: "Chen Sheng escucha bajo un refugio mientras llueve afuera.",
  fr: "Chen Sheng écoute sous un abri tandis que la pluie tombe dehors.",
  ja: "陳勝は雨を避ける小屋の下で話を聞いている。外では雨が降っている。",
  ko: "천성은 비를 피하는 쉼터 아래에서 이야기를 듣는다. 밖에는 비가 내린다.",
  ru: "Чэнь Шэн слушает под навесом, пока снаружи идёт дождь.",
  vi: "Trần Thắng lắng nghe dưới mái trú, bên ngoài trời đang mưa.",
  "zh-Hans": "陈胜在棚下听人说话，雨落在棚外。",
  "zh-Hant": "陳勝在棚下聽人說話，雨落在棚外。",
} satisfies Record<Locale, string>;
