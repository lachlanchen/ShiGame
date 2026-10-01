import { useState } from "react";
import type { Locale } from "@shi/game-core";
import scene from "../../../../content/presentation/crossing-establishing.v1.json";
import image from "../../../../assets/art/scenes/broken-crossing-establishing-v1.jpg";
import "./CrossingEstablishing.css";

/** Scenery only. The parent removes it as soon as the first order is saved. */
export function CrossingEstablishing({ locale }: { locale: Locale }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  const text = scene.labels[locale];
  return <figure className="crossing-establishing" data-testid="crossing-establishing">
    <img src={image} width={scene.width} height={scene.height} alt={text.alt}
      decoding="async" onError={() => setFailed(true)} />
    <figcaption>{text.caption}</figcaption>
  </figure>;
}
