import { describe,it,expect } from 'vitest';
import fixtures from '../../evidence/original-palettes.json';
import { generateColumn,displayTones,normalize,validateColors,exportGrid,defaults,parseSaved,contrast } from '../workspace';

describe('original generation contract',()=>{
  for (const [name,fixture] of Object.entries(fixtures)) it(`preserves ${name} output`,()=>{
    const rows=generateColumn({id:'A',name:'primary',seed:fixture.seeds[0],pins:fixture.seeds.slice(1)});
    expect(rows.map(s=>s.hex)).toEqual(fixture.rows.map(s=>s.hex));
    // Metadata correction is intentional: black remains an explicit base.
    for(const hex of fixture.seeds) expect(rows.find(s=>s.hex===hex && (s.isUserDefined||s.isPinned))).toBeDefined();
  });
});
it('validates full input and prevents silent pin overwrite',()=>{
  expect(normalize('abc')).toBe('#AABBCC');
  for (const value of ['#12','xxx123456','1234567','red','']) expect(normalize(value)).toBeNull();
  expect(()=>validateColors('#0071B2',['#0071B3'])).toThrow('share');
});
it('preserves explicit colors and exports the displayed rows in all presets',()=>{
  const columns=[{...defaults[0],pins:['#003355']}];
  for(let preset=0;preset<9;preset++){
    const rows=displayTones(generateColumn(columns[0]),preset);
    expect(rows.some(s=>s.hex==='#0071B2')).toBe(true);
    expect(rows.some(s=>s.hex==='#003355')).toBe(true);
    expect(new Set(rows.map(s=>s.id)).size).toBe(rows.length);
    expect(rows.every(s=>s.weight!==undefined)).toBe(true);
    expect(exportGrid(columns).columns[0].rows).toEqual(generateColumn(columns[0]));
  }
});
it('removed pins cannot leak into exports',()=>{
  const pinned=exportGrid([{...defaults[0],pins:['#003355']}]);
  expect(pinned.columns[0].rows.some(s=>s.isPinned)).toBe(true);
  expect(exportGrid([defaults[0]]).columns[0].rows.some(s=>s.isPinned)).toBe(false);
});
it('recovers from malformed stored data',()=>{
  expect(parseSaved('{bad')).toBeNull();
  expect(parseSaved(JSON.stringify({columns:[],preset:0}))).toBeNull();
  expect(parseSaved(JSON.stringify({columns:defaults,preset:2}))?.columns).toEqual(defaults);
});
it('calculates contrast from final HEX with unrounded AA boundaries',()=>{
  expect(contrast('#000000','#FFFFFF')).toBe(21);
  expect(contrast('#777777','#FFFFFF')).toBeLessThan(4.5);
  expect(contrast('#767676','#FFFFFF')).toBeGreaterThanOrEqual(4.5);
});

it('exports canonical complete rows independently of preview optimization',()=>{
 const grid=exportGrid(defaults);
 expect(grid.columns).toHaveLength(10);
 for(const c of grid.columns){expect(c.rows).toHaveLength(22);expect(c.rows.map(r=>r.row)).toEqual(Array.from({length:22},(_,i)=>i));expect(c.rows.every(r=>r.weight===undefined)).toBe(true);}
});
it('an exact color near a contrast boundary is not corrected to match its weight',()=>{
 const input={...defaults[0],seed:'#777777'};
 const exact=generateColumn(input).find(r=>r.isUserDefined)!;
 expect(exact.hex).toBe('#777777');expect(exact.l_target).toBe(50);
 expect(displayTones(generateColumn(input),1).find(r=>r.isUserDefined)?.weight).toBe('300');
 expect(contrast(exact.hex,'#FFFFFF')).toBeLessThan(4.5);
});
