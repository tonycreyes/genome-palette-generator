# Genome 0.2.0

Updated September 9, 2026. [Open the hosted app](https://genome-palette-generator.vercel.app).

## What changed

- A simpler palette workspace with editable family names, exact base colors and up to five pins per family.
- Custom shade selection across families: add, remove or rename steps, adjust existing lightness slots, and reset or cancel draft edits.
- Contrast filtering, swatch copying, selected-scale JSON and the original full 22-slot export.
- Browser saving, confirmed workspace reset, an interactive Guide and a dedicated Help page.
- Selected-scale exports list missing base and pinned colors and require a choice to include or omit them before copying or downloading.
- Security hardening and clearer saving/export guidance, with the original engine and attribution preserved.

## Known limits

Saving is local to the browser and site address. JSON downloads contain palette data and cannot restore an editing session. Figma compatibility is unverified. The generator uses 22 fixed lightness slots; finding an exact input’s slot still requires consulting the original JSON export.

## Verification

188 code tests, production build, and all 60 desktop/mobile Chromium browser cases passed. Secret and dependency scans found no issues in the scoped review. Mobile emulation and automated accessibility scans do not replace physical-device or complete accessibility testing.

Upstream licensing remains unspecified; no new license is asserted.
