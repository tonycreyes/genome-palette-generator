import {useId,useRef,useState} from 'react';

export default function ResetWorkspace({onReset}:{onReset:()=>string|null}){
 const dialog=useRef<HTMLDialogElement>(null);
 const title=useId(),description=useId();
 const [error,setError]=useState(''),[complete,setComplete]=useState(false);
 return <div className="reset-workspace">
  <button onClick={()=>{setError('');setComplete(false);dialog.current?.showModal();}}>Reset workspace</button>
  {complete&&<p role="status">Workspace reset to the starter colors and Genome scale.</p>}
  <dialog ref={dialog} className="reset-dialog" aria-labelledby={title} aria-describedby={description}>
   <form onSubmit={e=>{e.preventDefault();const failure=onReset();if(failure){setError(failure);return;}dialog.current?.close();setComplete(true);}}>
    <h2 id={title}>Reset your workspace?</h2>
    <p id={description}>This replaces your colors and family names with the starter palette, removes all pins and unapplied edits, and selects Genome. Contrast settings return to their defaults.</p>
    <p>Your saved workspace in this browser will be replaced. This cannot be undone. Other browser data and downloaded files are unaffected.</p>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="reset-actions"><button type="button" autoFocus onClick={()=>dialog.current?.close()}>Cancel</button><button className="reset-confirm" type="submit">Reset workspace</button></div>
   </form>
  </dialog>
 </div>;
}
