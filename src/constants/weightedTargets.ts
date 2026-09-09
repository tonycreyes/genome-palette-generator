import mappings from './presetMappings.v1.json';
import catalog from './presetCatalog.json';

export type weightedTargetsRow = { target:number; weight:string | undefined };
export type weightedTargetsColumn = { rows:weightedTargetsRow[]; neutrals:weightedTargetsRow[] };
export const PRESET_REVISION = 'genome-v1';
export const Options = catalog;
// Immutable v1 definitions. New algorithms/mappings need a new revision and an
// explicit migration; upstream releases must never rewrite an existing palette.
export const weightedTargets = (index:number):weightedTargetsColumn => {
  const mapping=mappings[index];
  if(!mapping)throw new Error('Unknown preset');
  return {rows:mapping.rows.map(row=>({...row,weight:row.weight})),neutrals:mapping.neutrals.map(row=>({...row,weight:row.weight}))};
};
