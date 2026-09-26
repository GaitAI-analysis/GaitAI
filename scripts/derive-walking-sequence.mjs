/** Offline asset preparation, never shipped as client JS. Uses the site's
 * pinned pose model on each actual recorded input frame, including its mask. */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const { chromium }=require('../tmp/qa/node_modules/playwright');
const root=process.cwd();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Local sequence extraction</title>');return;}
 const rel=url.pathname.startsWith('/vendor/')?'node_modules/@mediapipe/tasks-vision/'+url.pathname.slice(8):'public/'+url.pathname;
 const target=path.resolve(root,rel);
 if(!target.startsWith(root+path.sep)||!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.wasm':'application/wasm','.webp':'image/webp'})[path.extname(target)]||'application/octet-stream');
 fs.createReadStream(target).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true, executablePath:process.env.QA_CHROMIUM});
try {
 const page=await browser.newPage();
 page.on('console',m=>{if(m.type()==='error')console.log(m.text().slice(0,200));});
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 const frames=await page.evaluate(async()=>{
  const {FilesetResolver,PoseLandmarker}=await import('/vendor/vision_bundle.mjs');
  const vision=await FilesetResolver.forVisionTasks('/vendor/wasm');
  const detector=await PoseLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:'/assets/models/pose_landmarker_lite.task',delegate:'CPU'},runningMode:'IMAGE',numPoses:1,outputSegmentationMasks:true});
  const frames=[];
  for(let i=0;i<5;i++){
   const source=`/assets/images/capture/sequence/frame-${i+1}.webp`;
   const img=new Image();img.src=source;await img.decode();
   let frame;
   detector.detect(img,result=>{
    if(result.landmarks.length!==1||!result.segmentationMasks?.length)throw new Error(`No pose/mask at frame ${i+1}`);
    const mask=result.segmentationMasks[0];const values=mask.getAsFloat32Array();
    const canvas=document.createElement('canvas');canvas.width=mask.width;canvas.height=mask.height;
    const ctx=canvas.getContext('2d');const pixels=ctx.createImageData(mask.width,mask.height);
    values.forEach((p,j)=>{pixels.data[j*4]=pixels.data[j*4+1]=pixels.data[j*4+2]=255;pixels.data[j*4+3]=p>0.5?255:0;});ctx.putImageData(pixels,0,0);
    frame={source,width:img.naturalWidth,height:img.naturalHeight,landmarks:result.landmarks[0].map(p=>({x:+p.x.toFixed(5),y:+p.y.toFixed(5),visibility:+p.visibility.toFixed(4)})),maskData:canvas.toDataURL('image/png')};
   });
   frames.push(frame);
  }
  detector.close();return frames;
 });
 const data=frames.map((frame,i)=>{
  const {maskData,...record}=frame;
  const mask=`/assets/images/capture/sequence/mask-${i+1}.png`;
  fs.writeFileSync(path.join('public',mask),Buffer.from(maskData.split(',')[1],'base64'));
  return {...record,mask,timestampSeconds:+(8.4+i*.16).toFixed(2),crop:{x:800+i*200,y:0,width:1600,height:2160},moment:['Heel contact','Stance / toe-off','Swing','Late swing','Next contact'][i]};
 });
 fs.writeFileSync('src/data/generated/walking-sequence.json',JSON.stringify({provenance:'Recorded stock demonstration: SHVETS production, Pexels video 9731860, https://www.pexels.com/video/a-man-walking-inside-the-studio-9731860/ under https://www.pexels.com/license/. Fixed-size tracked crops from one continuous sequence, timestamps in the source recording. No product endorsement or validation evidence. Landmarks and segmentation extracted from these exact frames with MediaPipe PoseLandmarker 1.0.1 and the repository pose_landmarker_lite.task. Phase names are illustrative annotations, not validated gait-event detection. This short excerpt does not establish cadence, symmetry or any clinical or safety result.',frames:data},null,2)+'\n');
 console.log(`Derived ${data.length} frame-aligned poses and segmentation masks.`);
} finally {await browser.close();server.close();}
