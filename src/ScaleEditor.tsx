import {useRef,useState} from 'react';
import ContrastHelp from './ContrastHelp';
import {availableTargets, CustomScale, presetSteps, ScaleStep, starterScale, suggestStep, validateSteps} from './scale';

export default function ScaleEditor({preset,custom,onApply,onClose}:{preset:number;custom?:CustomScale;onApply:(scale:CustomScale)=>void;onClose:()=>void}){
 const [steps,setSteps]=useState<ScaleStep[]>(()=>custom?.steps.map(s=>({...s}))??presetSteps(preset));
 const appliedSteps=()=>custom?.steps.map(s=>({...s}))??presetSteps(preset);
 const dirty=JSON.stringify(steps)!==JSON.stringify(appliedSteps());
 const [resetMessage,setResetMessage]=useState('');
 const [error,setError]=useState('');
 const root=useRef<HTMLFormElement>(null);
 function focusName(index:number){requestAnimationFrame(()=>root.current?.querySelector<HTMLInputElement>(`[aria-label="Shade ${index+1} name"]`)?.focus());}
 const [advanced,setAdvanced]=useState(false);
 const unused=availableTargets.filter(t=>!steps.some(s=>s.target===t));
 function update(index:number,patch:Partial<ScaleStep>){setSteps(s=>s.map((v,i)=>i===index?{...v,...patch}:v));setError('');setResetMessage('');}
 return <form ref={root} id="shade-editor" className="shade-editor" aria-label="Edit shades" onSubmit={e=>{e.preventDefault();const failure=validateSteps(steps);if(failure){setError(failure);return;}onApply({steps:[...steps].sort((a,b)=>b.target-a.target)});}}>
  <div className="shade-editor-heading"><div><h2>Edit shades <span className="muted">{steps.length} steps</span></h2><p>Add, remove or rename shades across every family. Apply when you’re ready.</p></div><button type="button" onClick={()=>{setSteps(starterScale());setError('');setResetMessage('');}}>Start with 100–950</button></div>
  <div className="shade-step-list">{steps.map((step,i)=><div className="shade-step" key={step.target}>
   <input aria-label={`Shade ${i+1} name`} value={step.label} maxLength={24} onChange={e=>update(i,{label:e.target.value})}/>
   <button type="button" className="shade-remove" aria-label={`Remove shade ${step.label}`} disabled={steps.length<=2} onClick={()=>{setSteps(s=>s.filter((_,j)=>j!==i));setError('');focusName(Math.min(i,steps.length-2));}}>×</button>
   {advanced&&<label>Lightness<select aria-label={`Lightness for shade ${step.label}`} value={step.target} onChange={e=>{update(i,{target:Number(e.target.value)});focusName(i);}}>{availableTargets.map(t=><option key={t} value={t} disabled={t!==step.target&&steps.some(s=>s.target===t)}>{t}</option>)}</select></label>}
  </div>)}</div>
  <div className="shade-editor-bottom"><div className="shade-add"><button type="button" disabled={!unused.length} onClick={()=>{const next=suggestStep(steps);if(next)setSteps(s=>[...s,next].sort((a,b)=>b.target-a.target));setError('');setResetMessage('');}}>+ Add shade</button><button type="button" aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}>{advanced?'Hide lightness':'Adjust lightness'}</button><ContrastHelp label="About custom shades" content={<><h3>Editing shades</h3><p>Give each shade a unique name, such as 100 or 950. Add shade selects an unused slot. Use Adjust lightness to choose a different one: higher values select lighter positions. Applied shades are ordered from light to dark.</p><p>Your selection applies across every family. Base and pinned colors retain their exact HEX values in the full palette. If they are missing from your selected shades, the export panel lets you include them as additional named colors or explicitly leave them out.</p><p>Reset edits restores the last applied scale and keeps the editor open. Cancel discards the draft and closes it. Start with 100–950 replaces the draft with ten shades.</p><p>Removing a shade leaves the remaining colors unchanged. Original Genome JSON exports the full 22-slot palette, regardless of your selection.</p><p><a href="#guide-shades">Read the shade-editing guide →</a></p></>}/></div><div className="shade-editor-actions"><button type="button" disabled={!dirty} onClick={()=>{setSteps(appliedSteps());setError('');setResetMessage('Edits reset to your last applied scale.');}}>Reset edits</button><button type="button" onClick={onClose}>Cancel</button><button type="submit" className="primary">Apply shades</button></div></div>
  <span className="sr-only" role="status">{resetMessage}</span>
  {error&&<p className="error" role="alert">{error}</p>}
 </form>;
}
