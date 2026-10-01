# Precise retreat source locations

Reread the owner's local Tongjian reference passages before adding the source locations to the playable development history panel. Reference SHA-256 remains `8c38d75fe3dff92552ee6cb5fea6855ae71280eb9f2f4a38f0ba36d1d76daf17`. No book text or private source file is added to Git.

The old story's recorded readback ranges omitted lines2703–2709 even though its `qin-response` source anchor refers there. New versioned metadata `content/research/retreat-source-locations.v1.json` closes that audit gap without modifying story/rules hashes or rewriting old saves. Inspected passages:

- Volume7, 2703–2709: Kong Fu's warning, Zhou Wen's advance and Qin's response.
- Volume8, 2773–2783: successive retreats with intervening durations, Zhou Wen's death, Tian Zang's attributed justification and killing of Wu Guang, later military failure.
- Volume8, 2791–2793: Chen military reverses and Chen Sheng's killing on his return at Xiachengfu.
- Volume8, 2799: Lü Chen's retaking of Chen and burial of Chen Sheng.

The game still labels the grain station, keeper, arrival timing and local household outcomes as fictional reconstruction/counterfactual consequence. It does not collapse source paragraphs into same-day reports or put the keeper at Xiachengfu. Tian Zang's words remain an attributed position, not a neutral verdict. Lü Chen's subsequent action does not establish the player's participation. Mixed phonetic/commentarial material is not used as gameplay event narration; no exact modern calendar conversion is claimed.

Each current scene's source panel displays the matching local line range and explains that these are not standard-edition page numbers. This improves traceability during play, not independent historical peer review. All55 retreat component tests pass, including source-ID/volume/range completeness and source-hash agreement. TypeScript, production build and two build-validator tests pass; budgets unchanged at JS99.40 KiB/CSS11.87 KiB/deploy26.98 MiB. No browser visual review of the new source labels, native export or store/public release was performed.

## Ending-source retention fix

At a completed ending, there is no next decision scene. The panel previously selected that missing scene and dropped its source references even though the epilogue still described Lü Chen. It now uses the final saved scene for both response reading and completed endings. The three orderly endings across all three record-custody variants are checked for Chen-fall and Lü Chen source locations, and opening the source panel retains exact save bytes. All55 retreat tests and TypeScript pass after this fix. This changes source presentation only; the historical epilogue, local fates, rules and save hashes remain unchanged. A fresh browser/native visual check remains pending.
