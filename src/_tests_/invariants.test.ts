import {it,expect} from 'vitest';
import {generateColumn,displayTones,slot} from '../workspace';
const seeds=['#000000','#FFFFFF','#0071B2','#FF0000','#00FF00','#0000FF','#808080','#FFFF00'];
let random=1729;for(let i=0;i<32;i++){random=(Math.imul(random,1664525)+1013904223)>>>0;seeds.push('#'+(random&0xffffff).toString(16).padStart(6,'0').toUpperCase())}
for(const seed of seeds)for(const candidates of [[],['#003355'],['#FFFFFF','#000000'],['#110022','#553377','#AA77CC','#EECCFF','#888888']]){
 const used=new Set([slot(seed)]);const pins=candidates.filter(p=>{const k=slot(p);if(used.has(k))return false;used.add(k);return true});
 it(`${seed} with ${pins.length} pins preserves inputs across nine presets`,()=>{
 const all=generateColumn({id:'A',name:'audit',seed,pins});
 for(let preset=0;preset<9;preset++){
 const rows=displayTones(all,preset);
 for(const hex of [seed,...pins])expect(rows.some(r=>r.hex===hex),`preset ${preset} missing ${hex}`).toBe(true);
 expect(rows.every(r=>/^#[A-F\d]{6}$/i.test(r.hex??''))).toBe(true);
 expect(new Set(rows.map(r=>r.id)).size).toBe(rows.length);
 expect(rows.every((r,i)=>i===0||r.lightness<=rows[i-1].lightness+.1),`preset ${preset} order`).toBe(true);
 } });
}
