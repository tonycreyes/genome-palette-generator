import ResetWorkspace from './ResetWorkspace';

export default function PaletteHelp({onReset,hidden}:{onReset:()=>string|null;hidden:boolean}){
 return <main id="help" className="guide" hidden={hidden} aria-label="Palette help">
  <a className="guide-back" href="#main">← Back to palette</a>
  <header className="guide-intro"><span className="guide-eyebrow">Genome help</span><h1 tabIndex={-1}>Using Genome</h1>
  <p>Enter your brand colors, generate supporting shades, and choose which steps to include in your palette.</p></header>
  <nav className="guide-nav" aria-label="Help sections"><a href="#help-start">Getting started</a><a href="#help-generation">Generation</a><a href="#help-export">Exporting</a><a href="#help-system">Design systems</a><a href="#help-saving">Saving</a><a href="#help-resources">Resources</a></nav>
  <section id="help-start" className="guide-section"><h2>Getting started</h2>
  <ol className="guide-checklist">
   <li><strong>Set your colors.</strong> Open a color family and enter its base HEX and any pinned colors. Choose Apply colors to save your changes. Genome preserves these exact inputs in the full palette.</li>
   <li><strong>Choose a scale mapping.</strong> Choose which shades appear and how they’re labeled. Company-named mappings use Genome-generated colors; they don’t load the company’s palette.</li>
   <li><strong>Check and export.</strong> Check shades against your background with Show contrast. Click a swatch to copy its HEX, or open Show JSON to export your palette.</li>
  </ol><p><a href="#guide">Explore the interactive guide →</a></p></section>
  <section id="help-generation" className="guide-section"><h2>How are the shades generated?</h2><p>Genome places your inputs near their measured lightness positions. It generates supporting shades in OKLab, then adjusts them toward 22 CIELAB lightness targets. Base and pinned HEX values remain exact.</p><p>Univers shows all 22 slots. Other mappings select fewer steps and assign labels. Use Edit shades to add, remove or rename steps across every family.</p></section>
  <section id="help-export" className="guide-section"><h2>What does the export include?</h2><p>Selected scale JSON contains the displayed shades and their names. If any base or pinned colors are missing, Genome lists them before you copy or download. Choose Include these colors to add them as named entries, or Export without these colors to leave them out. Your palette and shade selection stay unchanged.</p><p>Original Genome JSON includes all 22 slots per family, including exact base and pinned colors. The complete Figma import workflow remains unverified for this version.</p><p>Neither format can restore an editing session.</p></section>
  <section id="help-system" className="guide-section"><h2>Using the palette in a design system</h2><p>Genome was designed to help different brands share a color structure. Each brand can use its own colors with the same scale labels and role names.</p><p>Assign shades to text, surfaces, borders, buttons and interaction states in your design system. Check the color pairs in your UI for each brand and mode. A step number does not guarantee sufficient contrast.</p></section>
  <section id="help-saving" className="guide-section"><h2>Saving your work</h2><p>Applied colors, family names and your scale mapping are saved automatically in this browser. Unapplied editor changes are not saved.</p><p>Your saved palette is tied to this site address and browser. It isn’t synced to an account or another device. Opening a different site address gives you a separate workspace. Clearing this site’s browser data removes the saved palette.</p><p>Downloaded JSON contains color data. It cannot be imported to restore your workspace.</p><ResetWorkspace onReset={onReset}/></section>
  <section id="help-resources" className="guide-section guide-reading"><h2>Resources from the creator</h2><p>Kevin Muldoon’s writing explains Genome’s approach and terminology. The video shows the original interface, so its controls differ from this version. Medium articles may require membership.</p>
   <ul className="help-resources">
    <li><a href="https://www.youtube.com/watch?v=iDmdVCPY9xs" target="_blank" rel="noreferrer">Original quick-start video ↗</a><span>Linked from the original site; demonstrates the original interface.</span></li>
    <li><a href="https://uxdesign.cc/the-genome-color-tool-28ce73b20768" target="_blank" rel="noreferrer">The Genome Color Tool (2022) ↗</a><span>The creator’s introduction to generating palettes for multiple brands.</span></li>
    <li><a href="https://uxdesign.cc/how-should-you-name-your-colors-in-a-design-system-3086513476df" target="_blank" rel="noreferrer">How to name colors in a Design System (2022) ↗</a><span>Definitive, semantic and contextual naming.</span></li>
    <li><a href="https://uxdesign.cc/applying-game-design-logic-to-your-design-system-111a2116509" target="_blank" rel="noreferrer">Applying game design logic to your design system (2021) ↗</a><span>Broader design-system thinking, linked by the original tool.</span></li>
    <li><a href="https://uxdesign.cc/stop-using-oklch-lightness-for-your-color-scale-02025deca49d" target="_blank" rel="noreferrer">Stop using OKLCH lightness for your color scale (2026) ↗</a><span>More recent writing by the creator; a perspective to explore, not a change to this generator.</span></li>
    <li><a href="https://github.com/caoimghgin/genome-palette-generator" target="_blank" rel="noreferrer">Original generator and README ↗</a><span>The source implementation and original workflow.</span></li>
    <li><a href="https://github.com/caoimghgin/genome-import-figma" target="_blank" rel="noreferrer">Original Figma importer source ↗</a><span>Explains the companion import step. Full compatibility with this updated workspace has not been verified in Figma.</span></li>
   </ul>
  </section>
  <a className="guide-cta" href="#main">Return to your palette →</a>
 </main>;
}
