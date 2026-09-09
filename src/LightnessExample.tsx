import {useMemo,useState} from 'react';
import {availableTargets} from './scale';
import {contrast,generateColumn} from './workspace';

export default function LightnessExample(){
 const [target,setTarget]=useState(55);
 const tones=useMemo(()=>generateColumn({id:'lightness-demo',name:'primary',seed:'#0071B2',pins:[]}),[]);
 const tone=tones.find(t=>t.l_target===target)!;
 const ink=contrast(tone.hex,'#FFFFFF')>=contrast(tone.hex,'#000000')?'#FFFFFF':'#000000';
 return <div className="guide-lightness-example">
  <div><h3>Try changing the position, not the name.</h3><p>This example keeps the name <strong>primary.500</strong>. Change its lightness slot to select a different blue.</p><label>Example lightness<select value={target} onChange={e=>setTarget(Number(e.target.value))}>{availableTargets.map(value=><option key={value} value={value}>{value}</option>)}</select></label><small>Learning example only. Your workspace stays unchanged.</small></div>
  <div className="guide-lightness-swatch" style={{background:tone.hex,color:ink}} role="status"><strong>primary.500</strong><span>{tone.hex}</span><small>Lightness slot {target}{tone.isUserDefined?' · exact base color':''}</small></div>
 </div>;
}
