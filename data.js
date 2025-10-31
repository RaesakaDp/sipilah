/*
  data.js
  - Mendefinisikan window.bins (global)
  - Menyediakan fungsi sederhana untuk update simulasi
*/
(function(){
  // initial sample data (3 bins) - ubah lokasi/atribut sesuai kebutuhan
  window.bins = [
    { id: 1, lokasi: "Kantin Utama", volume: 76, suhu: 28, lat: -7.9528, lng: 112.6145, tutup: true, auto: true, history: [] },
    { id: 2, lokasi: "Parkir Utama", volume: 22, suhu: 26, lat: -7.9560, lng: 112.6200, tutup: false, auto: true, history: [] },
    { id: 3, lokasi: "Laboratorium", volume: 98, suhu: 31, lat: -7.9500, lng: 112.6180, tutup: true, auto: false, history: [] },
  ];

  // create initial history for last 30 days (simple simulation)
  const days = 30;
  const now = Date.now();
  window.bins.forEach(bin => {
    bin.history = [];
    for(let i = days - 1; i >= 0; i--){
      const date = new Date(now - i * 24*60*60*1000);
      // generate sample volumes with small random variability
      const base = Math.min(100, Math.max(0, bin.volume + (Math.random()*20-10)));
      bin.history.push({ date: date.toISOString().slice(0,10), volume: Math.round(base) });
    }
  });

  // provide method to randomly update bins (simulate real-time)
  window.sbaSimulateStep = function(){
    window.bins = window.bins.map(b => {
      // small drift if auto mode (fill more over time)
      const drift = (b.auto ? (Math.random()*6) : (Math.random()*4-2));
      let newVol = Math.round(Math.min(100, Math.max(0, b.volume + drift)));
      let newTemp = Math.round(Math.min(60, Math.max(10, b.suhu + (Math.random()*2-1))));
      // push today's value to history
      const today = new Date().toISOString().slice(0,10);
      const last = b.history[b.history.length - 1];
      if(!last || last.date !== today){
        b.history.push({date: today, volume: newVol});
        // keep last 90 days for safety
        if(b.history.length > 90) b.history.shift();
      } else {
        last.volume = newVol;
      }
      return Object.assign({}, b, { volume: newVol, suhu: newTemp });
    });
  };

  // optional: expose a simple pubsub for scripts
  window.sbaSubscribers = [];
  window.sbaSubscribe = function(fn){ window.sbaSubscribers.push(fn); };
  window.sbaPublish = function(){ window.sbaSubscribers.forEach(fn => { try{ fn(window.bins); }catch(e){console.error(e)} }); };

  // run simulation periodically and notify subscribers
  window.sbaInterval = setInterval(function(){
    window.sbaSimulateStep();
    window.sbaPublish();
  }, 5000); // update every 5s (demo)
})();
