import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {serve,routeFiles} from './audit-server.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require('../tmp/qa/node_modules/playwright');
const {default:AxeBuilder}=require('../tmp/qa/node_modules/@axe-core/playwright');
const {server,base}=await serve();
const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROMIUM});
const dir='docs/audit/browser';fs.mkdirSync(dir,{recursive:true});
const widths=[1920,1440,1280,1024,768,430,375];
const themes=['dark','light'];
const all=routeFiles().filter(r=>!r.route.startsWith('/admin'));
const only=process.env.AUDIT_ROUTES?.split(',');
const routes=only?all.filter(r=>only.includes(r.route)):all;
const results=[];const errors=[];
try{
 for(const theme of themes){
  const context=await browser.newContext({colorScheme:theme,reducedMotion:'reduce',extraHTTPHeaders:{DNT:'1'}});
  await context.addInitScript((theme)=>{localStorage.setItem('theme',theme);},theme);
  // Test visitors must not write counters, signups or external form submissions.
  await context.route(/https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
  let idx=0;
  await Promise.all(Array.from({length:3},async()=>{
   const page=await context.newPage();let pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
   while(idx<routes.length){
    const {route}=routes[idx++];
    for(const width of widths){
     pageErrors=[];await page.setViewportSize({width,height:width<=768?900:1000});
     try{
      const response=await page.goto(base+route,{waitUntil:'networkidle',timeout:30000});
      await page.evaluate(async()=>{await document.fonts.ready;});
      // Visit lazy/reveal content before collecting whole-page semantics.
      await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,18));}window.scrollTo(0,0);});
      await page.waitForTimeout(120);
      const state=await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),overflow:document.documentElement.scrollWidth>innerWidth+1,wide:[...document.querySelectorAll('main *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left< -2||r.right>innerWidth+2)&&!e.closest('svg,[data-overflow-allowed]')}).slice(0,8).map(e=>e.tagName+'.'+String(e.className).slice(0,90)),brokenImages:[...document.images].filter(i=>i.getBoundingClientRect().width>0&&!i.naturalWidth).map(i=>i.getAttribute('src')),themeClass:document.documentElement.className}));
      let axe=[];
      if(width===1440||width===430){const scan=await new AxeBuilder({page}).exclude('[aria-hidden="true"][class*="sectionNumber"]').exclude('[aria-hidden="true"][class*="mIndex"]').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();axe=scan.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));}
      const name=(route==='/'?'home':route.replace(/^\//,'').replace(/\/$/,'').replaceAll('/','--'))+`--${width}--${theme}.png`;
      await page.screenshot({path:path.join(dir,name),fullPage:false,animations:'disabled'});
      const row={route,width,theme,status:response.status(),...state,axe,pageErrors:[...pageErrors],screenshot:name};results.push(row);
      if(state.overflow||state.brokenImages.length||axe.length||pageErrors.length)errors.push({route,width,theme,overflow:state.overflow,broken:state.brokenImages.length,axe:axe.map(v=>v.id),pageErrors});
     }catch(e){results.push({route,width,theme,error:e.message});errors.push({route,width,theme,error:e.message});}
    }
    fs.writeFileSync(`${dir}/results.partial.json`,JSON.stringify(results,null,2));
    console.log(`${theme} ${route} (${results.length} viewport checks)`);
   }
   await page.close();
  }));
  await context.close();
 }
 fs.writeFileSync(`${dir}/results.json`,JSON.stringify(results,null,2));fs.writeFileSync(`${dir}/issues.json`,JSON.stringify(errors,null,2));
 console.log(`${results.length} viewport checks; ${errors.length} cases need review.`);
}finally{await browser.close();server.close();}
