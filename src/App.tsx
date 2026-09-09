import ScaleEditor from './ScaleEditor';
import {exportScale, missingScaleInputs, scaleTones} from './scale';
import { useEffect, useMemo, useRef, useState } from 'react';
import ContrastHelp from './ContrastHelp';
import ExportPanel from './ExportPanel';
import PresetInfo from './PresetInfo';
import PaletteHelp from './PaletteHelp';
import Guide from './Guide';
import { Options, PRESET_REVISION } from './constants/weightedTargets';
import { ColumnInput, STORAGE_KEY, contrast, defaults, exportGrid, generateColumn, normalize, parseSaved, validateColors } from './workspace';

function initial() {
  try { return parseSaved(localStorage.getItem(STORAGE_KEY)) ?? { columns: defaults, preset: 1, presetRevision: PRESET_REVISION }; }
  catch { return { columns: defaults, preset: 1, presetRevision: PRESET_REVISION }; }
}
function Editor({ column, onSave }: {column: ColumnInput; onSave: (c:ColumnInput)=>void}) {
  const [name,setName]=useState(column.name), [seed,setSeed]=useState(column.seed), [pins,setPins]=useState(column.pins.join(', ')), [error,setError]=useState('');
  return <form className="editor" onSubmit={e=>{e.preventDefault(); try {
    const normalized=normalize(seed); const colors=pins.trim()?pins.split(',').map(s=>normalize(s)):[];
    if(!normalized || colors.some(s=>!s)) throw Error('Enter a valid 3- or 6-digit HEX for each color.');
    if(!name.trim()) throw Error('Give this column a name.');
    if(colors.length>5) throw Error('Use up to five pinned colors.');
    validateColors(normalized,colors as string[]); onSave({...column,name:name.trim(),seed:normalized,pins:colors as string[]}); setSeed(normalized); setError('');
  } catch(err) {setError((err as Error).message);} }}>
    <div className="editor-field"><label htmlFor="semantic">Semantic name</label><input id="semantic" maxLength={40} value={name} onChange={e=>setName(e.target.value)}/></div>
    <div className="editor-field"><label htmlFor="seed">Base HEX</label><div className="color-input"><input type="color" aria-label="Choose base color" value={normalize(seed)??column.seed} onChange={e=>setSeed(e.target.value.toUpperCase())}/><input id="seed" value={seed} onChange={e=>setSeed(e.target.value)} spellCheck={false} aria-describedby="edit-help edit-error"/></div></div>
    <div className="editor-field pins-field"><div className="field-label"><label htmlFor="pins">Pinned colors <span className="muted">Optional</span></label><ContrastHelp editor/></div><input id="pins" value={pins} onChange={e=>setPins(e.target.value)} placeholder="#003355, #D6ECFF" spellCheck={false} aria-describedby="edit-help edit-error"/></div>
    <div className="editor-actions"><button className="primary" type="submit">Apply colors</button></div>
    <p id="edit-help" className="help">Separate pins with commas. Your HEX values stay exact.</p>
    <p id="edit-error" className="error" role="alert">{error}</p>
  </form>;
}
export default function App() {
  const currentView=()=>window.location.hash.startsWith('#guide')?'guide':window.location.hash.startsWith('#help')?'help':'main';
  const [view,setView]=useState(currentView);
  const guide=view==='guide', help=view==='help';
  const workspaceScroll=useRef(0);
  const previousView=useRef(view);
  useEffect(()=>{
    const navigate=()=>{
      const next=currentView(), previous=previousView.current;
      if(next!=='main'&&previous==='main')workspaceScroll.current=window.scrollY;
      previousView.current=next;setView(next);
      requestAnimationFrame(()=>{
        if(next!=='main'){
          const target=document.getElementById(window.location.hash.slice(1));
          if(window.location.hash===`#${next}`){window.scrollTo(0,0);document.querySelector<HTMLElement>(`#${next} h1`)?.focus({preventScroll:true});}
          else target?.scrollIntoView();
        }else if(previous!=='main'){
          window.scrollTo(0,workspaceScroll.current);
          document.querySelector<HTMLElement>(`.header-${previous}`)?.focus({preventScroll:true});
        }
      });
    };
    window.addEventListener('hashchange',navigate);
    if(previousView.current!=='main')navigate();
    return ()=>window.removeEventListener('hashchange',navigate);
  },[]);
  const [state,setState]=useState(initial); const {columns,preset}=state;
  const savedCustom="customScale" in state?state.customScale:undefined;
  const customScale=("customScaleActive" in state&&state.customScaleActive===false)?undefined:savedCustom;
  const [shadesOpen,setShadesOpen]=useState(false);
  const [exportFormat,setExportFormat]=useState('scale');
  const [editing,setEditing]=useState<string|null>(null), [background,setBackground]=useState('#FFFFFF'), [threshold,setThreshold]=useState(4.5);
  const [selected,setSelected]=useState('#0071B2'), [status,setStatus]=useState(''), [storageError,setStorageError]=useState(''), [exporting,setExporting]=useState(false);
  const [comparing,setComparing]=useState(false);
  useEffect(()=>{if(editing)document.getElementById('semantic')?.focus();},[editing]);
  const copySequence=useRef(0);
  const [copiedCell,setCopiedCell]=useState<string|null>(null);
  const copyTimer=useRef<ReturnType<typeof setTimeout>>();
  useEffect(()=>()=>clearTimeout(copyTimer.current),[]);
  const palettes=useMemo(()=>columns.map(c=>scaleTones(generateColumn(c),preset,customScale)),[columns,preset,customScale]);
  const against=normalize(background);
  useEffect(()=>{ try {const saved=localStorage.getItem(STORAGE_KEY);let revision;try{revision=JSON.parse(saved??'null')?.presetRevision;}catch{}if(revision!==undefined&&revision!==PRESET_REVISION){setStorageError('Saved workspace uses an unsupported preset version. Your saved data is protected; this session will not overwrite it.');return;}localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setStorageError('');} catch {setStorageError('Browser storage is unavailable. Export your palette to keep a copy.');} },[state]);
  async function copy(hex:string, cell:string) {const sequence=++copySequence.current;setSelected(hex);setCopiedCell(null);clearTimeout(copyTimer.current);try {await navigator.clipboard.writeText(hex);if(sequence===copySequence.current){setStatus(`Copied ${hex}`);setCopiedCell(cell);copyTimer.current=setTimeout(()=>{setCopiedCell(null);setStatus('');},1600);}} catch {if(sequence===copySequence.current)setStatus('Copy unavailable. Select the HEX below and copy it manually.');}}
  function resetWorkspace():string|null {
    const next={columns:defaults.map(c=>({...c,pins:[]})),preset:1,presetRevision:PRESET_REVISION};
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify(next));}
    catch {return 'Could not replace the saved workspace. Nothing was reset. Check browser storage permissions and try again.';}
    ++copySequence.current;clearTimeout(copyTimer.current);setCopiedCell(null);setStatus('');setSelected('#0071B2');
    setEditing(null);setShadesOpen(false);setExportFormat('scale');setExporting(false);setComparing(false);setBackground('#FFFFFF');setThreshold(4.5);setStorageError('');setState(next);
    return null;
  }
  const exportJson=JSON.stringify(exportFormat==='genome'?exportGrid(columns):exportScale(columns,preset,customScale),null,2);
  const exportFilename=exportFormat==='genome'?'genome-gcs.json':'genome-scale.json';
  function download(json:string) { const blob=new Blob([json],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=exportFilename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000); }
  return <><header className="app-header"><a className="wordmark" href="#main"><span className="wordmark-text">genome</span><span className="brand-dot"/></a><span className="header-note">Build color scales around your brand colors</span><a className="header-guide" href="#guide" aria-current={guide?'page':undefined}>Guide</a><a className="header-help" href="#help" aria-current={help?'page':undefined}>Help</a></header>
    <Guide hidden={!guide}/><PaletteHelp hidden={!help} onReset={resetWorkspace}/><main id="main" hidden={view!=='main'}><div className="toolbar"><h1>Palette</h1><div className="scale-control"><label className="preset">Scale mapping<select aria-describedby={customScale?undefined:"scale-mapping-explanation"} value={customScale?'custom':preset} onChange={e=>{if(e.target.value==='custom'){setState(s=>({...s,customScaleActive:true}));}else{setState(s=>({...s,preset:Number(e.target.value),customScaleActive:false}));}setShadesOpen(false);}}>{savedCustom&&<option value="custom">Custom · {savedCustom.steps.length} shades</option>}{['native','approximate','legacy'].map(status=><optgroup key={status} label={status==='native'?'Genome scales · v1':status==='approximate'?'Approximate mappings · v1':'Legacy mappings · v1'}>{Options.filter(o=>o.status===status).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</optgroup>)}</select></label>{!customScale&&<PresetInfo preset={preset}/>}</div><button id="edit-shades-trigger" aria-controls="shade-editor" aria-expanded={shadesOpen} onClick={()=>setShadesOpen(!shadesOpen)}>{shadesOpen?'Hide shade editor':'Edit shades'}</button><button aria-pressed={comparing} onClick={()=>setComparing(!comparing)}>{comparing?'Hide contrast':'Show contrast'}</button><button onClick={()=>setExporting(!exporting)} aria-expanded={exporting} aria-controls="json-preview">{exporting?'Hide JSON':'Show JSON'}</button></div>
    {shadesOpen&&<ScaleEditor preset={preset} custom={customScale} onClose={()=>{setShadesOpen(false);document.getElementById("edit-shades-trigger")?.focus();}} onApply={customScale=>{setState(s=>({...s,customScale,customScaleActive:true}));setShadesOpen(false);setStatus('Custom shades applied');document.getElementById('edit-shades-trigger')?.focus();}}/>}
    {storageError&&<p role="alert" className="notice">{storageError}</p>}
    {exporting&&<ExportPanel key={JSON.stringify({columns,preset,customScale,exportFormat})} missing={exportFormat==='scale'?missingScaleInputs(columns,preset,customScale):[]} includedJson={JSON.stringify(exportScale(columns,preset,customScale,true),null,2)} json={exportJson} filename={exportFilename} format={exportFormat} onFormat={setExportFormat} onDownload={download}/>}
    <div className="workbench">
    <section className="palette-workspace" aria-label="Palette workspace">{comparing&&<div className="comparison-bar">
        {comparing&&<div className="comparison-settings"><span className="contrast-prompt">Show colors that work on</span><label className="background-control"><span className="sr-only">Background</span><input type="color" aria-label="Choose contrast background" value={against??'#FFFFFF'} onChange={e=>setBackground(e.target.value.toUpperCase())}/><input aria-label="Contrast background HEX" value={background} onChange={e=>setBackground(e.target.value)} aria-invalid={!against} spellCheck={false}/></label><label>For<select aria-label="Contrast target" value={threshold} onChange={e=>setThreshold(Number(e.target.value))}><option value={3}>Large text / UI</option><option value={4.5}>Normal text</option><option value={7}>Higher contrast text</option></select></label><ContrastHelp/></div>}
        {comparing&&!against&&<p className="error" role="alert">Enter a valid background HEX to compare contrast.</p>}
      </div>}
      <span role="status" className="sr-only">{status}</span>
      {status.startsWith('Copy unavailable')&&<div className="copy-fallback"><span>Copy unavailable. Select and copy:</span><input aria-label="Manual copy HEX" readOnly value={selected} onFocus={e=>e.target.select()}/></div>}
      <div className="palette-scroll" tabIndex={0} role="region" aria-label="Color families"><div className="palette-grid">{columns.map((c,i)=><section className="palette-column" key={c.id}><div className="family-heading"><button className={`column-heading ${editing===c.id?'active':''}`} aria-expanded={editing===c.id} aria-controls={`editor-${c.id}`} onClick={()=>setEditing(editing===c.id?null:c.id)}><span>{c.name}</span><small>{c.seed} <span className="disclosure-icon" aria-hidden="true"></span></small></button>{editing===c.id&&<button className="editor-close" type="button" aria-label="Close editor" title="Close editor" onClick={()=>{document.querySelectorAll<HTMLButtonElement>('.column-heading')[i]?.focus();setEditing(null);}}>×</button>}</div>{editing===c.id&&<aside id={`editor-${c.id}`} aria-label={`Edit ${c.name}`}><Editor key={editing} column={c} onSave={column=>{setState(s=>({...s,columns:s.columns.map(c=>c.id===column.id?column:c)}));setStatus(`${column.name} updated`);}}/></aside>}<div className="swatches">{palettes[i].map(t=>{const ratio=comparing&&against?contrast(t.hex,against):null;const ink=contrast(t.hex,'#FFFFFF')>=contrast(t.hex,'#000000')?'#FFFFFF':'#000000';return <button key={t.id} className={`swatch ${ratio!==null&&ratio<threshold?'contrast-below':''}`} style={{background:ratio!==null&&ratio<threshold?`color-mix(in srgb, ${t.hex} 20%, #f7f7f6)`:t.hex,color:ratio!==null&&ratio<threshold?'#252729':ink}} onClick={()=>copy(t.hex,`${c.id}-${t.id}`)} aria-label={`Copy ${c.name} ${t.weight}, ${t.hex}${ratio!==null?`, contrast ${ratio.toFixed(2)} to 1, ${ratio>=threshold?'passes':'below'} target`:''}`}><span className="swatch-top"><b>{t.weight}</b><span>{copiedCell===`${c.id}-${t.id}`?'Copied':t.isUserDefined?'Base':t.isPinned?'Pin':''}</span></span><span className="swatch-hex">{t.hex}</span></button>})}</div></section>)}</div></div>
    </section></div>
    <footer><span>Built on <a href="https://github.com/caoimghgin/genome-palette-generator" target="_blank" rel="noreferrer">Genome by caoimghgin</a></span><span>Click a swatch to copy · Select a name to edit</span></footer></main></>;
}
