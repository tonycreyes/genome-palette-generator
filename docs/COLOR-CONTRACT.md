# Color and export contract

## Generation and selection

Base and pinned HEX values remain exact. Inputs are assigned to existing lightness slots; inputs that collide in the same slot are rejected. Genome interpolates supporting colors in OKLab and organizes them against 22 CIELAB lightness targets.

A mapping selects slots and labels. It does not change the generator or load official company palettes. Inputs omitted by a selected scale still shape generation but do not appear as extra displayed shades. Contrast is computed from the resulting HEX values, not inferred from shade labels.

Custom scales contain 2–22 unique slots with unique, case-insensitive labels of 1–24 ASCII letters, numbers, hyphens or underscores. They apply across all families and are ordered light to dark. Renaming or removing a step leaves the remaining HEX values unchanged.

The 100–950 starter selects targets 95, 85, 75, 65, 55, 45, 35, 25, 15 and 5. A label such as 500 is not a lightness measurement. An exact input may differ from its nominal slot target.

## Exports

- **Selected scale JSON** (`genome-scale.json`, format `genome-scale-v1`): family columns with `{name, hex}` shade arrays. Selected shades retain their order and names. Before copying or downloading, the UI lists missing exact inputs and requires an explicit choice to include or omit them. Included inputs are appended as `base` and `pin-N` entries, with numeric suffixes when needed to avoid case-insensitive name collisions. Existing HEX values, labels and saved selection remain unchanged.
- **Original Genome JSON** (`genome-gcs.json`): all 22 canonical rows per family, independently of the selected scale, including exact inputs.

Contrast filtering changes the display only, not exported HEX values. Neither format restores an editing session. No DTCG or end-to-end Figma compatibility is claimed.

## Saved state

Applied state uses `genome.workspace.v1`, with mapping revision `genome-v1`. Custom scales remain available when comparing predefined mappings. Unrecognized mapping revisions are protected from automatic overwrite. Browser storage belongs to the exact site origin; drafts and contrast controls are not persisted.

## Original importer references

The original [mapper](https://github.com/caoimghgin/genome-import-figma/blob/e04d1ea1eb68c7420fa89b85075f3f2828f65ecd/src/genome/mapper/index.ts) selects canonical rows and assigns weights. Its [UI](https://github.com/caoimghgin/genome-import-figma/blob/e04d1ea1eb68c7420fa89b85075f3f2828f65ecd/src/ui.tsx) chooses optimization after reading the full export. Successful parsing does not establish complete plugin compatibility or preservation of every input through the importer.
