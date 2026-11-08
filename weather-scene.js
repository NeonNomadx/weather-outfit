'use strict';
(() => {
  const button=document.getElementById('motion-toggle');
  if(!button)return;
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let preference='on';
  try{preference=localStorage.getItem('weather-outfit-motion')||'on';}catch{}
  function update(){
    const enabled=preference!=='off'&&!media.matches;
    document.body.classList.toggle('motion-paused',!enabled);
    button.setAttribute('aria-pressed',String(enabled));
    button.disabled=media.matches;
    button.textContent=media.matches?'Motion: reduced':enabled?'Motion: on':'Motion: off';
    button.title=media.matches?'Reduced motion is enabled in your device settings':'Turn the weather animations on or off';
  }
  button.addEventListener('click',()=>{
    preference=preference==='off'?'on':'off';
    try{localStorage.setItem('weather-outfit-motion',preference);}catch{}
    update();
  });
  media.addEventListener('change',update);
  document.addEventListener('visibilitychange',()=>document.body.classList.toggle('page-hidden',document.hidden));
  if('IntersectionObserver' in window){
    const stage=document.getElementById('stage');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(document.body.classList.contains('lab-pause'))return;
      entry.target.classList.toggle('scene-offscreen',!entry.isIntersecting);
    }));
    observer.observe(stage);
  }
  update();
})();
