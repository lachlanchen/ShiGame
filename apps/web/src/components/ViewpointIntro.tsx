import { localize, type Locale } from "@shi/game-core";
import presentation from "../../../../content/presentation/viewpoints.v1.json";

export function ViewpointIntro({ scene, locale, chapterChoices = [] }: { scene: keyof typeof presentation.scenes; locale: Locale; chapterChoices?: readonly string[] }) {
  const passage = presentation.scenes[scene];
  const memories = scene === "council" ? presentation.scenes.council.chapterBridges.filter(item => chapterChoices.includes(item.afterChoice)) : [];
  const language = locale === "zh-Hans" ? "zh-Hans" : "en";
  return <section data-testid={`${scene}-viewpoint`} lang={language} dir="ltr">
    <h4>{localize(passage.title, locale)}</h4>
    <p className="chen-prose">{localize(passage.text, locale)}</p>
    <p className="chen-prose" data-testid={`${scene}-story-bridge`}>{localize(passage.bridge, locale)}</p>
    {memories.length === 1 && <p className="chen-prose" data-testid="council-chapter-bridge" data-choice={memories[0]!.afterChoice}>{localize(memories[0]!.text, locale)}</p>}
  </section>;
}
