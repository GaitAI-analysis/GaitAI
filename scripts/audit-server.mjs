import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
export const outRoot=path.resolve(process.env.GAITAI_AUDIT_OUT || 'tmp/verification-build/out');
export const walk=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
export const routeFiles=()=>walk(outRoot).filter(f=>f.endsWith('index.html')).map(file=>({file,route:'/'+path.relative(outRoot,file).replaceAll('\\','/').replace(/index.html$/,'')}));
export async function serve(){
 const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end();return;}
  let target=path.resolve(outRoot,'.'+pathname);
  if(target!==outRoot&&!target.startsWith(outRoot+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404);res.end();return;}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.wasm':'application/wasm','.woff2':'font/woff2','.txt':'text/plain'};
  res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');
  const stat=fs.statSync(target);res.setHeader('Content-Length',stat.size);fs.createReadStream(target).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {server,base:`http://127.0.0.1:${server.address().port}`};
}
