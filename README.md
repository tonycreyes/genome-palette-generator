# Genome

Build color scales around your brand colors. This fork modernizes [Kevin Muldoon’s Genome palette generator](https://github.com/caoimghgin/genome-palette-generator), preserving its original color engine.

[Open Genome](https://genome-palette-generator.vercel.app)

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open [localhost:4191](http://127.0.0.1:4191). To preview a production build, stop the dev server, run `npm run build`, then `npm run preview`.

## Make a palette

1. Open a color family, enter a base HEX and optional pinned colors, then **Apply colors**.
2. Choose a scale mapping or use **Edit shades** to add, remove and rename steps.
3. Check contrast, click a swatch to copy its HEX, or download JSON.

Open **Guide** for interactive examples or **Help** for instructions on editing, saving and exporting. Company-named mappings select Genome shades; they are not official company palettes.

## Saving and exports

Applied work saves in your browser at the exact site address. It does not sync across browsers or URLs, and clearing site data removes it.

- **Selected scale JSON** contains the displayed shade names and HEX values. If base or pinned colors are missing, choose whether to include them as additional named entries before copying or downloading.
- **Original Genome JSON** contains the full 22-slot palette for each family.

Neither file restores an editing session. Figma compatibility is unverified. Base colors and pins stay exact. Including additional colors in an export does not change your palette or selected shades.

## Release and documentation

Version 0.2.0 is available [on Vercel](https://genome-palette-generator.vercel.app) and as source in this fork. The release passed 188 code tests and 60 desktop/mobile Chromium browser cases. Run `npm run test:all` to check the project and `npm run test:e2e:production` to test the production build. Install test browsers first with `npx playwright install chromium`.

[Release notes](RELEASE-NOTES.md) · [Technical references and learning resources](docs/README.md)

## Credits and licensing

Original work by Kevin Muldoon / caoimghgin; original history and attribution are preserved. Upstream has no declared license. This fork does not claim MIT or other licensing rights; public availability alone does not grant permission for broader reuse.
