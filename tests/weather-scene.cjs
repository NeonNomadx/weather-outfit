const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
function forecast(code=3,time='12:00'){
 const epoch=Date.UTC(2026,10,1),days=Array.from({length:7},(_,i)=>new Date(epoch+i*86400000).toISOString().slice(0,10)),hours=Array.from({length:168},(_,i)=>new Date(epoch+i*3600000).toISOString().slice(0,16));
 const current={time:days[0]+'T'+time,temperature_2m:55,apparent_temperature:54,weather_code:code,wind_speed_10m:8,wind_gusts_10m:12,precipitation:0,precipitation_probability:10,uv_index:2};
 const hourly={time:hours},daily={time:days,sunrise:days.map(d=>d+'T06:30'),sunset:days.map(d=>d+'T17:05')};
 for(const [k,v]of Object.entries(current))if(k!=='time')hourly[k]=Array(168).fill(v);
 for(const [k,v]of Object.entries({temperature_2m_max:60,temperature_2m_min:45,apparent_temperature_max:58,apparent_temperature_min:43,weather_code:code,precipitation_probability_max:10,precipitation_sum:0,wind_speed_10m_max:10,wind_gusts_10m_max:14,uv_index_max:2}))daily[k]=Array(7).fill(v);
 return {current,hourly,daily};
}
(async()=>{
 const b=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  for(const width of [390,1440]){
   const context=await b.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});
   const p=await context.newPage(),errors=[];let data=forecast();p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/api.open-meteo.com/**',r=>r.fulfill({json:data,headers:{'access-control-allow-origin':'*'}}));
   const base=pathToFileURL(path.resolve(__dirname,'../index.html')).href;
   for(const [key,sky]of [['sunny','sun'],['warm','sun'],['mild','partly'],['cloudy','cloud'],['rain','rain'],['cold','cloud'],['freezing','snow']]){
    await p.goto(base+'?demo='+key,{waitUntil:'domcontentloaded'});await p.waitForSelector('.day');
    for(const who of ['kai','men','women']){
     await p.locator(`[data-s="${who}"]`).click();
     await p.waitForFunction(({k,who})=>{const img=document.querySelector('.figure.on');return img?.getAttribute('src')?.endsWith('char-'+k+'-'+who+'.webp')&&img.complete&&img.naturalWidth>0&&img.alt.startsWith(who==='kai'?'Kai':who==='men'?'Men':'Women');},{k:key,who});
     assert.equal(await p.locator(`[data-s="${who}"]`).getAttribute('aria-pressed'),'true');
     const wear=(await p.locator('#rec-wear').innerText()).toLowerCase();
     if(who==='kai')assert(!wear.includes('crop'));
     if(who==='men'&&key==='sunny')assert(wear.includes('cargo shorts')&&wear.includes('silver chain'));
     if(who==='women'&&key==='sunny')assert(wear.includes('sage crop tank')&&wear.includes('gold hoops'));
     if(who==='men'&&key==='rain')assert(wear.includes('yellow raincoat')&&!wear.includes('crop'));
     if(who==='women'&&key==='freezing')assert(wear.includes('earmuffs'));
     const caption=await p.locator('#character-caption').innerText();
     assert.equal(caption,(who==='kai'?'Kai':who==='men'?'Men':'Women')+' · weather-ready wardrobe');
    }
    assert.equal(await p.locator('body').getAttribute('data-sky'),sky);
    assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await p.locator('[data-s="kai"]').click();
    if(width===390&&key==='rain'){await p.waitForTimeout(750);await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:'/workspace/projects/weather-outfit/rain-phone.png'});}
   }
   await p.goto(base);await p.waitForSelector('.day');
   assert.equal(await p.locator('[data-s="kai"]').getAttribute('aria-pressed'),'true','Character choice persists');
   assert.equal(await p.locator('#motion-toggle').count(),0,'Motion button is gone');
   assert.equal(await p.locator('meta[name="apple-mobile-web-app-title"]').getAttribute('content'),'Weather Outfit');
   assert.equal(await p.locator('link[rel="apple-touch-icon"]').getAttribute('href'),'icons/apple-touch-icon-v2.png');
   assert.equal(await p.locator('link[rel="icon"][type="image/png"]').getAttribute('href'),'icons/favicon-32-v2.png');
   assert.equal(await p.locator('link[rel="manifest"]').getAttribute('href'),'site.webmanifest');
   assert.equal(await p.locator('.world-cloud').first().evaluate(e=>getComputedStyle(e).animationName),'world-drift');
   await p.evaluate(()=>localStorage.setItem('weather-outfit-motion','off'));
   await p.reload();await p.waitForSelector('.day');
   assert.equal(await p.evaluate(()=>localStorage.getItem('weather-outfit-motion')),null,'A saved off preference cannot turn motion back off');
   assert.equal(await p.locator('body').evaluate(e=>e.classList.contains('motion-paused')),false);
   assert.equal(await p.locator('.world-cloud').first().evaluate(e=>getComputedStyle(e).animationPlayState),'running');
   data=forecast(0,'22:00');await p.evaluate(()=>load());assert.equal(await p.locator('body').getAttribute('data-sky'),'night');assert(await p.locator('body').evaluate(e=>e.classList.contains('world-night')));
   data=forecast(3,'22:00');await p.evaluate(()=>load());assert.equal(await p.locator('body').getAttribute('data-sky'),'cloud');assert(await p.locator('body').evaluate(e=>e.classList.contains('world-night')));
   await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.body.classList.contains('motion-paused'));
   assert.equal(await p.locator('.world-cloud').first().evaluate(e=>getComputedStyle(e).animationName),'none','System reduced motion still stops animation');
   await p.locator('[data-s="neutral"]').click();await p.waitForFunction(()=>document.querySelector('.figure.on')?.src.includes('-neutral.webp'));
   await p.locator('[data-s="men"]').click();await p.reload();await p.waitForSelector('.day');
   assert.equal(await p.locator('[data-s="men"]').getAttribute('aria-pressed'),'true','Men choice persists');
   await p.locator('[data-s="women"]').click();await p.reload();await p.waitForSelector('.day');
   assert.equal(await p.locator('[data-s="women"]').getAttribute('aria-pressed'),'true','Women choice persists');
   await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!document.body.classList.contains('motion-paused'));
   assert.equal(await p.locator('.figure.on').evaluate(e=>getComputedStyle(e).animationName),'bob');
   await p.evaluate(()=>scrollTo(0,0));
   if(width===1440)await p.screenshot({path:'/workspace/projects/weather-outfit/night-desktop.png'});
   assert.deepEqual(errors,[]);await context.close();console.log(`${width}px: seven outfits for Kai, Men, and Women, scene matching, motion controls, saved preferences and reduced motion passed`);
  }
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
