/* final data simulation for Smart Bin App */
(function(){
  window.bins = [
    { id:1, name:'Cafeteria', volume:76, temp:28, lat:-7.9528, lng:112.6145, lid:true, auto:true, history:[] },
    { id:2, name:'Main Parking', volume:22, temp:26, lat:-7.9560, lng:112.6200, lid:false, auto:true, history:[] },
    { id:3, name:'Lab Block', volume:98, temp:31, lat:-7.9500, lng:112.6180, lid:true, auto:false, history:[] }
  ];

  // init history
  const days=30; const now=Date.now();
  window.bins.forEach(b=>{
    b.history=[];
    for(let i=days-1;i>=0;i--){
      const d=new Date(now - i*24*60*60*1000);
      b.history.push({date:d.toISOString().slice(0,10), volume: Math.max(0, Math.min(100, b.volume + Math.round((Math.random()*20)-10))) });
    }
  });

  // pubsub
  window.sbaSubscribers=[];
  window.sbaSubscribe = fn=> window.sbaSubscribers.push(fn);
  window.sbaPublish = ()=> window.sbaSubscribers.forEach(fn=>{ try{ fn(window.bins) }catch(e){console.error(e)} });

  // realtime updates every 5s
  window.sbaInterval = setInterval(()=>{
    window.bins = window.bins.map(b=>{
      const drift = b.auto ? (Math.random()*4) : (Math.random()*2-1);
      const newVol = Math.round(Math.max(0, Math.min(100, b.volume + drift)));
      const newTemp = Math.round(Math.max(10, Math.min(60, b.temp + (Math.random()*2-1))));
      const today = new Date().toISOString().slice(0,10);
      const history = b.history.slice();
      if(!history.length || history[history.length-1].date !== today){
        history.push({date: today, volume: newVol});
        if(history.length>90) history.shift();
      } else {
        history[history.length-1].volume = newVol;
      }
      return Object.assign({}, b, { volume: newVol, temp: newTemp, history });
    });
    window.sbaPublish();
  },5000);

})();