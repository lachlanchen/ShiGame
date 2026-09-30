import type { Locale } from "@shi/game-core";

export const guideLabels = {
  "en": {
    "guideTitle": "Before the first order",
    "guideFieldTitle": "Read the field",
    "guideFieldText": "Grain, trust, momentum, people, and exposure are different forms of power. No single meter is victory.",
    "guideMoveTitle": "Make your move",
    "guideReplyTitle": "Expect an answer",
    "guideContinue": "Read the position"
  },
  "ar": {
    "guideTitle": "قبل إصدار الأمر الأول",
    "guideFieldTitle": "اقرأ الميدان",
    "guideFieldText": "المؤن والثقة والزخم والناس والانكشاف أشكال مختلفة للقوة. لا يعني مقياس واحد النصر.",
    "guideMoveTitle": "اصنع حركتك",
    "guideReplyTitle": "توقّع الرد",
    "guideContinue": "اقرأ الموقف"
  },
  "de": {
    "guideTitle": "Vor dem ersten Befehl",
    "guideFieldTitle": "Lies das Feld",
    "guideFieldText": "Getreide, Vertrauen, Dynamik, Menschen und Entdeckung sind verschiedene Formen von Macht. Kein einzelner Wert bedeutet Sieg.",
    "guideMoveTitle": "Setze deinen Zug",
    "guideReplyTitle": "Erwarte eine Antwort",
    "guideContinue": "Lage lesen"
  },
  "es": {
    "guideTitle": "Antes de la primera orden",
    "guideFieldTitle": "Lee el campo",
    "guideFieldText": "Grano, confianza, impulso, pueblo y exposición son formas distintas de poder. Ningún indicador por sí solo es la victoria.",
    "guideMoveTitle": "Haz tu movimiento",
    "guideReplyTitle": "Espera una respuesta",
    "guideContinue": "Leer la posición"
  },
  "fr": {
    "guideTitle": "Avant le premier ordre",
    "guideFieldTitle": "Lisez le terrain",
    "guideFieldText": "Grain, confiance, élan, peuple et exposition sont des formes distinctes de pouvoir. Une seule jauge ne signifie jamais la victoire.",
    "guideMoveTitle": "Jouez votre coup",
    "guideReplyTitle": "Attendez une réponse",
    "guideContinue": "Lire la position"
  },
  "ja": {
    "guideTitle": "最初の命令の前に",
    "guideFieldTitle": "場を読む",
    "guideFieldText": "兵糧、信頼、勢い、民衆、露見はそれぞれ異なる力の形だ。一つの値だけで勝利は決まらない。",
    "guideMoveTitle": "一手を打つ",
    "guideReplyTitle": "応手を待つ",
    "guideContinue": "局面を読む"
  },
  "ko": {
    "guideTitle": "첫 명령을 내리기 전에",
    "guideFieldTitle": "판을 읽어라",
    "guideFieldText": "군량, 신뢰, 기세, 민심, 노출은 서로 다른 힘의 형태다. 하나의 수치만으로 승리할 수 없다.",
    "guideMoveTitle": "수를 두어라",
    "guideReplyTitle": "응수를 예상하라",
    "guideContinue": "국면 읽기"
  },
  "ru": {
    "guideTitle": "Перед первым приказом",
    "guideFieldTitle": "Прочтите поле",
    "guideFieldText": "Зерно, доверие, порыв, люди и раскрытие — разные формы власти. Ни один показатель сам по себе не означает победу.",
    "guideMoveTitle": "Сделайте ход",
    "guideReplyTitle": "Ждите ответа",
    "guideContinue": "Прочесть позицию"
  },
  "vi": {
    "guideTitle": "Trước mệnh lệnh đầu tiên",
    "guideFieldTitle": "Đọc bàn thế",
    "guideFieldText": "Lương, tín, thế, dân và bại lộ là những dạng quyền lực khác nhau. Không một chỉ số nào tự nó là chiến thắng.",
    "guideMoveTitle": "Đi nước của bạn",
    "guideReplyTitle": "Chờ thế cục đáp lại",
    "guideContinue": "Đọc thế cục"
  },
  "zh-Hans": {
    "guideTitle": "第一道命令之前",
    "guideFieldTitle": "先读全局",
    "guideFieldText": "粮、信、势、民、险是五种不同的力量。任何一个数值都不等于胜利。",
    "guideMoveTitle": "再落一子",
    "guideReplyTitle": "预判应手",
    "guideContinue": "开始观势"
  },
  "zh-Hant": {
    "guideTitle": "第一道命令之前",
    "guideFieldTitle": "先讀全局",
    "guideFieldText": "糧、信、勢、民、險是五種不同的力量。任何一個數值都不等於勝利。",
    "guideMoveTitle": "再落一子",
    "guideReplyTitle": "預判應手",
    "guideContinue": "開始觀勢"
  }
} satisfies Record<Locale, Record<string, string>>;

export const translateGuide = (locale: Locale, key: keyof typeof guideLabels.en): string => guideLabels[locale][key];
