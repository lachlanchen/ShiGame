import type { Locale } from "@shi/game-core";
import { SceneFilm } from "./SceneFilm";
import { rainSceneDescription } from "../rain-scene-description";
import "./PrivateRainScene.css";

/** The neutral listening image precedes the first decision, never its outcome. */
export function PrivateRainScene({ locale, reducedMotion, active, description }: {
  locale: Locale; reducedMotion: boolean; active: boolean; description: string;
}) {
  const base = "/__shi_private_rain_scene__/";
  return <figure className="rain-scene" data-testid="private-rain-scene" data-motion={reducedMotion ? "reduced" : "full"}>
    {reducedMotion ? <img src={`${base}listening.png`} alt={rainSceneDescription[locale]} width="1672" height="941" /> :
      <SceneFilm locale={locale} active={active} soundtrack asset={{ src: `${base}listening.mp4`, poster: `${base}listening.png`,
        captions: { src: `${base}listening.vtt?locale=${locale}`, language: locale, label: description },
      }} />}
    <figcaption lang="en" dir="ltr">Private scene review · Chen Sheng listening · image + Musia B · animation and costume review pending</figcaption>
  </figure>;
}
