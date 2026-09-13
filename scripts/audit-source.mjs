import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import ts from 'typescript';

const walk = (root) => fs.existsSync(root) ? fs.readdirSync(root, {withFileTypes:true}).flatMap(e => e.isDirectory() ? walk(path.join(root,e.name)) : [path.join(root,e.name)]) : [];
const inventories = {counts:[], claims:[], privacy:[], visuals:[], ctas:[], anchors:[]};
const rules = {
 counts: /\b(?:\d+\+?|one|two|eight|nine|eleven|twelve|seventeen|eighteen|twenty[- ](?:three|four))\s+(?:(?:surfaced|modular|product|research|evidence|granted|peer-reviewed|academic|founder|invited|conference)\s+)*(?:products?|modules?|environments?|papers?|publications?|patents?|records?|talks?|presentations?|capabilities|areas?|years?)\b/i,
 claims: /\b(?:validat\w*|diagnos\w*|proven|predict\w*|production|deployed|deployment|clinical.grade|shipped|at the heart|readiness|underwriting|eligibility|premium|personnel decisions)\b/i,
 privacy: /\b(?:identity.free|anonym\w*|privacy|without invasive|non-identifying|appearance.reduced)\b/i,
 visuals: /\b(?:human view|camera view|camera video|raw video|captured frame|original frame|RGB|CCTV|video frame|walking video|silhouette|pose|skeleton|trajectory|sensor|IMU)\b/i,
 ctas: /\b(?:request|discuss|explore|book|contact|collaborat\w*|talk to|get in touch|start a|schedule|demo|pilot)\b/i,
};
for (const file of walk('src').filter(f=>/\.(tsx?|css)$/.test(f))) {
 const source=fs.readFileSync(file,'utf8');
 if(file.endsWith('.css')) {
  source.split('\n').forEach((line,i)=>{if(/scroll-(?:margin|padding)|header-clearance|site-header-height/.test(line)) inventories.anchors.push({file:file.replaceAll('\\','/'),line:i+1,text:line.trim()});});
  continue;
 }
 const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const visit=node=>{
  if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateExpression(node)||ts.isJsxText(node)) {
   const text=(ts.isTemplateExpression(node)?node.getText(ast):node.text).replace(/\s+/g,' ').trim();
   if(text) for(const [kind,rule] of Object.entries(rules)) if(rule.test(text)) inventories[kind].push({file:file.replaceAll('\\','/'),line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,text});
  }
  if(ts.isJsxAttribute(node)&&['id','href'].includes(node.name.getText(ast)) && node.initializer?.getText(ast).includes('#')) inventories.anchors.push({file:file.replaceAll('\\','/'),line:ast.getLineAndCharacterOfPosition(node.getStart(ast)).line+1,text:node.getText(ast)});
  ts.forEachChild(node,visit);
 };
 visit(ast);
}
const out=process.env.GAITAI_AUDIT_OUT || 'out';
const routePayloads=walk(out).filter(f=>f.endsWith('index.html')).map(file=>{
 const html=fs.readFileSync(file,'utf8');
 const scripts=[...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]))];
 let bytes=0,gzipBytes=0;
 for(const src of scripts){const target=path.join(out,src.split('?')[0]);if(fs.existsSync(target)){const b=fs.readFileSync(target);bytes+=b.length;gzipBytes+=zlib.gzipSync(b).length;}}
 return {route:'/'+path.relative(out,file).replaceAll('\\','/').replace(/index.html$/,''),jsBytes:bytes,jsGzipBytes:gzipBytes,scripts};
});
const stage=process.argv.includes('--baseline')?'baseline':'current';
const dir=`docs/audit/${stage}`;
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(`${dir}/source-inventories.json`,JSON.stringify(inventories,null,2)+'\n');
fs.writeFileSync(`${dir}/route-payloads.json`,JSON.stringify(routePayloads,null,2)+'\n');
console.log(stage,Object.fromEntries(Object.entries(inventories).map(([k,v])=>[k,v.length])),`${routePayloads.length} exported routes`);
