import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), out=path.join(root,'outputs/r1-2-history/search-regression'), url='http://127.0.0.1:5192/';
await mkdir(out,{recursive:true});
const server=spawn('python3',['-m','http.server','5192','--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
const report={suite:'R1.1B SEARCH keyboard gate',branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),results:[],overall:'BLOCKED'};
const traces=[];let browser;
const snap=page=>page.evaluate(()=>({focus:{tag:document.activeElement?.tagName,id:document.activeElement?.id},open:document.querySelector('#searchDialog')?.open,expanded:document.querySelector('#searchInput')?.getAttribute('aria-expanded'),results:[...document.querySelectorAll('#searchResults .search-result')].map((e,i)=>({index:i,title:e.querySelector('.search-result__title')?.textContent,selected:e.getAttribute('aria-selected')})),url:location.href,readerOpen:!document.querySelector('#reader')?.closest('.workspace')?.classList.contains('reader-closed')}));
const ck=(checks,name,ok,detail)=>checks.push({name,status:ok?'PASS':'FAIL',detail});
try{
if(report.branch!=='release/r1-stable-candidate')throw Error('Wrong branch');
let ready=false;for(let i=0;i<50;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await new Promise(r=>setTimeout(r,150))}if(!ready)throw Error('Server unavailable');
browser=await chromium.launch({headless:true});
for(const width of [390,900,1440]){
const page=await browser.newPage({viewport:{width,height:width===390?844:900}}),checks=[],trace=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));
const record=async(label)=>trace.push({label,...await snap(page)});
const open=async()=>{if(width===390){await page.locator('#mobileMenuButton').click();await page.locator('[data-mobile-command="search"]').click()}else await page.locator('#searchInput').click();await page.locator('#searchInput').fill('ошибка');await page.waitForTimeout(200)};
try{
await page.goto(url);if(await page.locator('#enter').isVisible())await page.locator('#enter').click();
await open();await record('search open');const initial=trace.at(-1);ck(checks,'SEARCH and five results visible',await page.locator('#searchInput').isVisible()&&await page.locator('#searchResults .search-result:visible').count()===5,initial);
await page.screenshot({path:path.join(out,`search-${width}.png`),fullPage:true});
await page.locator('#searchInput').focus();await page.keyboard.press('Shift+Tab');await record('Shift+Tab');const back=trace.at(-1);const expectedBack=width===390?'mobileMenuButton':'guideButton';ck(checks,'Shift+Tab previous focus and full close',back.focus.id===expectedBack&&back.open===false&&back.expanded==='false',back);
await page.waitForTimeout(100);await record('after Shift+Tab settle');ck(checks,'Focus stays outside SEARCH',trace.at(-1).focus.id===expectedBack,trace.at(-1));
await open();await page.locator('#searchInput').focus();await record('before arrows');const beforeArrow=trace.at(-1).results.findIndex(x=>x.selected==='true');await page.keyboard.press('ArrowDown');await record('ArrowDown');const down=trace.at(-1);ck(checks,'ArrowDown selects second result',down.results[Math.min(beforeArrow+1,down.results.length-1)]?.selected==='true'&&down.results.filter(x=>x.selected==='true').length===1,down);
await page.keyboard.press('ArrowUp');await record('ArrowUp');const up=trace.at(-1);ck(checks,'ArrowUp selects first result',up.results[beforeArrow]?.selected==='true'&&up.results.filter(x=>x.selected==='true').length===1,up);
await page.keyboard.press('ArrowDown');await record('select second for Enter');const selected=trace.at(-1).results.find(x=>x.selected==='true')?.title;await page.keyboard.press('Enter');await page.waitForTimeout(200);await record('Enter');const entered=trace.at(-1);ck(checks,'Enter opens selected Reader node',entered.readerOpen&&selected&&await page.locator('#reader').innerText().then(t=>t.includes(selected)),{selected,entered});
await open();await page.locator('#searchInput').focus();await page.keyboard.press('Tab');await record('Tab');const tab=trace.at(-1);ck(checks,'Tab next focus and full close',tab.focus.id===(width===390?'mobileMenuButton':'randomButton')&&tab.open===false&&tab.expanded==='false',tab);
await open();await page.keyboard.press('Escape');await record('Escape');const escape=trace.at(-1);ck(checks,'Escape closes SEARCH',escape.open===false&&escape.expanded==='false',escape);
ck(checks,'No JavaScript exceptions',errors.length===0,errors);
}catch(e){checks.push({name:'Execution',status:'BLOCKED',detail:String(e)})}
report.results.push({width,checks});traces.push({width,trace,errors});await page.close();
}
report.overall=report.results.every(r=>r.checks.length&&r.checks.every(c=>c.status==='PASS'))?'PASS':'FAIL';
}catch(e){report.error=String(e)}finally{await browser?.close();server.kill('SIGTERM');await writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));await writeFile(path.join(out,'keyboard-trace.json'),JSON.stringify(traces,null,2));await writeFile(path.join(out,'review.html'),`<!doctype html><meta charset="utf-8"><title>R1.1B SEARCH review</title><h1>R1.1B SEARCH — ${report.overall}</h1>${report.results.map(r=>`<section><h2>${r.width}px</h2><img src="search-${r.width}.png" style="max-width:100%"><ul>${r.checks.map(c=>`<li>${c.status}: ${c.name}</li>`).join('')}</ul></section>`).join('')}<p><a href="report.json">Report</a> · <a href="keyboard-trace.json">Keyboard trace</a></p>`);console.log(JSON.stringify({overall:report.overall,results:report.results.map(r=>({width:r.width,failures:r.checks.filter(c=>c.status!=='PASS')}))},null,2))}if(report.overall!=='PASS')process.exitCode=1;
