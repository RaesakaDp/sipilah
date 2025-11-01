/* chart.js integration for history page */
(function(){
  const canvas = document.getElementById('volumeChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type:'line',
    data:{ labels:[], datasets:[{ label:'Volume (%)', data:[], borderColor:'#15a3ff', backgroundColor:'rgba(21,163,255,0.12)', fill:true, tension:0.3 }] },
    options:{ responsive:true, animation:false, scales:{ y:{ min:0, max:100 } } }
  });

  function update(binId, days){
    let labels=[], series=[];
    if(binId==='all'){
      const map={};
      window.bins.forEach(b=> b.history.slice(-days).forEach(h=>{ map[h.date]=map[h.date]||[]; map[h.date].push(h.volume); }));
      const keys=Object.keys(map).sort();
      labels=keys; series = keys.map(k=> Math.round(map[k].reduce((a,c)=>a+c,0)/map[k].length));
    } else {
      const b = window.bins.find(x=>x.id==binId) || window.bins[0];
      const hist = (b.history||[]).slice(-days);
      labels = hist.map(h=>h.date); series = hist.map(h=>h.volume);
    }
    chart.data.labels = labels; chart.data.datasets[0].data = series; chart.update();
  }

  const selBin=document.getElementById('selectBin'), selRange=document.getElementById('selectRange');
  function bind(){ const binId = selBin? selBin.value : 'all'; const days = selRange? parseInt(selRange.value,10):30; update(binId, days); }
  if(selBin) selBin.addEventListener('change', bind); if(selRange) selRange.addEventListener('change', bind);
  if(window.sbaSubscribe) window.sbaSubscribe(()=> bind());
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=> bind(), 250));
})();