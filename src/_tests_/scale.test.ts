import {it,expect} from 'vitest';
import {starterScale,scaleTones,exportScale,validateSteps} from '../scale';
import {defaults,generateColumn,parseSaved,exportGrid} from '../workspace';
it('removing and renaming shades changes only the selection, including omitted exact yellow',()=>{
 const input=defaults[5], tones=generateColumn(input), steps=starterScale();
 const full=scaleTones(tones,1,{steps});
 const removed=steps.filter(s=>s.target!==85).map(s=>s.target===95?{...s,label:'surface'}:s);
 const result=scaleTones(tones,1,{steps:removed});
 expect(result).toHaveLength(9);expect(result.some(t=>t.hex===input.seed)).toBe(false);
 for(const t of result)expect(t.hex).toBe(full.find(f=>f.l_target===t.l_target)!.hex);
 expect(result[0].weight).toBe('surface');expect(generateColumn(input)).toEqual(tones);
 expect(exportScale([input],1,{steps:removed}).columns[0].shades).toEqual(result.map(t=>({name:t.weight,hex:t.hex})));
 expect(exportGrid([input]).columns[0].rows.find(t=>t.isUserDefined)?.hex).toBe(input.seed);
});
it('rejects ambiguous or invalid custom scales and round trips a valid scale',()=>{
 const steps=starterScale();
 expect(validateSteps(steps)).toBeNull();expect(validateSteps([steps[0]])).toBeTruthy();
 expect(validateSteps([...steps,{target:0,label:'100'}])).toBeTruthy();
 expect(validateSteps([...steps,{target:95,label:'extra'}])).toBeTruthy();
 expect(validateSteps([{target:43,label:'foo'},steps[0]])).toBeTruthy();
 const raw={columns:defaults,preset:1,customScale:{steps}};
 expect(parseSaved(JSON.stringify(raw))?.customScale).toEqual({steps});
 expect(parseSaved(JSON.stringify({...raw,customScale:{steps:[null]}}))).toBeNull();
});
it('adds unique available slots until the grid is full',async()=>{
 const {suggestStep}=await import('../scale');let steps=starterScale();
 while(steps.length<22){const next=suggestStep(steps)!;steps=[...steps,next];expect(validateSteps(steps)).toBeNull();}
 expect(suggestStep(steps)).toBeNull();
});
