import type { Locale } from "@shi/game-core";
import { SceneFilm, type SceneFilmAsset } from "./SceneFilm";

export type SilentFilmAsset = SceneFilmAsset;

/** Silent performance slot; the shared player never enables an audio track here. */
export function SilentFilm({ asset, locale }: { asset: SilentFilmAsset; locale: Locale }) {
  return <SceneFilm asset={asset} locale={locale} testId="silent-film" />;
}
