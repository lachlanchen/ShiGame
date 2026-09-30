import { localize, type Locale } from "@shi/game-core";
import presentation from "../../../../content/presentation/viewpoints.v1.json";

export function ViewpointIntro({ scene, locale }: { scene: keyof typeof presentation.scenes; locale: Locale }) {
  const passage = presentation.scenes[scene];
  const language = locale === "zh-Hans" ? "zh-Hans" : "en";
  return <section data-testid={`${scene}-viewpoint`} lang={language} dir="ltr">
    <h4>{localize(passage.title, locale)}</h4>
    <p className="chen-prose">{localize(passage.text, locale)}</p>
    <p className="chen-prose" data-testid={`${scene}-story-bridge`}>{localize(passage.bridge, locale)}</p>
  </section>;
}
