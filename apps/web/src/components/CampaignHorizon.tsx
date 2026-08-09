import type { Campaign, CampaignAct, CampaignNode, Locale, LocalizedText } from "@shi/game-core";
import { localize } from "@shi/game-core";
import horizonJson from "../generated/chapter-01-horizon.json";
import "./CampaignHorizon.css";

interface CampaignHorizonProps {
  campaign: Pick<Campaign, "nodes" | "sites">;
  node: CampaignNode;
  locale: Locale;
}

interface HorizonLabels {
  horizon: string;
  act: string;
  scene: string;
  of: string;
  passed: string;
  current: string;
  ahead: string;
}

const labels: Record<Locale, HorizonLabels> = {
  en: { horizon: "Campaign horizon", act: "Act", scene: "Scene", of: "of", passed: "Passed", current: "Current", ahead: "Ahead" },
  ar: { horizon: "أفق الحملة", act: "الفصل", scene: "المشهد", of: "من", passed: "مضى", current: "الحالي", ahead: "آتٍ" },
  de: { horizon: "Kampagnenhorizont", act: "Akt", scene: "Szene", of: "von", passed: "Durchlaufen", current: "Aktuell", ahead: "Voraus" },
  es: { horizon: "Horizonte de campaña", act: "Acto", scene: "Escena", of: "de", passed: "Superado", current: "Actual", ahead: "Por venir" },
  fr: { horizon: "Horizon de campagne", act: "Acte", scene: "Scène", of: "sur", passed: "Franchi", current: "Actuel", ahead: "À venir" },
  ja: { horizon: "戦役の見通し", act: "幕", scene: "場面", of: "/", passed: "通過", current: "現在", ahead: "この先" },
  ko: { horizon: "전역의 지평", act: "막", scene: "장면", of: "/", passed: "지남", current: "현재", ahead: "앞" },
  ru: { horizon: "Горизонт кампании", act: "Акт", scene: "Сцена", of: "из", passed: "Пройден", current: "Сейчас", ahead: "Впереди" },
  vi: { horizon: "Chân trời chiến dịch", act: "Hồi", scene: "Cảnh", of: "trên", passed: "Đã qua", current: "Hiện tại", ahead: "Phía trước" },
  "zh-Hans": { horizon: "战役进程", act: "幕", scene: "场景", of: "/", passed: "已历", current: "当前", ahead: "在前" },
  "zh-Hant": { horizon: "戰役進程", act: "幕", scene: "場景", of: "/", passed: "已歷", current: "當前", ahead: "在前" },
};

const roman = ["I", "II", "III", "IV", "V"];
const acts = horizonJson as CampaignAct[];
const textDirection = (value: LocalizedText, locale: Locale): "ltr" | undefined => locale === "ar" && !value.ar ? "ltr" : undefined;

export function CampaignHorizon({ campaign, node, locale }: CampaignHorizonProps) {
  const copy = labels[locale];
  const currentActIndex = acts.findIndex((act) => act.id === node.actId);
  const currentAct = acts[currentActIndex]!;
  const site = campaign.sites.find((candidate) => candidate.id === node.siteId)!;
  const sceneIndex = campaign.nodes.findIndex((candidate) => candidate.id === node.id) + 1;

  return (
    <section className="campaign-horizon" data-testid="campaign-horizon" data-act-id={node.actId} data-time-index={node.timeIndex} aria-labelledby="campaign-horizon-title">
      <div className="campaign-horizon-head">
        <div>
          <span id="campaign-horizon-title">{copy.horizon}</span>
          <strong dir={textDirection(currentAct.title, locale)}>{copy.act} {roman[currentActIndex] ?? currentActIndex + 1} · {localize(currentAct.title, locale)}</strong>
        </div>
        <p><span>{copy.scene} {sceneIndex} {copy.of} {campaign.nodes.length}</span><b aria-hidden="true">◆</b><span dir={textDirection(site.name, locale)}>{localize(site.name, locale)}</span><b aria-hidden="true">◆</b><span dir={textDirection(node.dateLabel, locale)}>{localize(node.dateLabel, locale)}</span></p>
      </div>
      <ol className="campaign-act-rail">
        {acts.map((act, index) => {
          const state = index < currentActIndex ? "passed" : index === currentActIndex ? "current" : "ahead";
          return (
            <li className={`is-${state}`} data-act-state={state} aria-current={state === "current" ? "step" : undefined} key={act.id}>
              <i aria-hidden="true">{state === "passed" ? "✓" : state === "current" ? "◆" : "◇"}</i>
              <span>{roman[index] ?? index + 1}</span>
              <strong dir={textDirection(act.title, locale)}>{localize(act.title, locale)}</strong>
              <small>{copy[state]}</small>
            </li>
          );
        })}
      </ol>
      <p className="campaign-act-objective" dir={textDirection(currentAct.objective, locale)}>{localize(currentAct.objective, locale)}</p>
    </section>
  );
}
