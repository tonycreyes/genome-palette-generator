# Preset provenance and update policy

Reviewed 2026-09-07. This audit verifies what each existing preset represents. It does **not** certify the generated colors as an official external palette. External package versions below identify reviewed sources, not dependencies implemented by this app.

## Findings and disposition

All nine selections use the Genome generator, then select and label its lightness slots. They do not invoke nine different generators. Existing HEX output and the full 22-row importer export are preserved. Source review corrected the classification and explanations; no external palette has been substituted silently.

| Preset | Classification | Reviewed source | Finding |
| --- | --- | --- | --- |
| Univers | Genome scale v1 | [Genome revision 70b9517](https://github.com/caoimghgin/genome-palette-generator/tree/70b95173e7cc468d688181c38734890d343b39d7) | Full native lightness grid; no external currency claim. |
| Genome | Genome scale v1 | Same revision | Native chromatic and neutral mappings; step labels do not guarantee contrast for exact inputs. |
| IBM Carbon | Approximate v1 | [Carbon color guidance](https://carbondesignsystem.com/elements/color/overview/), @carbon/colors 11.57.0 | Our 10–100 mapping does not load IBM’s published colors or theme tokens. |
| Salesforce Lightning | Approximate v1 | [Official SLDS repository](https://github.com/salesforce-ux/design-system), @salesforce-ux/design-system 2.264.1 | Lightness-based mapping is not a Salesforce token dataset or SLDS theme implementation. |
| Adobe Spectrum | Legacy v1 | [Spectrum design data](https://github.com/adobe/spectrum-design-data), @adobe/spectrum-tokens 15.2.0 | Adobe’s main branch now carries Spectrum 2; S1 uses s1-legacy/v12 packages. Our unversioned 100–1300 mapping cannot claim parity with either. |
| Ant Design | Approximate v1 | [Official color generator](https://github.com/ant-design/ant-design-colors), @ant-design/colors 8.0.1 | Ant has its own generator; Genome uses fixed lightness targets with 1–10 labels. |
| Material | Legacy v1 | [Material Color Utilities](https://github.com/material-foundation/material-color-utilities), @material/material-color-utilities 0.4.0 | The inherited 50–900 mapping is not Material 3’s HCT tonal palette/dynamic scheme implementation. The old option also incorrectly reused a NewsKit message; that message is removed. |
| Accessible Palette | Approximate v1 | [Creator’s tool](https://accessiblepalette.com/) | Source supports adjustable lightness and interpolation settings; a single fixed mapping cannot reproduce every configuration. |
| ColorBox | Legacy v1 | [Lyft coloralgorithm](https://github.com/lyft/coloralgorithm/tree/3aae9b0f958db735b24b604ae3eb177859d4416f) | Source accepts hue/saturation/luminosity curves and configurable steps. Genome’s fixed mapping is not that generator. |

“Legacy” describes the mapping in this app; it does not assert that an external project is abandoned. “Source reviewed” means provenance and method were checked, not that all possible HEX outputs were compared. None of the seven external presets qualifies as an official implementation.

## Reproducible baseline

- `src/constants/presetMappings.v1.json`: frozen inherited mappings, covered by a SHA-256 regression lock.
- `src/constants/presetCatalog.json`: stable IDs, classifications, descriptions, source links and review dates.
- Saved workspaces record `presetRevision: genome-v1`. Unversioned workspaces migrate to v1. Unknown revisions are rejected and protected against storage overwrite.
- `evidence/presets/sources.json`: live-read package versions and integrity hashes, repository revisions, and a text fingerprint for Accessible Palette. The source checker never overwrites this baseline.
- The original nine output fixtures and generation/property tests remain in the suite. Those prove regression safety, not official parity.

## Checking for updates

Run `npm run presets:check -- --report /tmp/preset-source-report.json`.

Exit codes: 0 = recorded sources unchanged; 1 = review needed; 2 = source unavailable/unreadable. Network errors must not be reported as “up to date.” Package versions and integrity detect releases or same-version content changes. Repository heads and page text detect broader changes that may be unrelated to colors; a reviewer must interpret them. An unchanged version is not proof of correctness or the absence of documentation changes.

The repository includes a read-only GitHub Actions workflow for manual dispatch and pull requests touching the checker/baseline. It uploads a report even on drift/failure, and does not create comments, issues, commits or releases. No scheduled check is configured.

## Adopting an update

1. Review source release notes and changes, including palette data, generation rules, neutral handling, themes and naming.
2. Decide whether the change belongs to an existing approximation or requires a separate official implementation. Material 3 and official Ant generation need separate algorithms; Spectrum and Carbon need explicit dataset/theme choices.
3. Add a new revision and reference-output tests; never edit the v1 mapping lock merely to make a test pass.
4. Compare representative saturated, neutral, boundary and pinned inputs. Measure final HEX, lightness ordering, gamut handling and contrast. Test all supported export formats and actual importer behavior before claiming compatibility.
5. Offer an explicit upgrade that shows differences and preserves the previous workspace. Keep the old revision runnable.
6. Update reviewed source fingerprints only after review, together with the evidence and review date.

## Remaining product scope

Current company-named options are accurately classified approximations/legacy mappings, **not refreshed official generators or palette datasets**. Adding official outputs is a separate implementation with output/export and exact-input contracts. Replacing all mappings with “latest” would change the meaning of saved work and the existing Genome importer contract.
