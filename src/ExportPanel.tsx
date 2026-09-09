import {useEffect,useMemo,useRef,useState} from 'react';
import ContrastHelp from './ContrastHelp';
import {MissingInput} from './scale';

export default function ExportPanel({json:selectionJson,includedJson,missing,onDownload,filename,format,onFormat}:{json:string;includedJson:string;missing:MissingInput[];onDownload:(json:string)=>void;filename:string;format:string;onFormat:(value:string)=>void}) {
  const [decision,setDecision]=useState<'include'|'omit'|null>(null);
  const needsChoice=missing.length>0&&decision===null;
  const json=decision==='include'?includedJson:selectionJson;
  const [status,setStatus]=useState('');
  const timer=useRef<ReturnType<typeof setTimeout>>();
  const preview=useRef<HTMLPreElement>(null);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  useEffect(()=>{setStatus('');clearTimeout(timer.current);},[json]);
  const highlighted=useMemo(()=>json.split(/("(?:\\.|[^"\\])*"\s*:|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g).map((part,i)=>{
    const kind=part.startsWith('"')?(part.trimEnd().endsWith(':')?'key':'string'):/^(true|false|null|-?\d)/.test(part)?'value':undefined;
    return kind?<span className={`json-${kind}`} key={i}>{part}</span>:part;
  }),[json]);
  async function copy(){
    if(needsChoice)return;
    clearTimeout(timer.current);
    try {await navigator.clipboard.writeText(json);setStatus('Copied');timer.current=setTimeout(()=>setStatus(''),1800);}
    catch {setStatus('Copy unavailable. The JSON is selected; copy it manually or download the file.');preview.current?.focus();const selection=window.getSelection();const range=document.createRange();if(preview.current&&selection){range.selectNodeContents(preview.current);selection.removeAllRanges();selection.addRange(range);}}
  }
  return <section id="json-preview" className="export-panel" aria-label="JSON preview">
    <div className="export-heading"><div className="export-title"><h2>JSON preview</h2>{format==='genome'&&<ContrastHelp exporting/>}</div><p>{format==='genome'?'Complete matrix · 22 slots per family for the original importer':decision==='include'?'Selected shades plus additional base and pinned colors':'Selected shades only · names and HEX values for every family'}</p><label className="export-format">Format<select aria-label="Export format" value={format} onChange={e=>onFormat(e.target.value)}><option value="scale">Selected scale JSON</option><option value="genome">Original Genome JSON</option></select></label></div>
    <p>{format==='scale'?'This file cannot restore your workspace and has not been verified for Figma or DTCG import.':'Includes all 22 slots per family, including exact base and pinned colors. This file cannot restore your workspace. The complete Figma import workflow remains unverified for this version.'}</p>
    {missing.length>0&&<div className="export-input-check" aria-label="Base and pinned colors">
      <h3>{decision==='include'?'Additional colors included':'Colors outside your selected scale'}</h3>
      <p>These base or pinned colors are missing from the selected shades. Include them as additional named colors in this export, or export only the selected shades. Your palette and shade selection stay unchanged.</p>
      <ul>{missing.map((input,i)=><li key={i}>{input.family} · {input.name} · {input.hex}</li>)}</ul>
      <fieldset className="export-input-options"><legend>Choose what to export</legend><label><input type="radio" name="export-inputs" value="include" checked={decision==='include'} onChange={()=>setDecision('include')}/>Include these colors</label><label><input type="radio" name="export-inputs" value="omit" checked={decision==='omit'} onChange={()=>setDecision('omit')}/>Export without these colors</label></fieldset>
      {decision&&<p role="status">{decision==='include'?'The preview includes the additional colors listed above.':'You chose to omit the listed colors from this export.'}</p>}
    </div>}
    <div className="export-actions"><button disabled={needsChoice} onClick={copy}>{status==='Copied'?'Copied':'Copy JSON'}</button><button className="primary" disabled={needsChoice} onClick={()=>{if(!needsChoice)onDownload(json);}}>Download JSON</button></div>
    {!needsChoice&&<div className="export-code"><div className="export-filename">{filename}</div><pre ref={preview} tabIndex={0} aria-label="Palette JSON"><code>{highlighted}</code></pre></div>}
    <p className={status.startsWith('Copy unavailable')?'error':'sr-only'} role="status">{status}</p>
  </section>;
}
