import {weightedTargets} from './constants/weightedTargets';
import {ColumnInput, Tone, generateColumn} from './workspace';

export type ScaleStep = {target:number; label:string};
export type CustomScale = {steps:ScaleStep[]};
export const availableTargets = [100,97.5,95,90,85,80,75,70,65,60,55,50,45,40,35,30,25,20,15,10,5,0];
// A convenient starting structure, not an implementation of another generator.
export const starterScale = ():ScaleStep[] => [95,85,75,65,55,45,35,25,15,5].map((target,i)=>({target,label:i===9?'950':String((i+1)*100)}));
export function presetSteps(preset:number, neutral=false):ScaleStep[]{
 const definition=weightedTargets(preset);
 return (neutral&&definition.neutrals.length?definition.neutrals:definition.rows).filter(r=>r.weight!==undefined).map(r=>({target:r.target,label:r.weight!})).sort((a,b)=>b.target-a.target);
}
export function validateSteps(steps:ScaleStep[]):string|null{
 if(!Array.isArray(steps)||steps.length<2||steps.length>22)return 'Choose between 2 and 22 shades.';
 if(steps.some(s=>!s||!availableTargets.includes(s.target)||typeof s.label!=='string'||! /^[a-zA-Z0-9_-]{1,24}$/.test(s.label)))return 'Use a unique name with 1–24 letters, numbers, hyphens or underscores for each shade.';
 if(new Set(steps.map(s=>s.label.toLowerCase())).size!==steps.length)return 'Each shade needs a different name.';
 if(new Set(steps.map(s=>s.target)).size!==steps.length)return 'Each shade needs a different lightness slot.';
 return null;
}
export function scaleTones(tones:Tone[],preset:number,custom?:CustomScale):Tone[]{
 const steps=custom?.steps??presetSteps(preset,!!tones.find(t=>t.isUserDefined)?.isNeutral);
 return [...steps].sort((a,b)=>b.target-a.target).map(s=>({...tones.find(t=>t.l_target===s.target)!,weight:s.label}));
}
export type MissingInput = {family:string; name:string; hex:string};
function selectedExport(column:ColumnInput,preset:number,custom?:CustomScale){
 const shades=scaleTones(generateColumn(column),preset,custom).map(t=>({name:t.weight!,hex:t.hex}));
 const missing:MissingInput[]=[];
 const used=new Set(shades.map(s=>s.name.toLowerCase()));
 const colors=new Set(shades.map(s=>s.hex.toUpperCase()));
 const inputs=[{name:'base',hex:column.seed},...column.pins.map((hex,i)=>({name:`pin-${i+1}`,hex}))];
 for(const input of inputs){
  if(colors.has(input.hex.toUpperCase()))continue;
  let name=input.name, suffix=2;
  while(used.has(name.toLowerCase()))name=`${input.name}-${suffix++}`;
  used.add(name.toLowerCase());colors.add(input.hex.toUpperCase());
  missing.push({family:column.name,name,hex:input.hex});
 }
 return {shades,missing};
}
export function missingScaleInputs(columns:ColumnInput[],preset:number,custom?:CustomScale):MissingInput[]{
 return columns.flatMap(c=>selectedExport(c,preset,custom).missing);
}
export function exportScale(columns:ColumnInput[],preset:number,custom?:CustomScale,includeInputs=false){
 return {format:'genome-scale-v1',columns:columns.map(c=>{
  const {shades,missing}=selectedExport(c,preset,custom);
  return {name:c.name,shades:includeInputs?[...shades,...missing.map(({name,hex})=>({name,hex}))]:shades};
 })};
}

export function suggestStep(steps:ScaleStep[]):ScaleStep|null{
 const sorted=[...steps].sort((a,b)=>b.target-a.target);
 const unused=availableTargets.filter(t=>!steps.some(s=>s.target===t));
 if(!unused.length)return null;
 const interior=unused.filter(t=>t<sorted[0].target&&t>sorted[sorted.length-1].target);
 const choices=interior.length?interior:unused;
 const target=choices.reduce((best,t)=>Math.min(...steps.map(s=>Math.abs(s.target-t)))>Math.min(...steps.map(s=>Math.abs(s.target-best)))?t:best);
 const above=sorted.filter(s=>s.target>target).at(-1),below=sorted.find(s=>s.target<target);
 let label=above&&below&&/^\d+$/.test(above.label)&&/^\d+$/.test(below.label)?String(Math.round((Number(above.label)+Number(below.label))/2)):String(1000-target*10);
 if(steps.some(s=>s.label.toLowerCase()===label.toLowerCase())){let n=1;while(steps.some(s=>s.label.toLowerCase()===`shade-${n}`))n++;label=`shade-${n}`;}
 return {target,label};
}
