import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

export function compareSource(expected,actual){
  return JSON.stringify(expected)===JSON.stringify(actual)?'unchanged':'review-needed';
}
export async function readSource(source,fetcher=fetch){
  const response=await fetcher(source.url,{headers:{Accept:'application/json','User-Agent':'genome-preset-audit'},signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`HTTP ${response.status}`);
  if(source.kind==='npm'){
    const data=await response.json();
    if(typeof data.version!=='string'||typeof data.dist?.integrity!=='string')throw new Error('Missing package version or integrity');
    return {version:data.version,integrity:data.dist.integrity};
  }
  if(source.kind==='github'){
    const data=await response.json();
    if(!/^[a-f0-9]{40}$/.test(data[0]?.sha??''))throw new Error('Missing repository revision');
    return {commit:data[0].sha};
  }
  const html=await response.text();
  // Track the published explanatory text, excluding scripts, styles and controls.
  const content=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(content.length<200)throw new Error('Source page is empty or unreadable');
  return {textSha256:createHash('sha256').update(content).digest('hex')};
}
export async function checkSources(manifest,fetcher=fetch){
  return Promise.all(manifest.sources.map(async source=>{
    try{const actual=await readSource(source,fetcher);return {id:source.id,status:compareSource(source.baseline,actual),expected:source.baseline,actual};}
    catch(error){return {id:source.id,status:'unavailable',error:error.message};}
  }));
}
async function main(){
  const manifest=JSON.parse(await readFile(new URL('../evidence/presets/sources.json',import.meta.url),'utf8'));
  const results=await checkSources(manifest);
  const report={checkedAt:new Date().toISOString(),meaning:'Source drift is a review signal, not proof of palette changes or compatibility.',results};
  const output=process.argv.indexOf('--report');
  if(output!==-1){if(!process.argv[output+1])throw Error('Missing report path');await writeFile(process.argv[output+1],JSON.stringify(report,null,2)+'\n');}
  for(const result of results)console.log(`${result.id}: ${result.status}`);
  console.log('No mappings or baselines were modified.');
  process.exitCode=results.some(r=>r.status==='unavailable')?2:results.some(r=>r.status==='review-needed')?1:0;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
