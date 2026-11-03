// Optional browser regression: install Playwright + Chromium, then run this file with Node.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
function forecast() {
  const start = Date.UTC(2026,10,1);
  const days = Array.from({length:7},(_,i)=>new Date(start+i*86400000).toISOString().slice(0,10));
  const time = Array.from({length:168},(_,i)=>new Date(start+i*3600000).toISOString().slice(0,16));
  const current = {time:time[12],temperature_2m:55,apparent_temperature:54,weather_code:3,wind_speed_10m:8,wind_gusts_10m:12,precipitation:0,precipitation_probability:10,uv_index:2};
  const hourly = {time};
  for(const [key,value] of Object.entries(current))if(key!=='time')hourly[key]=Array(168).fill(value);
  const daily = {time:days,sunrise:days.map(d=>d+'T06:30'),sunset:days.map(d=>d+'T17:05')};
  for(const [key,value] of Object.entries({temperature_2m_max:60,temperature_2m_min:45,apparent_temperature_max:58,apparent_temperature_min:43,weather_code:3,precipitation_probability_max:10,precipitation_sum:0,wind_speed_10m_max:10,wind_gusts_10m_max:14,uv_index_max:2}))daily[key]=Array(7).fill(value);
  return {current,hourly,daily};
}
(async()=>{
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  try {
    for(const width of [390,768,1440]){
      const page=await browser.newPage({viewport:{width,height:844},hasTouch:width===390,isMobile:width===390});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      let data=forecast();
      await page.route('**/*',route=>{
        const url=route.request().url();
        if(url.includes('api.open-meteo.com/'))return route.fulfill({json:data,headers:{'access-control-allow-origin':'*'}});
        if(/\.webp(?:\?|$)/.test(url))return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')});
        return route.continue();
      });
      await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
      await page.waitForSelector('.day');
      const height=await page.locator('#stage').evaluate(el=>el.offsetHeight);
      await page.setViewportSize({width,height:740});
      assert.equal(await page.locator('#stage').evaluate(el=>el.offsetHeight),height,'Browser height changes must not resize the portrait');
      const day=page.locator('.day').nth(5);
      await day.scrollIntoViewIfNeeded();await day.focus();
      const before=await page.evaluate(()=>{
        window.testDay=document.querySelectorAll('.day')[5];
        document.getElementById('hours').scrollLeft=200;
        return {scrollY,strip:document.getElementById('hours').scrollLeft};
      });
      await page.keyboard.press('Enter');
      assert.equal(await day.getAttribute('aria-pressed'),'true');
      let state=await page.evaluate(()=>({connected:window.testDay.isConnected,focused:document.activeElement===window.testDay,scrollY,strip:document.getElementById('hours').scrollLeft}));
      assert(state.connected&&state.focused,'Selecting a day must preserve the button and focus');
      assert(Math.abs(state.scrollY-before.scrollY)<=2,'Selecting a day must not jump the page');
      assert.equal(state.strip,before.strip,'Selecting a day must preserve horizontal forecast position');
      data.hourly.temperature_2m[12]=56;data.current.temperature_2m=56;
      await page.evaluate(()=>load());
      state=await page.evaluate(()=>({connected:window.testDay.isConnected,focused:document.activeElement===window.testDay,scrollY,strip:document.getElementById('hours').scrollLeft}));
      assert(state.connected&&state.focused,'Refreshing weather must preserve the active day button');
      assert(Math.abs(state.scrollY-before.scrollY)<=2,'Background refresh must not jump the page');
      assert.equal(state.strip,before.strip,'Changed hourly weather must preserve horizontal forecast position');
      await page.keyboard.press('Enter');assert.equal(await day.getAttribute('aria-pressed'),'false');
      await page.evaluate(()=>window.scrollTo(0,300));
      const mid=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,180);await page.waitForTimeout(250);
      assert((await page.evaluate(()=>scrollY))>mid,'Ordinary scrolling must still work');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.deepEqual(errors,[]);
      await page.close();console.log(`${width}px: stable portrait, day selection/focus, refresh, horizontal forecast, and scrolling passed`);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
