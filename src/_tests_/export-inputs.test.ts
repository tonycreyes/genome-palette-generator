import {it,expect} from 'vitest';
import {exportScale,missingScaleInputs} from '../scale';
import {defaults,generateColumn} from '../workspace';
it('includes omitted base and pins without changing selected shades, names or inputs',()=>{
 const column={...defaults[0],pins:['#FFFFFF','#000000']};
 const custom={steps:[{target:95,label:'BASE'},{target:5,label:'pin-1'}]};
 const before=JSON.stringify({column,custom});
 const selected=exportScale([column],1,custom).columns[0].shades;
 const missing=missingScaleInputs([column],1,custom);
 expect(missing.map(x=>x.hex)).toEqual([column.seed,...column.pins]);
 const included=exportScale([column],1,custom,true).columns[0].shades;
 expect(included.slice(0,2)).toEqual(selected);
 expect(included.slice(2).map(x=>x.name)).toEqual(['base-2','pin-1-2','pin-2']);
 expect(new Set(included.map(x=>x.name.toLowerCase())).size).toBe(included.length);
 expect(JSON.stringify({column,custom})).toBe(before);
});
it('does not duplicate colors already present, across all mappings including neutrals',()=>{
 for(let preset=0;preset<9;preset++)for(const column of defaults){
 const selected=exportScale([column],preset).columns[0].shades;
 const missing=missingScaleInputs([column],preset);
 expect(missing.length).toBe(selected.some(s=>s.hex===column.seed)?0:1);
 const included=exportScale([column],preset,undefined,true).columns[0].shades;
 expect(included.some(s=>s.hex===column.seed)).toBe(true);
 expect(included.slice(0,selected.length)).toEqual(selected);
 }
 const column=defaults[0];
 const custom={steps:generateColumn(column).map(t=>({target:t.l_target,label:`L${t.l_target}`.replace('.','_')}))};
 expect(missingScaleInputs([column],1,custom)).toEqual([]);
 expect(exportScale([column],1,custom,true)).toEqual(exportScale([column],1,custom));
});
