import sequence from "@/data/generated/walking-sequence.json";
import { assetPath } from "@/lib/paths";

export const sequenceFrames = sequence.frames;
export const SEQUENCE_PROVENANCE = sequence.provenance;
export const SEQUENCE_CAPTION = "Recorded demo sequence · SHVETS production / Pexels. Pose and segmentation are extracted from these same frames; phase labels are illustrative. No clinical or safety conclusion, product endorsement or validation result is shown.";
export const POSE_CONNECTIONS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[29,31],[28,30],[30,32]] as const;
const JOINTS = [0,11,12,13,14,15,16,23,24,25,26,27,28,29,30,31,32];

/** Landmark in the exact aspect-preserving box used by SequenceFrame. */
export function sequencePoint(index:number, joint:number, box:{x:number;y:number;width:number;height:number}): [number,number] {
  const frame=sequenceFrames[index];
  const scale=Math.min(box.width/frame.width,box.height/frame.height);
  const width=frame.width*scale,height=frame.height*scale;
  return [box.x+(box.width-width)/2+frame.landmarks[joint].x*width,box.y+(box.height-height)/2+frame.landmarks[joint].y*height];
}

/** Every representation uses the same source coordinates. Parent SVG supplies
 * its accessible description. This is precomputed model output, not live AI. */
export function SequenceFrame({index=0,x,y,width,height,view="source",overlay=false}:{
  index?:number;x:number;y:number;width:number;height:number;
  view?:"source"|"mask"|"pose"|"keypoints";overlay?:boolean;
}) {
  const frame=sequenceFrames[Math.max(0,Math.min(sequenceFrames.length-1,index))];
  const scale=Math.min(width/frame.width,height/frame.height);
  const w=frame.width*scale,h=frame.height*scale;
  const left=x+(width-w)/2,top=y+(height-h)/2;
  const at=(i:number)=>({x:left+frame.landmarks[i].x*w,y:top+frame.landmarks[i].y*h});
  return <g data-sequence-frame={index} data-representation={view}>
    {(view==="source"||overlay)&&<image href={assetPath(frame.source)} x={left} y={top} width={w} height={h} opacity={overlay&&view!=="source"?.25:1}/>}
    {view==="mask"&&<image href={assetPath(frame.mask)} x={left} y={top} width={w} height={h}/>}
    {(view==="pose"||view==="keypoints")&&<g fill="currentColor" stroke="currentColor" strokeWidth={Math.max(1,w/90)}>
      {view==="pose"&&POSE_CONNECTIONS.map(([a,b])=><line key={`${a}-${b}`} x1={at(a).x} y1={at(a).y} x2={at(b).x} y2={at(b).y} opacity={Math.min(frame.landmarks[a].visibility,frame.landmarks[b].visibility)<.5?.4:.85}/>)}
      {JOINTS.map(i=><circle key={i} cx={at(i).x} cy={at(i).y} r={Math.max(1.3,w/60)} stroke="none"/>)}
    </g>}
  </g>;
}

export const SEQUENCE_SOURCE_URL = "https://www.pexels.com/video/a-man-walking-inside-the-studio-9731860/";
