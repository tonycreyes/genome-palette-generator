import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const runtimeErrors = new WeakMap<object,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];runtimeErrors.set(page,errors);page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.locator('.column-heading').first().click();});
test.afterEach(async({page})=>{expect(runtimeErrors.get(page)).toEqual([]);});
async function apply(page:any,seed:string,pins='') {await page.getByLabel('Base HEX',{exact:true}).fill(seed);await page.getByLabel('Pinned colors').fill(pins);await page.getByRole('button',{name:'Apply colors',exact:true}).click();}
test('all presets preserve input data; original export retains every input and visible color',async({page})=>{
 await apply(page,'#000000','#332244, #553377, #AA77CC, #EECCFF');
 for(let preset=0;preset<9;preset++){
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption(String(preset));
 const column=page.locator('.palette-column').first();
 await expect(page.getByLabel('Base HEX',{exact:true})).toHaveValue('#000000');
 await expect(page.getByLabel('Pinned colors')).toHaveValue('#332244, #553377, #AA77CC, #EECCFF');
 }
 await page.getByRole('button',{name:'Show JSON'}).click();
 if(await page.getByRole('radio',{name:'Export without these colors',exact:true}).isVisible())await page.getByRole('radio',{name:'Export without these colors',exact:true}).click();
 await page.getByLabel('Export format').selectOption('genome');
 const json=JSON.parse((await page.getByLabel('Palette JSON').textContent())!);
 for(let i=0;i<10;i++){
 expect(json.columns[i].rows).toHaveLength(22);
 expect(json.columns[i].rows.map((r:any)=>r.row)).toEqual(Array.from({length:22},(_,n)=>n));
 for(const hex of await page.locator('.palette-column').nth(i).locator('.swatch-hex').allTextContents())expect(json.columns[i].rows.map((r:any)=>r.hex)).toContain(hex);
 }
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('0');expect(JSON.parse((await page.getByLabel('Palette JSON').textContent())!)).toEqual(json);
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download JSON'}).click();const download=await event;expect(JSON.parse(await fs.readFile((await download.path())!,'utf8'))).toEqual(json);
});
test('validation, rename, normalized input, removal and reload',async({page})=>{
 const initial=await page.locator('.swatch-hex').allTextContents();await apply(page,'#12');await expect(page.getByRole('alert')).toContainText('valid');expect(await page.locator('.swatch-hex').allTextContents()).toEqual(initial);
 await apply(page,'#0071B2','#0071B3');await expect(page.getByRole('alert')).toContainText('share');
 await apply(page,'#abc','#003355');await page.getByLabel('Semantic name').fill('brand');await page.getByRole('button',{name:'Apply colors',exact:true}).click();await page.reload();await page.locator('.column-heading').first().click();await expect(page.getByLabel('Base HEX',{exact:true})).toHaveValue('#AABBCC');await expect(page.getByLabel('Semantic name')).toHaveValue('brand');await expect(page.getByLabel('Pinned colors')).toHaveValue('#003355');
 await apply(page,'#abc');await page.reload();await page.locator('.column-heading').first().click();await expect(page.getByLabel('Pinned colors')).toHaveValue('');await expect(page.locator('.palette-column').first().getByText('Pinned',{exact:true})).toHaveCount(0);
});
test('keyboard copy success and contrast controls',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);const swatch=page.locator('.swatch').first();const hex=await swatch.locator('.swatch-hex').innerText();await swatch.focus();await page.keyboard.press('Enter');await expect(page.getByRole('status')).toHaveText(`Copied ${hex}`);expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(hex);
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();await page.getByLabel('Contrast background HEX').fill(hex);await expect(page.getByLabel('Contrast background HEX')).toHaveValue(hex);await expect(swatch).toHaveAttribute('aria-label',/contrast 1.00 to 1, below/);
 await page.getByLabel('Contrast background HEX').fill('bad-value');await expect(page.getByText('Enter a valid background HEX to compare contrast.',{exact:true})).toBeVisible();await page.getByLabel('Contrast background HEX').fill('#000000');await page.getByLabel('Contrast target').selectOption('7');await expect(swatch).toHaveAttribute('aria-label',/passes target/);
});
test('clipboard rejection offers correct manual-copy value',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))},configurable:true}));await page.reload();await page.locator('.column-heading').first().click();const swatch=page.locator('.swatch').first();const hex=await swatch.locator('.swatch-hex').innerText();await swatch.click();await expect(page.getByRole('status')).toContainText('Copy unavailable');await expect(page.getByLabel('Manual copy HEX')).toHaveValue(hex);
});
test('malformed storage and storage failure recover',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('unrelated','keep');localStorage.setItem('genome.workspace.v1','{bad');});await page.reload();await page.locator('.column-heading').first().click();await expect(page.locator('.palette-column')).toHaveCount(10);expect(await page.evaluate(()=>localStorage.getItem('unrelated'))).toBe('keep');
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new Error('quota');};});await page.reload();await page.locator('.column-heading').first().click();await expect(page.getByRole('alert').filter({hasText:'Browser storage'})).toBeVisible();await apply(page,'#abc');await expect(page.getByLabel('Base HEX',{exact:true})).toHaveValue('#AABBCC');
});
test('no page overflow or automated accessibility violations',async({page})=>{
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('button',{name:'Show JSON'}).click();
 if(await page.getByRole('radio',{name:'Export without these colors',exact:true}).isVisible())await page.getByRole('radio',{name:'Export without these colors',exact:true}).click();expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);expect(errors).toEqual([]);
});

test('edits stay isolated; name and pin-limit validation',async({page})=>{
 const secondary=await page.locator('.palette-column').nth(1).locator('.swatch-hex').allTextContents();
 await apply(page,'#fff');expect(await page.locator('.palette-column').nth(1).locator('.swatch-hex').allTextContents()).toEqual(secondary);
 await page.getByLabel('Semantic name').fill(' ');await page.getByRole('button',{name:'Apply colors',exact:true}).click();await expect(page.getByRole('alert')).toContainText('name');
 await page.getByLabel('Semantic name').fill('primary');await apply(page,'#fff','#000000,#222222,#444444,#666666,#888888,#AAAAAA');await expect(page.getByRole('alert')).toContainText('five');
 await page.locator('.column-heading').nth(1).click();await expect(page.getByLabel('Base HEX',{exact:true})).toHaveValue('#8352C6');
});

test('progressive disclosure keeps the resting view focused on colors',async({page})=>{
 await expect(page.getByLabel('Semantic name')).toBeFocused();await page.getByRole('button',{name:'Close editor'}).click();await expect(page.locator('.column-heading').first()).toBeFocused();
 await expect(page.getByLabel('Base HEX',{exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Contrast background HEX')).toHaveCount(0);
 await expect(page.locator('.swatch-ratio')).toHaveCount(0);
 await expect(page.getByRole('main',{name:'Palette help'})).toHaveCount(0);
 await page.getByRole('link',{name:'Help',exact:true}).click();
 await expect(page.getByRole('main',{name:'Palette help'})).toBeVisible();
 await page.getByRole('link',{name:'← Back to palette',exact:true}).click();
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();
 await expect(page.getByLabel('Contrast background HEX')).toBeVisible();
 await page.getByRole('button',{name:'Hide contrast',exact:true}).click();
 await expect(page.locator('.swatch-ratio')).toHaveCount(0);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('family editor stays under its trigger and comparison bar sticks on scroll',async({page})=>{
 await page.getByRole('button',{name:'Close editor'}).click();
 const family=page.locator('.palette-column').nth(1);const trigger=family.locator('.column-heading');
 await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','true');
 await expect(family.locator('aside')).toBeVisible();
 const header=await trigger.boundingBox();const editor=await family.locator('aside').boundingBox();expect(editor!.y).toBeGreaterThan(header!.y);
 await trigger.click();await expect(trigger).toHaveAttribute('aria-expanded','false');await expect(family.locator('aside')).toHaveCount(0);
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();
 await page.evaluate(()=>window.scrollTo(0,600));
 await expect(page.getByLabel('Contrast background HEX')).toBeVisible();
 const bar=await page.locator('.comparison-bar').boundingBox();expect(bar!.y).toBeGreaterThanOrEqual(0);expect(bar!.y).toBeLessThan(5);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});

test('copy feedback stays in the clicked cell and expires without opening contrast',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 const swatch=page.locator('.swatch').first();await swatch.click();await expect(swatch).toContainText('Copied');
 await expect(page.locator('.comparison-bar')).toHaveCount(0);
 await expect(swatch).not.toContainText('Copied',{timeout:4000});
});
test('background picker and threshold change the comparison results',async({page})=>{
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();
 await page.getByLabel('Choose contrast background').fill('#000000');
 await expect(page.getByLabel('Contrast background HEX')).toHaveValue('#000000');
 await page.getByLabel('Contrast background HEX').fill('#FFFFFF');
 await expect(page.getByLabel('Choose contrast background')).toHaveValue('#ffffff');
 const swatch=page.locator('.palette-column').first().locator('.swatch').filter({hasText:'#0071B2'});
 await page.getByLabel('Contrast target').selectOption('4.5');await expect(swatch).toHaveAttribute('aria-label',/passes target/);
 await page.getByLabel('Contrast target').selectOption('7');await expect(swatch).toHaveAttribute('aria-label',/below target/);
});

test('contrast uses visual filtering without ratios or copy checkmarks',async({page})=>{
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();
 await expect(page.locator('.comparison-selection')).toHaveCount(0);
 await expect(page.locator('.swatch-ratio')).toHaveCount(0);
 const base=page.locator('.palette-column').first().locator('.swatch').filter({hasText:'#0071B2'});
 await expect(base).not.toHaveClass(/contrast-below/);
 await page.getByLabel('Contrast target').selectOption('7');await expect(base).toHaveClass(/contrast-below/);
 await page.getByRole('button',{name:'Hide contrast',exact:true}).click();await expect(page.locator('.contrast-below')).toHaveCount(0);
 const row=page.locator('.swatches').first();expect(await row.evaluate(el=>getComputedStyle(el).scrollbarWidth)).toBe('none');
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('0');
 expect(await row.evaluate(el=>{el.scrollLeft=200;return el.scrollLeft})).toBeGreaterThan(0);
});

test('contextual contrast help supports focus, tap, Escape and outside dismissal',async({page})=>{
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();
 const help=page.getByRole('button',{name:'About contrast requirements'});
 await expect(page.getByRole('tooltip')).toHaveCount(0);
 await help.focus();await expect(page.getByRole('tooltip')).toContainText('24 CSS px');
 await expect(page.getByRole('tooltip')).toContainText('not text inside buttons');
 await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);
 await help.click();await expect(page.getByRole('tooltip')).toBeVisible();
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('heading',{name:'Palette',exact:true}).click();await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('both help panels stay anchored to their question buttons',async({page})=>{
 for(const name of ['About editing colors','About contrast requirements']){
 if(name==='About contrast requirements')await page.getByRole('button',{name:'Show contrast',exact:true}).click();
 const trigger=page.getByRole('button',{name,exact:true});await trigger.click();
 const tip=page.getByRole('tooltip');await expect(tip).toBeVisible();
 const a=(await trigger.boundingBox())!,b=(await tip.boundingBox())!;
 expect(b.x).toBeLessThanOrEqual(a.x+a.width);expect(b.x+b.width).toBeGreaterThanOrEqual(a.x);
 expect(Math.min(Math.abs(b.y-(a.y+a.height)),Math.abs(a.y-(b.y+b.height)))).toBeLessThanOrEqual(12);
 if(name==='About editing colors')await expect(tip).toContainText('discards unapplied changes');
 await page.keyboard.press('Escape');await expect(tip).toHaveCount(0);
 }
});

test('export copies the exact downloadable JSON after reviewing omitted inputs',async({page,context})=>{
 await context.grantPermissions(['clipboard-read','clipboard-write']);
 await page.getByRole('button',{name:'Show JSON'}).click();
 if(await page.getByRole('radio',{name:'Export without these colors',exact:true}).isVisible())await page.getByRole('radio',{name:'Export without these colors',exact:true}).click();
 const preview=page.getByLabel('Palette JSON');await expect(preview).toBeVisible();
 const json=(await preview.textContent())!;
 await page.getByRole('button',{name:'Copy JSON',exact:true}).click();
 await expect(page.getByRole('button',{name:'Copied',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe(json);
 const event=page.waitForEvent('download');await page.getByRole('button',{name:'Download JSON'}).click();
 expect(await fs.readFile((await (await event).path())!,'utf8')).toBe(json);
 await page.getByLabel('Export format').selectOption('genome');await page.getByRole('button',{name:'About exporting colors'}).click();await expect(page.getByRole('tooltip')).toContainText('22 lightness slots');
 await page.keyboard.press('Escape');await expect(page.getByRole('tooltip')).toHaveCount(0);
});

test('export clipboard failure selects the JSON for manual copying',async({page})=>{
 await page.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>Promise.reject(new Error('Denied'))}});});
 await page.getByRole('button',{name:'Show JSON'}).click();
 if(await page.getByRole('radio',{name:'Export without these colors',exact:true}).isVisible())await page.getByRole('radio',{name:'Export without these colors',exact:true}).click();
 await page.getByRole('button',{name:'Copy JSON',exact:true}).click();
 await expect(page.getByText('Copy unavailable. The JSON is selected; copy it manually or download the file.')).toBeVisible();
 expect(await page.evaluate(()=>window.getSelection()?.toString())).toBe(await page.getByLabel('Palette JSON').textContent());
});

test('preset provenance is explicit and saved v1 workspaces preserve their mapping',async({page})=>{
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('6');
 await expect(page.getByRole('dialog',{name:'About this scale'})).toHaveCount(0);
 await page.getByRole('button',{name:'About this scale'}).click();
 await expect(page.getByRole('dialog',{name:'About this scale'})).toContainText('not Material 3');
 const before=await page.locator('.palette-column').first().locator('.swatch-hex').allTextContents();
 await page.reload();await expect(page.getByRole('combobox',{name:'Scale mapping',exact:true})).toHaveValue('6');
 expect(await page.locator('.palette-column').first().locator('.swatch-hex').allTextContents()).toEqual(before);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('genome.workspace.v1')!).presetRevision)).toBe('genome-v1');
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('2');
 await expect(page.getByRole('dialog',{name:'About this scale'})).toHaveCount(0);
 await page.getByRole('button',{name:'About this scale'}).click();
 await expect(page.getByRole('dialog',{name:'About this scale'})).toContainText('Approximate mapping');
 await page.keyboard.press('Escape');
 await expect(page.getByRole('dialog',{name:'About this scale'})).toHaveCount(0);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('an unsupported saved preset version is not overwritten',async({page})=>{
 const original=await page.evaluate(()=>{const state=JSON.parse(localStorage.getItem('genome.workspace.v1')!);state.presetRevision='future-v99';const raw=JSON.stringify(state);localStorage.setItem('genome.workspace.v1',raw);return raw;});
 await page.reload();await expect(page.getByRole('alert')).toContainText('saved data is protected');
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('3');
 expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(original);
});

test('guide examples explain mappings without changing saved colors or editor drafts',async({page})=>{
 await page.getByLabel('Semantic name').fill('unapplied draft');
 const saved=await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'));
 await page.getByRole('link',{name:'Guide',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Build a palette from your brand colors'})).toBeFocused();
 await expect(page.getByRole('heading',{name:'Palette',exact:true})).toBeHidden();
 const example=page.locator('.guide-example');
 await expect(example).toContainText('Starting color #0071B2');
 const before=await example.locator('.example-swatches button').allTextContents();
 await page.getByRole('button',{name:'Ember',exact:true}).click();
 await expect(example).toContainText('Starting color #F57C13');
 expect(await example.locator('.example-swatches button').allTextContents()).not.toEqual(before);
 await example.getByRole('combobox',{name:'Scale mapping'}).selectOption('2');
 await expect(example).toContainText('button.background → primary.60');
 await example.getByRole('button',{name:/Preview primary 10,/}).click();
 await expect(example.getByRole('status')).toContainText('below');
 expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('link',{name:'← Back to palette',exact:true}).click();
 await expect(page.getByLabel('Semantic name')).toHaveValue('unapplied draft');
 await expect(page.getByRole('link',{name:'Guide',exact:true})).toBeFocused();
 await page.goBack();await expect(page.getByRole('heading',{name:'Build a palette from your brand colors'})).toBeVisible();
});

test('guide supports direct chapter links and returning to the workspace',async({page})=>{
 await page.goto('/#guide-scale');
 await expect(page.getByRole('heading',{name:'Choose a scale'})).toBeVisible();
 await page.getByRole('link',{name:'03 Use colors',exact:true}).click();await expect(page).toHaveURL(/#guide-apply$/);
 await page.reload();await expect(page.getByRole('heading',{name:'Use the colors in your design'})).toBeVisible();
 await page.getByRole('link',{name:'Return to your palette →',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Palette',exact:true})).toBeVisible();
});

test('reset requires confirmation and restores only the workspace',async({page})=>{
 await apply(page,'#123456','#EEEEEE');await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('6');
 await page.evaluate(()=>localStorage.setItem('unrelated','keep'));
 await page.getByLabel('Semantic name').fill('Unapplied draft');
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();await page.getByLabel('Contrast background HEX').fill('#000000');
 await page.getByRole('link',{name:'Help',exact:true}).click();await page.getByRole('link',{name:'Saving',exact:true}).click();
 const saved=await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'));
 await page.getByRole('button',{name:'Reset workspace',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Reset your workspace?'});
 await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();
 await expect(page.getByLabel('Semantic name')).toHaveValue('Unapplied draft');
 expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
 await page.getByRole('button',{name:'Reset workspace',exact:true}).click();await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
 await page.getByRole('button',{name:'Reset workspace',exact:true}).click();await dialog.getByRole('button',{name:'Reset workspace',exact:true}).click();
 await expect(dialog).toBeHidden();await expect(page.getByRole('status').filter({hasText:'Workspace reset'})).toBeVisible();await page.getByRole('link',{name:'← Back to palette',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Scale mapping',exact:true})).toHaveValue('1');
 await expect(page.getByLabel('Semantic name')).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Show contrast',exact:true})).toBeVisible();
 const result=await page.evaluate(()=>({saved:JSON.parse(localStorage.getItem('genome.workspace.v1')!),unrelated:localStorage.getItem('unrelated')}));
 expect(result.unrelated).toBe('keep');expect(result.saved.columns[0]).toEqual({id:'A',name:'primary',seed:'#0071B2',pins:[]});expect(result.saved.columns.every((c:any)=>c.pins.length===0)).toBe(true);
 await page.reload();await page.locator('.column-heading').first().click();await expect(page.getByLabel('Base HEX',{exact:true})).toHaveValue('#0071B2');
 await page.getByRole('button',{name:'Show contrast',exact:true}).click();await expect(page.getByLabel('Contrast background HEX')).toHaveValue('#FFFFFF');await expect(page.getByLabel('Contrast target')).toHaveValue('4.5');
});

test('failed reset preserves the current workspace',async({page})=>{
 await apply(page,'#123456');
 const saved=await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'));
 await page.getByRole('link',{name:'Help',exact:true}).click();await page.getByRole('link',{name:'Saving',exact:true}).click();
 await page.getByRole('button',{name:'Reset workspace',exact:true}).click();
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw Error('quota');};});
 const dialog=page.getByRole('dialog',{name:'Reset your workspace?'});await dialog.getByRole('button',{name:'Reset workspace',exact:true}).click();
 await expect(dialog.getByRole('alert')).toContainText('Nothing was reset');
 expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
 await dialog.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Base HEX',{exact:true})).toHaveValue('#123456');
});

test('custom shades remove, add, rename, persist and export exactly the visible scale',async({page})=>{
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();
 await page.getByRole('button',{name:'Start with 100–950'}).click();
 await page.getByRole('button',{name:'Apply shades',exact:true}).click();
 const before=await page.locator('.palette-column').first().locator('.swatch-hex').allTextContents();
 await expect(page.locator('.palette-column').first().locator('.swatch')).toHaveCount(10);
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();
 await page.getByRole('button',{name:'Remove shade 200',exact:true}).click();
 await page.getByLabel('Shade 1 name',{exact:true}).fill('surface');
 await page.getByRole('button',{name:'Apply shades',exact:true}).click();
 const after=await page.locator('.palette-column').first().locator('.swatch-hex').allTextContents();
 expect(after).toEqual(before.filter((_,i)=>i!==1));
 await expect(page.locator('.palette-column').nth(5).locator('.swatch-top')).not.toContainText(['L85']);
 await page.reload();await expect(page.locator('.palette-column').first().locator('.swatch')).toHaveCount(9);
 await page.getByRole('button',{name:'Show JSON'}).click();
 if(await page.getByRole('radio',{name:'Export without these colors',exact:true}).isVisible())await page.getByRole('radio',{name:'Export without these colors',exact:true}).click();
 const json=JSON.parse((await page.getByLabel('Palette JSON').textContent())!);
 for(let i=0;i<10;i++)expect(json.columns[i].shades.map((s:any)=>s.hex)).toEqual(await page.locator('.palette-column').nth(i).locator('.swatch-hex').allTextContents());
 expect(json.columns[0].shades[0].name).toBe('surface');
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();
 await page.getByRole('button',{name:'+ Add shade',exact:true}).click();

 await page.getByRole('button',{name:'Apply shades',exact:true}).click();
 await expect(page.locator('.palette-column').first().locator('.swatch')).toHaveCount(10);
});
test('shade editor validates duplicate names, cancels drafts and remains accessible',async({page})=>{
 const before=await page.locator('.swatch-hex').allTextContents();
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();
 await page.getByRole('button',{name:'Start with 100–950'}).click();
 await page.getByLabel('Shade 1 name',{exact:true}).fill('200');
 await page.getByRole('button',{name:'Apply shades',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'different name'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const selector=await page.getByRole('combobox',{name:'Scale mapping',exact:true}).boundingBox();expect(selector!.width).toBeGreaterThan(100);
 await page.getByRole('button',{name:'Adjust lightness',exact:true}).click();
 await page.getByLabel('Lightness for shade 950').selectOption('0');
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await page.locator('.swatch-hex').allTextContents()).toEqual(before);
});
test('custom mapping survives comparison with a preset and reset removes it',async({page})=>{
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();await page.getByRole('button',{name:'Start with 100–950'}).click();await page.getByRole('button',{name:'Apply shades',exact:true}).click();
 const original=await page.locator('.swatch-hex').allTextContents();
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('2');await page.reload();
 await page.getByRole('combobox',{name:'Scale mapping',exact:true}).selectOption('custom');expect(await page.locator('.swatch-hex').allTextContents()).toEqual(original);
 await page.getByRole('link',{name:'Help',exact:true}).click();await page.getByRole('link',{name:'Saving',exact:true}).click();await page.getByRole('button',{name:'Reset workspace',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Reset workspace',exact:true}).click();
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('genome.workspace.v1')!).customScale)).toBeUndefined();
});
test('reset shade edits restores the last applied custom scale without saving or closing',async({page})=>{
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();await page.getByRole('button',{name:'Start with 100–950'}).click();await page.getByLabel('Shade 1 name',{exact:true}).fill('surface');await page.getByRole('button',{name:'Apply shades',exact:true}).click();
 const saved=await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'));
 const colors=await page.locator('.swatch-hex').allTextContents();
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();await expect(page.getByRole('button',{name:'Reset edits',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Remove shade 200',exact:true}).click();await page.getByLabel('Shade 1 name',{exact:true}).fill('200');await page.getByRole('button',{name:'Start with 100–950'}).click();
 await page.getByRole('button',{name:'Reset edits',exact:true}).click();
 await expect(page.getByRole('form',{name:'Edit shades',exact:true})).toBeVisible();await expect(page.getByLabel('Shade 1 name',{exact:true})).toHaveValue('surface');await expect(page.locator('.shade-step')).toHaveCount(10);await expect(page.getByRole('button',{name:'Reset edits',exact:true})).toBeDisabled();
 expect(await page.locator('.swatch-hex').allTextContents()).toEqual(colors);expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
});
test('shade guide demonstrates lightness without changing workspace or shade draft',async({page})=>{
 await page.getByRole('button',{name:'Edit shades',exact:true}).click();await page.getByLabel('Shade 1 name',{exact:true}).fill('draft');
 const saved=await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'));
 await page.getByRole('button',{name:'About custom shades'}).click();await page.getByRole('link',{name:'Read the shade-editing guide'}).click();
 await expect(page).toHaveURL(/#guide-shades$/);await expect(page.getByRole('heading',{name:'Edit your shades'})).toBeInViewport();
 const example=page.locator('.guide-lightness-swatch');const before=await example.textContent();await page.getByLabel('Example lightness').selectOption('45');await expect(example).toContainText('primary.500');expect(await example.textContent()).not.toBe(before);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('link',{name:'Back to palette'}).click();await expect(page.getByLabel('Shade 1 name',{exact:true})).toHaveValue('draft');expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
});

 test('help shares guide navigation and preserves the editing session',async({page},testInfo)=>{
  await page.getByLabel('Semantic name').fill('Draft family');
  const saved=await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'));
  await page.getByRole('link',{name:'Help',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Using Genome',exact:true})).toBeFocused();
  await expect(page.locator('#main')).toBeHidden();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
  await page.screenshot({path:`/tmp/genome-help-${testInfo.project.name}.png`});
  await page.getByRole('link',{name:'Saving',exact:true}).click();
  await expect(page).toHaveURL(/#help-saving$/);
  await page.getByRole('link',{name:'Guide',exact:true}).click();
  await page.goBack();await expect(page.getByRole('heading',{name:'Saving your work',exact:true})).toBeInViewport();
  await page.getByRole('link',{name:'← Back to palette',exact:true}).click();
  await expect(page.getByLabel('Semantic name')).toHaveValue('Draft family');
  expect(await page.evaluate(()=>localStorage.getItem('genome.workspace.v1'))).toBe(saved);
  await page.goto('/#help-export');await page.reload();
  await expect(page.getByRole('heading',{name:'What does the export include?',exact:true})).toBeInViewport();
 });
