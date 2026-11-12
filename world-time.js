'use strict';
(function(root){
  const pad=(n,size=2)=>String(n).padStart(size,'0');
  const validMinutes=value=>typeof value==='number'&&Number.isFinite(value)&&value>=0&&value<1440;
  function clockParts(year,month,day,hour,minute){
    if(!Number.isInteger(year)||year<1||year>9999)throw new RangeError('Clock year is outside the supported calendar');
    return {day:pad(year,4)+'-'+pad(month)+'-'+pad(day),minutes:hour*60+minute};
  }
  function localClock(now,timezone,utcOffsetSeconds){
    const instant=now===undefined?new Date():now instanceof Date?new Date(now.getTime()):typeof now==='number'?new Date(now):null;
    if(!instant||!Number.isFinite(instant.getTime()))throw new RangeError('A valid clock instant is required');
    if(typeof timezone==='string'&&timezone.trim()){
      try{
        const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant);
        const get=type=>Number(parts.find(part=>part.type===type)?.value);
        return clockParts(get('year'),get('month'),get('day'),get('hour'),get('minute'));
      }catch{}
    }
    if(Number.isInteger(utcOffsetSeconds)&&Math.abs(utcOffsetSeconds)<=14*3600){
      const shifted=new Date(instant.getTime()+utcOffsetSeconds*1000);
      return clockParts(shifted.getUTCFullYear(),shifted.getUTCMonth()+1,shifted.getUTCDate(),shifted.getUTCHours(),shifted.getUTCMinutes());
    }
    return clockParts(instant.getFullYear(),instant.getMonth()+1,instant.getDate(),instant.getHours(),instant.getMinutes());
  }
  function solarTime(value){
    if(validMinutes(value))return {minutes:value,day:''};
    if(typeof value!=='string')return null;
    const match=/^(?:(\d{4})-(\d{2})-(\d{2})T)?([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?$/.exec(value);
    if(!match)return null;
    let day='';
    if(match[1]){
      const year=Number(match[1]),month=Number(match[2]),date=Number(match[3]);
      const leap=year%4===0&&(year%100!==0||year%400===0);
      const lengths=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
      if(year<1||month<1||month>12||date<1||date>lengths[month-1])return null;
      day=match[1]+'-'+match[2]+'-'+match[3];
    }
    const seconds=Number(match[6]||0)+Number('0.'+(match[7]||'0'));
    return {day,minutes:Number(match[4])*60+Number(match[5])+seconds/60};
  }
  function fallback(minutes){return minutes<360||minutes>=1200?'night':minutes<720?'morning':minutes<1020?'afternoon':'evening';}
  function periodFor(minutes,sunrise,sunset){
    if(!validMinutes(minutes))return 'night';
    const rise=solarTime(sunrise),set=solarTime(sunset);
    // Invalid/polar solar data uses predictable clock hours. Very short days can
    // have no afternoon: evening begins at noon, and twilight stays within today.
    if(!rise||!set||(rise.day&&set.day&&rise.day!==set.day)||rise.minutes>=set.minutes||rise.minutes>=720||set.minutes<=720)return fallback(minutes);
    const dawn=Math.max(0,rise.minutes-30),evening=Math.max(720,set.minutes-60),night=Math.min(1440,set.minutes+45);
    if(minutes<dawn||minutes>=night)return 'night';
    if(minutes<720)return 'morning';
    if(minutes<evening)return 'afternoon';
    return 'evening';
  }
  const api={localClock,periodFor};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.WeatherWorldTime=api;
})(typeof globalThis!=='undefined'?globalThis:this);
