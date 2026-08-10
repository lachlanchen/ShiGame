# Third-party notices

Status: production dependency register · updated 2026-08-10

SHI does not treat an npm package name as sufficient rights evidence. Runtime third-party assets are pinned, purpose-limited and listed here. Package metadata and this register are checked by `npm run validate:fonts`.

## Self-hosted typefaces

The following Fontsource variable packages are pinned to `5.3.0`. The included font files are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org); Fontsource packaging code is MIT licensed. They are built into SHI and served from the same origin. No player request is sent to Google Fonts, Fontsource or a font CDN.

| Package | Family | Runtime purpose | License |
| --- | --- | --- | --- |
| `@fontsource-variable/inter` | Inter Variable | Latin, Cyrillic and Vietnamese interface | OFL-1.1 |
| `@fontsource-variable/cormorant-garamond` | Cormorant Garamond Variable | Latin/Cyrillic/Vietnamese display and narrative hierarchy | OFL-1.1 |
| `@fontsource-variable/noto-serif-sc` | Noto Serif SC Variable | SHI seal and Simplified-Chinese narrative hierarchy | OFL-1.1 |
| `@fontsource-variable/noto-sans-arabic` | Noto Sans Arabic Variable | Arabic interface and RTL typography | OFL-1.1 |
| `@fontsource-variable/noto-sans-jp` | Noto Sans JP Variable | Japanese interface | OFL-1.1 |
| `@fontsource-variable/noto-sans-kr` | Noto Sans KR Variable | Korean interface | OFL-1.1 |
| `@fontsource-variable/noto-sans-sc` | Noto Sans SC Variable | Simplified-Chinese interface | OFL-1.1 |
| `@fontsource-variable/noto-sans-tc` | Noto Sans TC Variable | Traditional-Chinese interface | OFL-1.1 |

Inter and Cormorant Garamond form the small baseline layer. The Chinese serif seal face and locale-specific Arabic/CJK sans faces load as separate CSS chunks. Unicode-range declarations ensure the browser requests only slices needed by visible text; release validation measures real requests rather than inferring that behavior from package structure.

This notice supplements, and does not replace, the license files and metadata distributed in the exact npm packages and source repositories maintained by [Fontsource](https://fontsource.org/).

## Audio media boundary

The Chapter I soundscape contains no third-party recording, sample pack, music file or generated media. Both clients synthesize it from the project-authored numeric contract at runtime; rights and the open human-review state are recorded in [`assets/provenance/chapter-01-audio.json`](../../assets/provenance/chapter-01-audio.json). Future recordings, instruments, voices or generated music require their own entries here before packaging.

## Offline skeletal authoring boundary

[MPFB 2.0.17](https://github.com/makehumancommunity/mpfb2) is used only outside Git as an offline Blender character-authoring tool. Its program code is GPL-3.0-or-later and is not linked into or distributed with the game runtime. MPFB's bundled basemesh/rig assets and the official [MakeHuman system asset pack](https://static.makehumancommunity.org/asset_packs/makehuman_system_assets.html) are CC0. SHI may distribute reviewed editable/exported output from that baseline while recording the contribution in asset provenance.

The Chapter I council pipeline does not use MPFB community assets or bundled modern casual clothing/hair. SHI authors its own coarse garment silhouettes, role props and Unreal materials. CC0 availability is a rights boundary, not historical approval; every identifiable late-Qin garment, hairstyle, shoe, fastening and carried object remains a separate review gate.

The council facial-performance engineering blockout admits a narrower named subset of those CC0 system inputs: the official **Faceunits 01** pack supplies only the twenty-one body controls enumerated by the SHI morph contract, while the MakeHuman system **low-poly eye geometry**, its brown-eye material and `brown_eye.png` texture supply the eye sections used by eight gaze controls. All remaining selection, weighting, character layering, deterministic cadence, export and review work is project-authored. Exact upstream archive/file hashes, embedded-license evidence, admitted contributions and output receipts are recorded in [`shi-daze-council-facial-performance-v1.json`](../../assets/provenance/shi-daze-council-facial-performance-v1.json). CC0 permits reuse; it does not establish historical accuracy, character likeness, final acting quality or approval for close-camera release.
