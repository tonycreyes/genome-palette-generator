import {useEffect,useLayoutEffect,useId,useRef,useState, type ReactNode} from 'react';

export default function ContrastHelp({editor=false,exporting=false,content,label,trigger,triggerClassName}:{editor?:boolean;exporting?:boolean;content?:ReactNode;label?:string;trigger?:ReactNode;triggerClassName?:string}){
  const id=useId();
  const popup=useRef<HTMLDivElement>(null);
  const [position,setPosition]=useState({left:0,top:0,maxHeight:600});
  const [open,setOpen]=useState(false);
  const root=useRef<HTMLDivElement>(null);
  const closeTimer=useRef<ReturnType<typeof setTimeout>>();
  const show=()=>{clearTimeout(closeTimer.current);setOpen(true);};
  useLayoutEffect(()=>{
    if(!open)return;
    const place=()=>{
      const anchor=root.current?.getBoundingClientRect(), tip=popup.current?.getBoundingClientRect();
      if(!anchor||!tip)return;
      const left=Math.max(12,Math.min(anchor.left,window.innerWidth-tip.width-12));
      const belowSpace=window.innerHeight-anchor.bottom-20;
      const aboveSpace=anchor.top-20;
      const height=popup.current!.scrollHeight+2;
      const below=height<=belowSpace||belowSpace>=aboveSpace;
      const maxHeight=Math.max(60,below?belowSpace:aboveSpace);
      const top=below?anchor.bottom+8:Math.max(12,anchor.top-Math.min(height,maxHeight)-8);
      setPosition({left,top,maxHeight});
    };
    place();window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
    return ()=>{window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);};
  },[open]);
  useEffect(()=>{
    const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false);};
    document.addEventListener('pointerdown',outside);
    document.addEventListener('keydown',escape);
    return ()=>{clearTimeout(closeTimer.current);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[]);
  return <div ref={root} className="contrast-help" onMouseEnter={show} onMouseLeave={()=>{closeTimer.current=setTimeout(()=>{if(!root.current?.contains(document.activeElement))setOpen(false);},150);}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setOpen(false);}}>
    <button type="button" className={triggerClassName??'help-trigger'} aria-label={label??(exporting?'About exporting colors':editor?'About editing colors':'About contrast requirements')} aria-expanded={open} aria-describedby={!content&&open?id:undefined} aria-controls={content&&open?id:undefined} aria-haspopup={content?'dialog':undefined} onFocus={show} onClick={show}>{trigger??'?'}</button>
    {open&&<div id={id} ref={popup} style={position} role={content?'dialog':'tooltip'} aria-label={content?label:undefined} tabIndex={0} className="contrast-tooltip" onMouseEnter={show}>
      {content??(exporting?<><strong>What’s included?</strong><p>The JSON contains all 22 lightness slots for every color family, including your exact base and pinned inputs and the generated shades.</p><p>Changing the preview preset or contrast filter does not change this export. The complete Figma workflow has not been verified for this version.</p><small>Copy JSON and Download JSON contain the same palette data. Escape or tap outside to close.</small></>:editor?<><strong>Editing a color family</strong><dl>
        <dt>Semantic name</dt><dd>Name the family, for example primary or positive. Exports use this name.</dd>
        <dt>Base HEX</dt><dd>Enter your starting color or use the picker. Its exact HEX is preserved; supporting shades are generated around it.</dd>
        <dt>Pinned colors</dt><dd>Add up to five exact colors, separated by commas. Each needs a different lightness slot; a conflict shows an error.</dd>
        <dt>Apply colors</dt><dd>Saves this family in this browser. Closing the editor or switching families discards unapplied changes.</dd>
      </dl><small>Escape or tap outside to close.</small></>:<><strong>Which requirement should I use?</strong>
      <dl>
        <dt>Normal text · 4.5:1</dt><dd>For body text, labels and other smaller text. WCAG AA.</dd>
        <dt>Large text / UI · 3:1</dt><dd>Large text is at least 24 CSS px regular or about 18.7 CSS px bold. Also applies to essential icons and control boundaries against adjacent colors—not text inside buttons.</dd>
        <dt>Higher contrast text · 7:1</dt><dd>A stricter target for normal text, meeting WCAG AAA contrast. AAA large text needs 4.5:1.</dd>
      </dl>
      <p>Shades below the selected contrast ratio appear faded. This does not change their HEX values or remove them from exports. Check each foreground and background pair in your design.</p>
      <small>WCAG 2.2 contrast guidance · Escape or tap outside to close.</small></>)}
    </div>}
  </div>;
}
