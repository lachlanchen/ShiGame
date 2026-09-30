import { useEffect, useState } from "react";
import { prepareRetreatEntry, type Campaign, type CouncilDefinition, type FanyangDefinition, type GameState, type RetreatEntry } from "@shi/game-core";
import campaignText from "../../../../content/campaigns/chapter-01-daze.json?raw";
import councilText from "../../../../content/councils/chen-council.v1.json?raw";
import fanyangText from "../../../../content/councils/fanyang-guarantee.v1.json?raw";
import rulesText from "../../../../content/campaigns/chen-retreat.rules.v1.json?raw";
import storyText from "../../../../content/story-drafts/chen-retreat.v1.json?raw";
import { RetreatScene } from "./RetreatScene";

async function hash(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function RetreatPreview({ origin, councilSnapshot, fanyangSnapshot, reducedMotion, onClose, onSavingChange }: {
  origin: GameState; councilSnapshot: string; fanyangSnapshot: string; reducedMotion: boolean;
  onClose: () => void; onSavingChange?: (value: boolean) => void;
}) {
  const [loaded, setLoaded] = useState<{ entry: RetreatEntry; rulesHash: string; storyHash: string } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [campaign, council, fanyang, rulesHash, storyHash] = await Promise.all([campaignText, councilText, fanyangText, rulesText, storyText].map(hash));
        const entry = prepareRetreatEntry({ campaign: JSON.parse(campaignText) as Campaign, council: JSON.parse(councilText) as CouncilDefinition, fanyang: JSON.parse(fanyangText) as FanyangDefinition },
          { chapter: origin, council: JSON.parse(councilSnapshot), fanyang: JSON.parse(fanyangSnapshot) }, { campaign: campaign!, council: council!, fanyang: fanyang! });
        if (!entry) throw new Error("Invalid prior story");
        if (alive) setLoaded({ entry, rulesHash: rulesHash!, storyHash: storyHash! });
      } catch { if (alive) setError(true); }
    })();
    return () => { alive = false; };
  }, [origin, councilSnapshot, fanyangSnapshot]);
  if (loaded) return <RetreatScene {...loaded} reducedMotion={reducedMotion} onClose={onClose} onSavingChange={onSavingChange} />;
  return <section className="drawer chen-council" role="dialog" aria-modal="true" aria-label="Retreat development preview" lang="zh-Hans">
    <p role={error ? "alert" : "status"}>{error ? "不能验证前段记录，未修改任何存档。" : "正在核对前段经历…"}</p>
    <button className="primary-button" autoFocus data-council-action="close" onClick={onClose}>返回范阳</button>
  </section>;
}
