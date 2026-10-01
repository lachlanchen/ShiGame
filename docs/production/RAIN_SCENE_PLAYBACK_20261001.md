# Rain shelter cinematic playback checkpoint

The existing first decision now includes the consistent Chen Sheng image and
the retained Musia B cue in a private development scene. The sixteen-second
animatic uses a gentle camera push; natural character animation remains work.
The image precedes the question about the name register. It never represents
an outcome before the player has chosen it.

## Review launch

Keep this server on loopback and reuse the project's single review desktop:

```bash
VITE_SHI_NATIVE=0 VITE_SHI_PRIVATE_RAIN_SCENE=1 npm run dev
```

Open `http://127.0.0.1:5173/?seed=00000000&crossing=campaign-v2&cinema=rain-review`.
Private files must already exist under the ignored scene package; otherwise
the player retains the written story and decisions. Exact asset hashes and
review boundaries are in
`content/research/council-listening-animatic-review.v1.json`.

Play and sound each require a gesture. Opening a drawer or leaving the page
pauses media; returning permits another gesture without starting playback.
Reduced motion uses the still and translated description. Saving the order
removes the introductory player before its matching consequence appears.
Controller Confirm acts on a focused film control; it does not issue the
selected order while the player's focus remains in the film.

## Evidence

```bash
SHI_PLAYTEST_RAIN_CINEMA=1 node scripts/playtest-retreat-visible.mjs crossing-v2
```

The accepted October 1 run passed 92 checks, captured 29 screenshots, and
reported no browser exceptions. It played the actual scored file, verified
unchanged decision bytes through playback/skip and one saved first choice,
then completed the crossing, Chen council, Fan Yang and retreat route with
cold resumes. Phone, desktop and static Arabic/RTL views were inspected.
The scene description and controls cover all eleven locales; this does not
claim complete narrative translations where existing English fallbacks remain.

Full validation and build passed: 83 core tests, 376 web tests, typechecks and
bundle budgets. Production JavaScript excludes the private scene endpoints and
asset identities. The dedicated desktop/server processes and ports were stopped.
An earlier run caught a config import failure; the corrected run is the evidence.

The source music and all six alternatives are preserved. The encoded cue is
-23.3 LUFS integrated with a -9.0 dBFS true peak before the browser volume of
0.7. These measurements establish levels, not artistic listening approval.
Full listening, costume/identity continuity, natural motion, commercial asset
admission and native/device review remain required before release.

LocalVideoGen's studio endpoint on port 8190 is not listening; the existing
ComfyUI listener on 8188 belongs to that project's session and was left intact.
Its current model also needs admission for the intended commercial markets.
The next motion pass should use the existing editable Blender character and
camera pipeline while a suitable local video route is resolved. Preserve the
original face anchor and review weight, gaze, hair, costume and hand contact
before replacing this animatic with a character performance.
