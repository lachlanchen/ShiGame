import {
  advanceCrossingCampaign, createCrossingCampaignSave, replayCrossingCampaign,
  type Campaign, type CrossingCampaignEvent, type CrossingCampaignReplay,
  type CrossingAftermath, type CrossingCampaignRules, type EngagementDefinition, type Locale,
} from "@shi/game-core";
import campaignJson from "../../../content/campaigns/chapter-01-daze.json";
import engagementJson from "../../../content/engagements/chapter-01-broken-crossing.v1.json";
import rulesJson from "../../../content/engagements/chapter-01-crossing-campaign.rules.v1.json";
import rulesV2Json from "../../../content/engagements/chapter-01-crossing-campaign.rules.v2.json";
import aftermathJson from "../../../content/engagements/chapter-01-crossing-aftermath.v2.json";

const campaign = campaignJson as Campaign;
const definition = engagementJson as EngagementDefinition;
export const DEVELOPMENT_CROSSING_KEY = "shi.development.crossing-campaign.v1";
export const DEVELOPMENT_CROSSING_V2_KEY = "shi.development.crossing-campaign.v2";
export const INTERNAL_CROSSING_V2_KEY = "shi.internal.crossing-campaign.v2";

interface Snapshot {
  snapshotVersion: 1;
  ledger: CrossingCampaignReplay["save"];
  pendingEventIndex: number | null;
}

export function createDevelopmentCrossingDriver(storage: Pick<Storage, "getItem" | "setItem">, revision: 1 | 2 = 1, channel: "development" | "internal" = "development") {
  if (channel === "internal" && revision !== 2) throw new Error("Internal crossing requires revision 2.");
  const rules = (revision === 1 ? rulesJson : rulesV2Json) as CrossingCampaignRules;
  const aftermath = revision === 2 ? aftermathJson as CrossingAftermath : undefined;
  const key = channel === "internal" ? INTERNAL_CROSSING_V2_KEY : revision === 1 ? DEVELOPMENT_CROSSING_KEY : DEVELOPMENT_CROSSING_V2_KEY;
  let current: CrossingCampaignReplay | null = null;
  let pendingEventIndex: number | null = null;
  const raw = storage.getItem(key);
  if (raw !== null) {
    const input: unknown = JSON.parse(raw);
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid development crossing save; original data preserved.");
    const snapshot = input as Snapshot;
    current = replayCrossingCampaign(campaign, definition, rules, snapshot.ledger, aftermath);
    if (Object.keys(snapshot).length !== 3 || snapshot.snapshotVersion !== 1 || !current) throw new Error("Invalid development crossing save; original data preserved.");
    const finalKind = current.save.events.at(-1)?.kind;
    if (snapshot.pendingEventIndex !== null && (snapshot.pendingEventIndex !== current.save.events.length
      || (finalKind !== "decision" && finalKind !== "finish-crossing") || !current.lastResolution)) {
      throw new Error("Invalid development reaction marker; original data preserved.");
    }
    pendingEventIndex = snapshot.pendingEventIndex;
  }
  const requireCurrent = () => {
    if (!current) throw new Error("Crossing campaign has not been initialized.");
    return current;
  };
  const persist = (next: CrossingCampaignReplay, pending: number | null) => {
    // Synchronous browser transaction: storage failure leaves the live state intact.
    storage.setItem(key, JSON.stringify({ snapshotVersion: 1, ledger: next.save, pendingEventIndex: pending } satisfies Snapshot));
    current = next;
    pendingEventIndex = pending;
  };
  return {
    restore: () => current ? { state: current.campaign, resolution: pendingEventIndex === null ? null : current.lastResolution! } : null,
    initialize(seed: number) {
      current ??= replayCrossingCampaign(campaign, definition, rules, createCrossingCampaignSave(campaign, rules, seed), aftermath);
      return requireCurrent().campaign;
    },
    getEngagement: () => current?.engagement ?? null,
    getCrossingRecord() {
      const crossing = current?.crossings.at(-1);
      if (!crossing) return undefined;
      const outcome = definition.outcomes.find((candidate) => candidate.id === crossing.outcomeId)!;
      return { nodeId: definition.nodeId, choiceId: crossing.planId, title: outcome.title,
        summary: current!.crossingResolutions.at(-1)!.choice.consequence,
        pressure: current!.crossingResolutions.at(-1)!.choice.pressure?.reveal,
        commitment: current!.crossingResolutions.at(-1)!.commitment,
        commands: crossing.history.map((record) => {
          const command = definition.commands.find((candidate) => candidate.id === record.commandId)!;
          return { id: command.id, title: command.title, reaction: command.response.reveal };
        }) };
    },
    getCrossingCommitment: () => current?.crossingResolutions.at(-1)?.commitment,
    interludeNamespace: key,
    getRetreatCrossing: () => ({ definition, rules, aftermath, save: JSON.parse(JSON.stringify(requireCurrent().save)) as CrossingCampaignReplay["save"] }),
    hasSave: () => Boolean(current?.save.events.length),
    commit(event: CrossingCampaignEvent) {
      if (pendingEventIndex !== null) throw new Error("Read the saved reaction before issuing another order.");
      const next = advanceCrossingCampaign(campaign, definition, rules, requireCurrent().save, event, aftermath);
      const pending = event.kind === "decision" || event.kind === "finish-crossing" ? next.save.events.length : null;
      persist(next, pending);
      return next;
    },
    acknowledge() {
      if (pendingEventIndex !== null) persist(requireCurrent(), null);
    },
    reset(seed: number) {
      const next = replayCrossingCampaign(campaign, definition, rules, createCrossingCampaignSave(campaign, rules, seed), aftermath);
      if (!next) throw new Error("Invalid new crossing campaign.");
      persist(next, null);
      return next.campaign;
    },
    labels(locale: Locale) {
      const chinese = locale.startsWith("zh");
      return {
        status: channel === "internal" ? chinese ? "内部试玩2 · 渡河命令影响陈县议事 · 非商店发行版" : "Internal playthrough 2 · crossing orders affect Chen · not a store release"
          : chinese ? `开发试玩${revision} · 战场命令会影响后续` : `Development playthrough ${revision} · field orders affect what follows`,
        boundary: chinese ? "这是可改变局部命运的虚构渡河场景。每道命令都会保存；关闭后可继续，但已发出的命令不能撤回。旧版存档独立保留。" : "This reconstructed crossing can change local outcomes. Each order is saved. Close and resume without undoing issued orders. Existing release saves remain separate.",
        cost: chinese ? "渡河的实际代价取决于接下来的三道战场命令；不是下面旧版抽象方案的固定数值。" : "The crossing's actual cost depends on the next three field orders, not the old abstract plan's fixed values.",
        begin: chinese ? "进入渡河指挥" : "Take command of the crossing",
        resume: chinese ? "继续已保存的渡河" : "Resume the saved crossing",
        cancel: chinese ? "尚未发令 · 返回选择方案" : "No order issued · return to plan selection",
        finish: chinese ? "保存渡河结果并继续" : "Save the crossing outcome and continue",
        effects: chinese ? "本次渡河的行动层代价 · 其他已披露压力另计" : "Crossing action costs · other disclosed pressure layers still apply",
        promise: revision === 2 ? chinese ? "承诺的兑现与代价，要由实际渡河结果判断，不能只凭选定的方案。" : "The actual crossing result decides the promise judgment and its costs, not the plan alone." : undefined,
        error: chinese ? "未能保存。进度没有推进；请检查存储空间后重试。" : "Could not save. Progress has not advanced; check storage and try again.",
      };
    },
  };
}

export type DevelopmentCrossingDriver = ReturnType<typeof createDevelopmentCrossingDriver>;
