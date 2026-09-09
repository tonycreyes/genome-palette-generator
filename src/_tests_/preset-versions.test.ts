import {describe,it,expect} from 'vitest';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {parseSaved,defaults,displayTones,generateColumn,exportGrid} from '../workspace';
import {PRESET_REVISION,Options} from '../constants/weightedTargets';
import {checkSources,readSource} from '../../scripts/check-preset-sources.mjs';

describe('versioned presets',()=>{
 it('migrates every old preset without changing its colors or exported data',()=>{
  for(let preset=0;preset<9;preset++){
   const old={columns:defaults,preset};const restored=parseSaved(JSON.stringify(old))!;
   expect(restored.presetRevision).toBe(PRESET_REVISION);
   expect(displayTones(generateColumn(restored.columns[0]),restored.preset)).toEqual(displayTones(generateColumn(defaults[0]),preset));
   expect(exportGrid(restored.columns)).toEqual(exportGrid(defaults));
  }
 });
 it('rejects unknown revisions instead of silently interpreting them as v1',()=>{
  expect(parseSaved(JSON.stringify({columns:defaults,preset:1,presetRevision:'genome-v99'}))).toBeNull();
 });
 it('locks v1 mappings against accidental upstream replacement',()=>{
  const mappings=readFileSync(new URL('../constants/presetMappings.v1.json',import.meta.url));
  expect(createHash('sha256').update(mappings).digest('hex')).toBe('8ffad0fe968d976dc8141edf8ab848e249cba31fba43faf823aca1db1489a3de');
 });
 it('provides provenance for every mapping without claiming external official parity',()=>{
  expect(Options).toHaveLength(9);
  for(const option of Options){expect(option.source).toMatch(/^https:\/\//);expect(option.revision).toBe(PRESET_REVISION);expect(option.auditedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);if(Number(option.value)>1)expect(['approximate','legacy']).toContain(option.status);}
 });
});

describe('source monitoring',()=>{
 const baseline={version:'1.0.0',integrity:'sha512-original'};
 const manifest={sources:[{id:'fixture',kind:'npm',url:'https://example.test/latest',baseline}]};
 it('distinguishes unchanged sources, releases, and changed content at the same version',async()=>{
  for(const [actual,status] of [[baseline,'unchanged'],[{...baseline,version:'2.0.0'},'review-needed'],[{...baseline,integrity:'sha512-changed'},'review-needed']] as const){
   const results=await checkSources(manifest,async()=>new Response(JSON.stringify({version:actual.version,dist:{integrity:actual.integrity}})));
   expect(results[0].status).toBe(status);expect(manifest.sources[0].baseline).toEqual(baseline);
  }
 });
 it('reports unavailable sources instead of treating failure as up to date',async()=>{
  expect((await checkSources(manifest,async()=>new Response('',{status:503})))[0].status).toBe('unavailable');
  expect((await checkSources(manifest,async()=>new Response('{}')))[0].status).toBe('unavailable');
 });
 it('validates repository revision responses',async()=>{
  await expect(readSource({kind:'github',url:'https://example.test'},async()=>new Response('[]'))).rejects.toThrow('Missing repository revision');
 });
});
