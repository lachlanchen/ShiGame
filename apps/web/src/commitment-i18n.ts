import type { CommitmentStatus, Locale } from "@shi/game-core";

type CommitmentUiKey = "establishes" | "carried" | "stakeholder" | "answer" | "effects" | "chapterAnswer" | CommitmentStatus;

const text: Record<Locale, Record<CommitmentUiKey, string>> = {
  en: { establishes: "Establishes commitment", carried: "Commitment carried", stakeholder: "Stakeholder", answer: "Commitment answer", effects: "Commitment effects", chapterAnswer: "Chapter commitment", kept: "Kept", strained: "Strained", broken: "Broken" },
  ar: { establishes: "ينشئ التزامًا", carried: "التزام مستمر", stakeholder: "صاحب المصلحة", answer: "جواب الالتزام", effects: "آثار الالتزام", chapterAnswer: "التزام الفصل", kept: "تم الوفاء به", strained: "تعرّض للضغط", broken: "نُقض" },
  de: { establishes: "Begründet ein Versprechen", carried: "Mitgeführte Verpflichtung", stakeholder: "Anspruchsträger", answer: "Antwort auf das Versprechen", effects: "Folgen des Versprechens", chapterAnswer: "Kapitelversprechen", kept: "Gehalten", strained: "Beansprucht", broken: "Gebrochen" },
  es: { establishes: "Establece un compromiso", carried: "Compromiso vigente", stakeholder: "Parte interesada", answer: "Respuesta al compromiso", effects: "Efectos del compromiso", chapterAnswer: "Compromiso del capítulo", kept: "Cumplido", strained: "Tensionado", broken: "Roto" },
  fr: { establishes: "Établit un engagement", carried: "Engagement en cours", stakeholder: "Partie prenante", answer: "Réponse à l’engagement", effects: "Effets de l’engagement", chapterAnswer: "Engagement du chapitre", kept: "Tenu", strained: "Mis à l’épreuve", broken: "Rompu" },
  ja: { establishes: "約束を立てる", carried: "持ち越された約束", stakeholder: "当事者", answer: "約束への応答", effects: "約束の効果", chapterAnswer: "章の約束", kept: "守った", strained: "揺らいだ", broken: "破った" },
  ko: { establishes: "약속을 세움", carried: "이어지는 약속", stakeholder: "당사자", answer: "약속에 대한 응답", effects: "약속 효과", chapterAnswer: "장의 약속", kept: "지킴", strained: "흔들림", broken: "어김" },
  ru: { establishes: "Создаёт обязательство", carried: "Действующее обязательство", stakeholder: "Заинтересованная сторона", answer: "Ответ на обязательство", effects: "Последствия обязательства", chapterAnswer: "Обязательство главы", kept: "Исполнено", strained: "Под напряжением", broken: "Нарушено" },
  vi: { establishes: "Lập một cam kết", carried: "Cam kết đang mang theo", stakeholder: "Bên liên quan", answer: "Cách đáp lại cam kết", effects: "Hệ quả cam kết", chapterAnswer: "Cam kết của chương", kept: "Giữ lời", strained: "Bị thử thách", broken: "Thất hứa" },
  "zh-Hans": { establishes: "立下承诺", carried: "随行承诺", stakeholder: "关系人", answer: "应诺", effects: "应诺影响", chapterAnswer: "本章承诺", kept: "兑现", strained: "承压", broken: "背弃" },
  "zh-Hant": { establishes: "立下承諾", carried: "隨行承諾", stakeholder: "關係人", answer: "應諾", effects: "應諾影響", chapterAnswer: "本章承諾", kept: "兌現", strained: "承壓", broken: "背棄" },
};

export const translateCommitment = (locale: Locale, key: CommitmentUiKey): string => text[locale][key];
