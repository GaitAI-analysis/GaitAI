import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || '../tmp/qa/node_modules/playwright');
const axePath = require.resolve(process.env.AXE_MODULE || '../tmp/qa/node_modules/axe-core/axe.min.js');
process.env.GAITAI_AUDIT_OUT = 'out';
const { serve } = await import('./audit-server.mjs');
const live = process.env.WIKI_TEST_BASE;
const { server, base } = live ? { server: { close() {} }, base: live } : await serve();
const dir = `tmp/wiki-polish/${live ? 'live' : 'after'}`;
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_CHROMIUM });
const page = await browser.newPage({ acceptDownloads: true });
const errors = [], audits = [], contrasts = [];
page.on('pageerror', e => errors.push(e.message));
let checks = 0;
const check = (value, message) => { assert(value, message); checks++; };
async function ready() {
  await page.locator('header button[aria-label^="Theme:"]').waitFor({ state: 'attached' });
  await page.evaluate(() => document.fonts.ready);
}
async function audit(label, include = '[class*="wiki_portal"]') {
  await page.addScriptTag({ path: axePath });
  const result = await page.evaluate(async selector => window.axe.run({ include: [selector] }, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21aa','wcag22aa'] } }), include);
  const record = { label, violations: result.violations.map(v => ({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})), incomplete: result.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})), passes:result.passes.length };
  audits.push(record);
  // Persist findings even when the assertion fails, to make triage reproducible.
  fs.writeFileSync(`${dir}/accessibility.json`,JSON.stringify(audits,null,2));
  check(record.violations.length === 0, `${label}: ${JSON.stringify(record.violations)}`);
}
try {
  for (const width of [1920,1440,1280,768,390]) {
    await page.setViewportSize({ width, height: width < 800 ? 900 : 1000 });
    for (const theme of ['light','dark']) {
      await page.goto(base+'/insights/wiki/');
      await page.evaluate(value=>localStorage.setItem('theme',value),theme);
      for (const slug of ['', 'gaitai-care/', 'gaitai-care/web/architecture/', 'gaitai-care/android/architecture/', 'gaitai-care/backend/data-model/']) {
        await page.goto(base+'/insights/wiki/'+slug);
        await ready();
        await page.waitForFunction(value=>document.documentElement.classList.contains(value),theme);
        check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width}/${theme}/${slug}: no horizontal overflow`);
        const small = await page.locator('[class*="wiki_portal"]').evaluate(root => [...root.querySelectorAll('a,p,small,button,input,summary,figcaption')].filter(el=>el.getClientRects().length && !el.closest('svg') && !el.className.includes?.('srOnly') && parseFloat(getComputedStyle(el).fontSize)<12).map(el=>el.textContent.slice(0,50)));
        check(small.length===0,`${width}/${theme}/${slug}: readable secondary typography (${small})`);
        if([1440,390].includes(width)) await audit(`${width}/${theme}/${slug||'directory'}`);
        if(!slug) {
          check(await page.locator('article').count()===4,'Four product collections retained');
          check(await page.locator('article').filter({hasText:'Documentation coming soon'}).locator('a,button').count()===0,'Upcoming products have no unavailable navigation');
          check(await page.locator('article').first().locator('a').count()===4,'Featured product has three platform links and the overview');
          if(width===1440) {
            const palette = await page.locator('[class*="wiki_portal"]').evaluate(root=>{
              const style=getComputedStyle(root),names=['ink','muted','gold','bg','panel','wash','accent-wash','control'];
              const rgb=hex=>{ const h=hex.trim().replace('#',''); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4); };
              const lum=hex=>rgb(hex).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
              const colors=Object.fromEntries(names.map(n=>[n,style.getPropertyValue('--w-'+n).trim()]));
              const pairs=[];
              for(const fg of ['ink','muted','gold','control']) for(const bg of ['bg','panel','wash','accent-wash']) {const a=lum(colors[fg]),b=lum(colors[bg]);pairs.push({fg,bg,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),threshold:fg==='control'?3:4.5});}
              return {colors,pairs};
            });
            contrasts.push({theme,...palette});
            for(const pair of palette.pairs) check(pair.ratio>=pair.threshold,`${theme}: ${pair.fg}/${pair.bg} contrast ${pair.ratio}`);
          }
        }
      }
      if([1440,390].includes(width)) {
        await page.goto(base+'/insights/wiki/'); await ready();
        const search=page.getByRole('searchbox',{name:'Search Wiki pages'});
        await search.focus();
        await page.getByText('Explore the documentation',{exact:true}).waitFor(); checks++;
        await page.getByRole('search').getByRole('button',{name:'Authentication',exact:true}).click();
        check((await search.inputValue())==='Authentication','Topic suggestions populate search');
        await search.fill('Android keystore');
        const first=page.locator('#wiki-search-results li a').first();
        check((await first.getAttribute('href')).includes('/android/'),'Platform-aware relevance');
        check(await first.locator('mark').count()>0,'Matching terms highlighted');
        await audit(`${width}/${theme}/search`);
        await search.press('ArrowDown'); await page.keyboard.press('Escape');
        check(await page.locator('#wiki-search-results').count()===0,'Escape from result closes panel without reopening on focus return');
        check(await search.evaluate(el=>el===document.activeElement),'Search focus returns to input');
        await search.fill('nonexistent-topic-xyz');
        await page.getByText('No matching pages',{exact:true}).waitFor(); checks++;
        await audit(`${width}/${theme}/empty-search`);
        await page.getByRole('button',{name:'Close Wiki search results'}).click();
        check(await page.locator('#wiki-search-results').count()===0,'Close actually dismisses search');

        await page.goto(base+'/insights/wiki/gaitai-care/web/architecture/'); await ready();
        if(width===390) {
          await page.getByRole('button',{name:'Documentation navigation'}).click();
          await audit(`${width}/${theme}/mobile-navigation`);
          await page.getByRole('navigation',{name:'GaitAI Care documentation',exact:true}).getByRole('link',{name:'All products',exact:true}).focus();
          await page.keyboard.press('Escape');
          check(await page.getByRole('button',{name:'Documentation navigation'}).evaluate(el=>el===document.activeElement && el.getAttribute('aria-expanded')==='false'),'Mobile sidebar Escape restores focus');
        }
        const figure=page.locator('main figure').first();
        await figure.getByRole('button',{name:'Enlarge',exact:true}).click();
        const dialog=page.locator('dialog[open]');
        await dialog.waitFor();
        await page.waitForFunction(()=>document.querySelector('dialog[open] svg[role="img"]').getBoundingClientRect().width>=1000);
        check(await dialog.locator('svg[role="img"]').evaluate(svg=>Math.abs(svg.getBoundingClientRect().width-svg.viewBox.baseVal.width)<2),'Enlarge opens at actual reading size');
        await audit(`${width}/${theme}/diagram-viewer`,'dialog[open]');
        const region=dialog.getByRole('region');
        await region.focus();
        if(width===390) {
          await page.keyboard.press('ArrowRight');
          await page.waitForFunction(()=>document.querySelector('dialog[open] [role="region"]').scrollLeft>0); checks++;
        }
        await dialog.getByRole('button',{name:'Fit',exact:true}).click();
        await page.waitForFunction(()=>{const r=document.querySelector('dialog[open] [role="region"]');return r.scrollWidth<=r.clientWidth+1;});checks++;
        await dialog.getByRole('button',{name:'Actual size, 100 percent'}).click();
        await page.waitForFunction(()=>document.querySelector('dialog[open] svg[role="img"]').getBoundingClientRect().width>=1000);
        await page.keyboard.press('Escape');
        await dialog.waitFor({state:'hidden'});
        check(await page.evaluate(()=>document.documentElement.style.overflow!== 'hidden'),'Closing viewer unlocks page scroll');
        check(await figure.getByRole('button',{name:'Enlarge',exact:true}).evaluate(el=>el===document.activeElement),'Viewer returns focus to Enlarge');
        for(const kind of ['SVG','PNG']) {
          const [download]=await Promise.all([page.waitForEvent('download'),figure.getByRole('button',{name:kind,exact:true}).click()]);
          const file=`${dir}/${width}-${download.suggestedFilename()}`; await download.saveAs(file);
          check(fs.statSync(file).size>5000,`${width}/${theme}: ${kind} download contains figure`);
          if(kind==='PNG') {
            const opaque=await page.evaluate(async data=>{
              const image=new Image();image.src=data;await image.decode();
              const canvas=document.createElement('canvas');canvas.width=1;canvas.height=1;
              const context=canvas.getContext('2d');context.drawImage(image,0,0);
              return context.getImageData(0,0,1,1).data[3]===255;
            },'data:image/png;base64,'+fs.readFileSync(file).toString('base64'));
            check(opaque,'PNG preserves the theme canvas instead of exporting an invisible background');
          }
        }
      }
    }
    console.log(`Polish/accessibility checks passed: ${width}px`);
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base+'/insights/wiki/gaitai-care/');
  await ready();
  await page.locator('[class*="areaCard"]').first().waitFor({state:'visible'});
  const duration=await page.locator('[class*="areaCard"]').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  // The shared site's reduced-motion rule uses .01ms for transition events.
  check(duration.split(',').every(value=>parseFloat(value)<=0.00002),`Reduced motion makes transitions imperceptible: ${duration}`);
  check(!errors.length,`No runtime errors: ${errors}`);
  const result={origin:base,checks,axeAudits:audits.length,axeViolations:audits.reduce((n,a)=>n+a.violations.length,0),contrasts,errors,status:'passed'};
  fs.writeFileSync(`${dir}/polish-results.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify(result,null,2));
} catch(e) { await page.screenshot({path:`${dir}/polish-failure.png`}).catch(()=>{}); throw e; }
finally { await browser.close(); server.close(); }
