import { SilentFilm } from "./SilentFilm";
import { useState } from "react";

/** Engineering review only. No choice resolver, save writer or audio track. */
export function PrivateCouncilFilm({ reducedMotion }: { reducedMotion: boolean }) {
  const [open, setOpen] = useState(false);
  return <details className="chen-history" data-testid="private-council-film" lang="en" dir="ltr" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Private character-motion study · unfinished</summary>
    <p>This keeper rig is an engineering blockout, not a depiction of your saved order.
      Costume, hand expression and acting are not release-approved.</p>
    {open && (reducedMotion ? <p>Moving imagery is disabled by reduced motion. The written game response remains available.</p>
      : <SilentFilm locale="en" asset={{ src: "/__shi_private_council_film__/study.mp4", captions: {
        src: "/__shi_private_council_film__/study.vtt", language: "en", label: "English engineering description",
      } }} />)}
  </details>;
}
