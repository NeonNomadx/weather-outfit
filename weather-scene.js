'use strict';
(() => {
  try { localStorage.removeItem('weather-outfit-motion'); } catch {}
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  function update() {
    document.body.classList.toggle('motion-paused', media.matches);
  }
  media.addEventListener('change', update);
  document.addEventListener('visibilitychange', () => document.body.classList.toggle('page-hidden', document.hidden));
  update();
})();

/* The backdrop follows the selected city's real local clock, never a tapped forecast day. */
(() => {
  const clock=globalThis.WeatherWorldTime;
  const layers=[document.getElementById('world-waterfront-a'),document.getElementById('world-waterfront-b')];
  if(!clock||layers.some(x=>!x))return;
  const pictures={morning:'assets/waterfront-morning.webp',afternoon:'assets/waterfront-afternoon.webp',evening:'assets/waterfront-sunset.webp',night:'assets/waterfront-night.webp'};
  let visible=-1,requested='',generation=0;
  const validZone=zone=>{try{if(!zone||zone==='auto')return '';new Intl.DateTimeFormat('en',{timeZone:zone}).format();return zone;}catch{return '';}};
  function update(){
    const ctx=globalThis.getWeatherWorldContext?.()||{},data=ctx.data||{},zone=validZone(ctx.timezone)||validZone(data.timezone);
    const local=clock.localClock(new Date(),zone,data.utc_offset_seconds);
    const day=data.daily?.time?.indexOf(local.day)??-1;
    const period=clock.periodFor(local.minutes,day>=0?data.daily.sunrise?.[day]:undefined,day>=0?data.daily.sunset?.[day]:undefined);
    document.body.dataset.worldPeriod=period;
    if(requested===period)return;
    requested=period;const token=++generation,next=visible===0?1:0,img=layers[next];
    img.classList.remove('is-visible');img.onload=async()=>{
      try{await img.decode();}catch{}
      if(token!==generation)return;
      img.classList.add('is-visible');if(visible>=0&&visible!==next)layers[visible].classList.remove('is-visible');visible=next;
      document.body.dataset.worldImage=period;img.onload=null;
    };
    img.onerror=()=>{if(token===generation)requested='';img.onerror=null;};
    img.src=pictures[period];
  }
  globalThis.updateWeatherWorld=update;
  window.addEventListener('weather:world',update);
  window.addEventListener('pageshow',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  update();setInterval(()=>{if(!document.hidden)update();},60000);
})();
