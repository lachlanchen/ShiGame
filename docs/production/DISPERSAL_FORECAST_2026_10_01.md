# Explain orderly dispersal before commitment

Web and native retreat previews now show the two existing orderly-dispersal
requirements: food after the order and the highest backing among civilians,
partners and soldiers. Displayed checks are the checks used to choose the
outcome, not a second UI approximation. One group must meet the threshold;
three sub-threshold groups are not added together.

Ending command remains available when requirements fail. The UI distinguishes
the freedom to stop commanding from the ability to provision an orderly
departure, names the exact shortfall, and retains the scattering forecast and
its uncertainty about absent people. No canonical rules, story, balance,
resource values, save schema or source claims changed.

## Verification

-14 core tests passed, including5 threshold fixtures and the exhaustive audit:
  993 inherited entries,117671 complete routes, all four outcomes and no dead ends.
  Threshold fixtures cover food shortage, three weak groups, and each of the
  three groups independently meeting the support requirement. Inspection is pure.
-59 retreat web tests passed; core and web TypeScript checks passed.
- Production web build and asset/budget validation passed; initial JS99.40KiB.
- Native presentation checker passed50phases/four outcomes and checks displayed
  values against the inspected post-order state. Both full-app production and
  preview Swift configurations typechecked on the shared Mac.
  Verified source archive SHA-256:
  `fbc6e668a7c6a41b38ca45bcdd0aec89b71722cc465939ad6c5f32cf59b11ebf`.
- Visible title-to-scattered web route passed67checks/21screens without browser
  exceptions. Inspected phone screenshot shows food0/required1/missing1, support
  10/required2/met, warning and confirmation. Reload/response checks also pass.
  Private status `.runtime/story-review/2026-10-01T04-16-58.687Z/status.json`,
  SHA-256 `1a3454380545f49703029baba05e967050cc32610db149a9490d638361fd6253`.
- All owned GUI processes and ports verified absent after cleanup.

Native layout of the additional explanation still needs device review. Prior
native replay screenshots do not prove this newer UI. No store submission or
public release. Human comprehension/fun review remains separate from tests.
