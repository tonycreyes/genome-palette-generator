import chroma from 'chroma-js';
import {CustomScale, validateSteps} from './scale';
import Palettizer from './utilities/palettizer';
import { SwatchModel } from './models/SwatchModel';
import { weightedTargets, PRESET_REVISION } from './constants/weightedTargets';
import { l_targets } from './constants';

export type ColumnInput = { id: string; name: string; seed: string; pins: string[] };
export type Tone = SwatchModel & { weight?: string };
export const STORAGE_KEY = 'genome.workspace.v1';
export const defaults: ColumnInput[] = ['primary|0071B2','secondary|8352C6','tertiary|7B6747','positive|007C00','negative|D80000','highlight|FFCF3D','attention|F57C13','info|035EF9','system|0A66D8','neutral|6A6A6A'].map((v,i) => {
  const [name,hex] = v.split('|'); return {id:String.fromCharCode(65+i),name,seed:'#'+hex,pins:[]};
});
export function normalize(value: string): string | null {
  const hex = value.trim().replace(/^#/, '');
  if (!/^(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(hex)) return null;
  return '#' + (hex.length === 3 ? [...hex].map(c=>c+c).join('') : hex).toUpperCase();
}
export function slot(hex: string): number {
  const lightness = Number(chroma(hex).lab()[0].toFixed(2));
  return l_targets.reduce((a:number,b:number)=>Math.abs(b-lightness)<Math.abs(a-lightness)?b:a);
}
export function validateColors(seed: string, pins: string[]) {
  const seen = new Set<number>();
  for (const hex of [seed,...pins]) {
    if (!normalize(hex)) throw new Error('Use a 3- or 6-digit HEX, such as #0071B2.');
    const target = slot(hex);
    if (seen.has(target)) throw new Error(`Two colors share the L* ${target} slot. Choose colors with different lightness to preserve both.`);
    seen.add(target);
  }
}
export function generateColumn(input: ColumnInput): Tone[] {
  validateColors(input.seed,input.pins);
  const rows: Tone[] = new Palettizer(input.id,input.name,[input.seed,...input.pins]).createSwatchColumn();
  // The legacy generator can overwrite endpoint metadata and skip later pins.
  // Restore explicit inputs after interpolation, keeping generated values intact.
  [input.seed,...input.pins].forEach((hex,index)=>{
    const explicit = new SwatchModel(hex,input.id,input.name);
    explicit.id=input.id+explicit.row;
    explicit.isUserDefined=index===0;
    explicit.isPinned=index>0;
    explicit.isNeutral=chroma(hex).lch()[1]<=12;
    rows[explicit.row]=explicit;
  });
  return rows;
}
export function displayTones(tones: Tone[], preset: number): Tone[] {
  const definitions = weightedTargets(preset);
  const isNeutral = tones.find(s=>s.isUserDefined)?.isNeutral;
  const targets = (isNeutral && definitions.neutrals.length ? definitions.neutrals : definitions.rows).filter(t=>t.weight !== undefined).slice().reverse();
  const rows = targets.map(t => ({...tones.find(s=>s.l_target===t.target)!,weight:t.weight}));
  // A preset must not relabel a pin as another lightness step or drop it.
  // Extra inputs keep their own L* slot and are inserted in tonal order.
  for (const tone of tones.filter(s=>s.isUserDefined || s.isPinned)) {
    if (!rows.some(s=>s.id===tone.id)) rows.push({...tone,weight:`L${tone.l_target}`});
  }
  return rows.sort((a,b)=>b.lightness-a.lightness);
}
// Full lightness matrix, in canonical row order, for optimization at import time.
export function exportGrid(columns: ColumnInput[]) {
  return {columns:columns.map(c=>({semantic:c.name,rows:generateColumn(c)}))};
}
export function parseSaved(raw: string | null): {columns:ColumnInput[];preset:number;presetRevision:string;customScale?:CustomScale;customScaleActive?:boolean} | null {
  if (!raw) return null;
  try {
    const value=JSON.parse(raw);
    if(value.presetRevision !== undefined && value.presetRevision !== PRESET_REVISION)return null;
    if (!Array.isArray(value.columns) || value.columns.length!==defaults.length || !Number.isInteger(value.preset) || value.preset<0 || value.preset>8) return null;
    const columns=value.columns.map((c:ColumnInput,i:number)=>{
      if (typeof c.name!=='string' || !c.name.trim() || c.name.length>40 || !Array.isArray(c.pins) || c.pins.length>5 || typeof c.seed!=='string' || !c.pins.every(p=>typeof p==='string')) throw Error();
      const seed=normalize(c.seed); const pins=c.pins.map(normalize);
      if (!seed || pins.some(p=>!p)) throw Error();
      validateColors(seed,pins as string[]);
      return {...c,id:defaults[i].id,name:c.name.trim(),seed,pins:pins as string[]};
    });
    if(value.customScale!==undefined && (!value.customScale || validateSteps(value.customScale.steps)))return null;
    return {columns,preset:value.preset,presetRevision:PRESET_REVISION,...(value.customScale?{customScale:value.customScale,customScaleActive:value.customScaleActive!==false}:{})};
  } catch {return null;}
}
export const contrast = (a: string,b: string) => chroma.contrast(a,b);
