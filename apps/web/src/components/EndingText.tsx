import { useEffect, useState, type ComponentType } from "react";
import type { Locale } from "@shi/game-core";
import type { endingLabels } from "../ending-labels";

type TextProps = { locale: Locale; textKey: keyof typeof endingLabels.en };
type Loader = () => Promise<{ ChapterEndingProse: ComponentType<TextProps> }>;
const loadText: Loader = () => import("./ChapterEndingProse");
const labels = {
  en: ["Loading ending…", "The text could not load. Your decision is unchanged.", "Retry loading text"],
  ar: ["جارٍ تحميل النهاية…", "تعذّر تحميل النص. قرارك لم يتغير.", "إعادة تحميل النص"],
  de: ["Ende wird geladen…", "Der Text konnte nicht geladen werden. Deine Entscheidung bleibt unverändert.", "Text erneut laden"],
  es: ["Cargando el final…", "No se pudo cargar el texto. Tu decisión no ha cambiado.", "Reintentar cargar el texto"],
  fr: ["Chargement de la fin…", "Le texte n’a pas pu être chargé. Votre décision reste inchangée.", "Réessayer de charger le texte"],
  ja: ["結末を読み込み中…", "文章を読み込めませんでした。選択は変わっていません。", "文章を再読み込み"],
  ko: ["결말 불러오는 중…", "텍스트를 불러오지 못했습니다. 선택은 바뀌지 않았습니다.", "텍스트 다시 불러오기"],
  ru: ["Загрузка финала…", "Не удалось загрузить текст. Ваше решение не изменилось.", "Загрузить текст снова"],
  vi: ["Đang tải đoạn kết…", "Không tải được văn bản. Quyết định của bạn không thay đổi.", "Tải lại văn bản"],
  "zh-Hans": ["正在加载结尾…", "结尾文字未能加载，你的决定没有改变。", "重试加载文字"],
  "zh-Hant": ["正在載入結尾…", "結尾文字未能載入，你的決定沒有改變。", "重試載入文字"],
} satisfies Record<Locale, [string, string, string]>;

// A failed chunk fetch must not unmount the saved ending or its navigation.
// Retrying only requests text; this component has no persistence/gameplay access.
export function EndingText({ locale, textKey, loader = loadText }: TextProps & { loader?: Loader }) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ Component?: ComponentType<TextProps>; failed: boolean }>({ failed: false });
  useEffect(() => {
    let active = true;
    setResult({ failed: false });
    void loader().then(module => { if (active) setResult({ Component: module.ChapterEndingProse, failed: false }); },
      () => { if (active) setResult({ failed: true }); });
    return () => { active = false; };
  }, [attempt, loader]);
  if (result.Component) return <result.Component locale={locale} textKey={textKey} />;
  if (result.failed) return <div data-testid="ending-text-error"><p role="alert">{labels[locale][1]}</p>
    <button className="text-button" onClick={() => setAttempt(value => value + 1)}>{labels[locale][2]}</button></div>;
  return <p role="status" aria-busy="true">{labels[locale][0]}</p>;
}
