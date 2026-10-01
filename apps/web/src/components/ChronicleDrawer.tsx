import { lazy, Suspense } from "react";
import { getNode, localize, type Campaign, type GameState, type Locale, type ResourceKey } from "@shi/game-core";
import { translate } from "../i18n";
import type { DevelopmentCrossingDriver } from "../development-crossing";
const OppositionRecord = lazy(() => import("./OppositionLayer").then(module => ({ default: module.OppositionRecord })));
const MethodReadRecord = lazy(() => import("./OppositionLayer").then(module => ({ default: module.MethodReadRecord })));
const CommitmentRecord = lazy(() => import("./CommitmentLayer").then(module => ({ default: module.CommitmentRecord })));
const effectLabel = (key: ResourceKey, value: number, locale: Locale) => `${value > 0 ? "+" : ""}${value} ${translate(locale, key)}`;
export function ChronicleDrawer({ campaign, state, locale, onClose, onRestart, crossingRecord }: {
  campaign: Campaign; state: GameState; locale: Locale; onClose: () => void; onRestart: () => void;
  crossingRecord?: ReturnType<DevelopmentCrossingDriver["getCrossingRecord"]>;
}) {
  return <aside className="drawer record-drawer" data-testid="record-drawer" role="dialog" aria-modal="true" aria-label={translate(locale, "record")}>
          <div className="drawer-head"><div><span className="eyebrow">SHI</span><h2>{translate(locale, "record")}</h2></div><button className="icon-button" autoFocus onClick={onClose} aria-label={translate(locale, "close")}>×</button></div>
          {state.history.length === 0 ? <p className="empty-record">{translate(locale, "historyEmpty")}</p> : (
            <ol className="record-list">{state.history.map((record, index) => {
              const pastNode = getNode(campaign, record.nodeId);
              const originalChoice = pastNode.choices.find((choice) => choice.id === record.choiceId)!;
              const matchesCrossing = crossingRecord?.nodeId === record.nodeId && crossingRecord.choiceId === record.choiceId;
              const pastChoice = matchesCrossing ? { ...originalChoice, consequence: crossingRecord!.summary,
                pressure: originalChoice.pressure && crossingRecord!.pressure ? { ...originalChoice.pressure, reveal: crossingRecord!.pressure } : originalChoice.pressure } : originalChoice;
              const pastCondition = pastNode.conditions.find((condition) => condition.id === record.conditionId)!;
              return <li key={`${record.nodeId}-${record.choiceId}`}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{localize(pastNode.title, locale)}</small><strong>{localize(pastChoice.label, locale)}</strong><p>{localize(pastChoice.consequence, locale)}</p>{record.commitmentId && record.commitmentOutcomeId && <Suspense fallback={null}><CommitmentRecord commitmentId={record.commitmentId} outcomeId={record.commitmentOutcomeId} outcomeOverride={matchesCrossing ? crossingRecord?.commitment?.outcome : undefined} effects={record.commitmentEffects} locale={locale} /></Suspense>}{pastChoice.pressure && <p className="record-pressure"><b>{translate(locale, "pressureResponse")}</b>{localize(pastChoice.pressure.reveal, locale)}</p>}{record.oppositionStageId && <Suspense fallback={null}><OppositionRecord stageId={record.oppositionStageId} effects={record.oppositionEffects} locale={locale} /></Suspense>}{record.methodReadId && record.methodId && <Suspense fallback={null}><MethodReadRecord readId={record.methodReadId} methodId={record.methodId} matched={record.methodReadMatched === true} effects={record.methodReadEffects} locale={locale} /></Suspense>}<p className="record-field"><b>{translate(locale, "fieldApplied")}</b>{localize(pastCondition.title, locale)} · {Object.entries(record.conditionEffects).map(([key, value]) => effectLabel(key as ResourceKey, value ?? 0, locale)).join(" · ")}</p></div></li>;
            })}</ol>
          )}
          {crossingRecord && <section data-testid="crossing-record"><h3>{localize(crossingRecord.title, locale)}</h3><p>{localize(crossingRecord.summary, locale)}</p><details><summary>{locale.startsWith("zh") ? "已发出的渡河命令" : "Issued crossing orders"}</summary><ol>{crossingRecord.commands.map(command => <li key={command.id} data-crossing-record-command={command.id}><strong>{localize(command.title, locale)}</strong><p>{localize(command.reaction, locale)}</p></li>)}</ol></details></section>}
          <button className="text-button restart-button" onClick={onRestart}>{translate(locale, "restart")}</button>
        </aside>;
}
