/*
  script.js
  - Dipakai oleh banyak halaman
  - Meng-handle:
    * Auth check & profile
    * Rendering list bins (dashboard)
    * Detail page logic (mode + control)
    * Notifications list
    * Riwayat chart rendering
    * Theme toggle
    * Simple CSV export
*/

(function(){
  // ---- Auth guard for private pages ----
  function requireLogin(){
    if(!localStorage.getItem('sba_logged')){
      window.location.href = 'index.html';
    }
  }

  // If page is not login page, require login
  if(!/index\.html?$/.test(window.location.pathname)){
    requireLogin();
  }

  // Load profile (if any)
  function loadProfile(){
    const raw = localStorage.getItem('sba_user');
    if(raw){
      try{
        const u = JSON.parse(raw);
        const elName = document.getElementById('userName');
        const elEmail = document.getElementById('userEmail');
        if(elName) elName.textContent = u.name || 'User';
        if(elEmail) elEmail.textContent = u.email || '';
      }catch(e){}
    }
  }
  loadProfile();

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if(themeToggle){
    const pref = localStorage.getItem('sba_theme');
    if(pref === 'dark') document.body.classList.add('dark');
    themeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
    themeToggle.addEventListener('click', ()=>{
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('sba_theme', isDark ? 'dark' : 'light');
      themeToggle.textContent = isDark ? '☀️' : '🌙';
    });
  }

  // COMMON: render bins list (used in dashboard)
  function renderBinsList(binsEl){
    if(!binsEl) return;
    binsEl.innerHTML = '';
    window.bins.forEach(bin => {
      const div = document.createElement('div');
      div.className = 'bin';
      // status badge by volume
      let badge = 'Normal', badgeClass = 'ok';
      if(bin.volume >= 90){ badge = 'Penuh'; badgeClass = 'full'; }
      else if(bin.volume >= 70){ badge = 'Hampir penuh'; badgeClass = 'warn'; }
      else { badge = 'Normal'; badgeClass = 'ok'; }

      div.innerHTML = `
        <div class="avatar">${(bin.lokasi||'').charAt(0)||'B'}</div>
        <div class="meta">
          <div class="name">${bin.lokasi}</div>
          <div class="muted small">ID: BIN-${bin.id} • Suhu: ${bin.suhu}°C</div>
          <div class="progress-bar" aria-hidden><div class="progress" style="width:${bin.volume}%"></div></div>
        </div>
        <div style="min-width:86px;text-align:right">
          <div class="small muted">${Math.round(bin.volume)}%</div>
          <div style="margin-top:6px"><span class="badge ${badgeClass}">${badge}</span></div>
          <div style="margin-top:8px"><a class="btn ghost" href="detail.html?id=${bin.id}">Detail</a></div>
        </div>
      `;
      binsEl.appendChild(div);
    });
  }

  // Subscribe to simulation updates to re-render
  if(window.sbaSubscribe){
    window.sbaSubscribe(function(bins){
      // re-render dashboard if present
      const container = document.getElementById('binsContainer');
      if(container) renderBinsList(container);
      // update notifications
      renderNotifications();
      // update riwayat chart if present
      if(window._sbaChart) updateChartData(window._sbaChart);
    });
  }

  // Initial render for dashboard page
  document.addEventListener('DOMContentLoaded', function(){
    const binsContainer = document.getElementById('binsContainer');
    if(binsContainer){
      renderBinsList(binsContainer);
      // quick actions
      const refreshBtn = document.getElementById('refreshBtn');
      if(refreshBtn) refreshBtn.addEventListener('click', ()=> renderBinsList(binsContainer));
      const setAllAuto = document.getElementById('setAllAuto');
      if(setAllAuto) setAllAuto.addEventListener('click', function(){
        window.bins = window.bins.map(b => Object.assign({}, b, { auto: true }));
        alert('Semua tong disetel ke mode otomatis.');
      });
    }

    // DETAIL PAGE logic
    if(document.getElementById('detailCard')){
      const params = new URLSearchParams(window.location.search);
      const id = parseInt(params.get('id') || params.get('bin') || '1', 10);
      const bin = window.bins.find(b=>b.id===id) || window.bins[0];
      const card = document.getElementById('detailCard');
      if(bin){
        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div class="muted small">ID: BIN-${bin.id}</div>
              <div class="value" style="font-size:20px;font-weight:800">${bin.lokasi}</div>
            </div>
            <div style="text-align:right">
              <div class="muted small">Status</div>
              <div style="font-weight:800">${Math.round(bin.volume)}%</div>
            </div>
          </div>
          <div style="margin-top:12px">
            <div class="muted small">Gauge (simulasi)</div>
            <div style="font-size:42px;font-weight:800;color:var(--accent);margin-top:6px">${Math.round(bin.volume)}%</div>
            <div class="muted small" style="margin-top:6px">Suhu: ${bin.suhu}°C</div>
          </div>
        `;
      } else {
        card.textContent = 'Tong tidak ditemukan.';
      }

      // controls
      const modeAuto = document.getElementById('modeAuto');
      const modeLabel = document.getElementById('modeLabel');
      const lidLabel = document.getElementById('lidLabel');
      const btnOpen = document.getElementById('btnOpen');
      const btnClose = document.getElementById('btnClose');

      function refreshDetail(){
        const current = window.bins.find(b=>b.id===id);
        if(!current) return;
        modeAuto.checked = !!current.auto;
        modeLabel.textContent = current.auto ? 'Otomatis' : 'Manual';
        lidLabel.textContent = current.tutup ? 'Tertutup' : 'Terbuka';
      }
      refreshDetail();

      modeAuto.addEventListener('change', function(){
        const b = window.bins.find(b=>b.id===id);
        if(b) { b.auto = modeAuto.checked; refreshDetail(); alert('Mode disimpan.'); }
      });
      btnOpen.addEventListener('click', function(){
        const b = window.bins.find(b=>b.id===id);
        if(b){ b.tutup = false; refreshDetail(); alert('Perintah: Buka tutup dikirim (simulasi).'); }
      });
      btnClose.addEventListener('click', function(){
        const b = window.bins.find(b=>b.id===id);
        if(b){ b.tutup = true; refreshDetail(); alert('Perintah: Tutup dikirim (simulasi).'); }
      });

      // Subscribe updates to refresh UI
      window.sbaSubscribe && window.sbaSubscribe(refreshDetail);
    }

    // RIWAYAT page logic
    if(document.getElementById('volumeChart')){
      const ctx = document.getElementById('volumeChart').getContext('2d');
      const selectBin = document.getElementById('selectBin');
      const selectRange = document.getElementById('selectRange');
      const exportBtn = document.getElementById('btnExport');

      // populate bin dropdown
      window.bins.forEach(b => {
        const opt = document.createElement('option'); opt.value = b.id; opt.textContent = b.lokasi;
        if(selectBin) selectBin.appendChild(opt);
      });

      // build chart
      function buildChart(labels, dataset){
        if(window._sbaChart){
          window._sbaChart.data.labels = labels;
          window._sbaChart.data.datasets[0].data = dataset;
          window._sbaChart.update();
          return window._sbaChart;
        }
        window._sbaChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{ label: 'Volume (%)', data: dataset, fill: true, backgroundColor: 'rgba(45,156,219,0.12)', borderColor: '#2D9CDB', tension:0.3 }]
          },
          options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, max:100 } } }
        });
        return window._sbaChart;
      }

      function getSeries(binId, days){
        let series = [];
        if(binId === 'all'){
          // average across bins per date
          const allDates = {};
          window.bins.forEach(b=>{
            b.history.slice(-days).forEach(h=>{
              allDates[h.date] = allDates[h.date] || [];
              allDates[h.date].push(h.volume);
            });
          });
          const labels = Object.keys(allDates).sort();
          series = labels.map(d => Math.round(allDates[d].reduce((a,c)=>a+c,0) / allDates[d].length));
          return { labels:Object.keys(allDates).sort(), data:series };
        } else {
          const bin = window.bins.find(b=>b.id==binId) || window.bins[0];
          const hist = (bin.history || []).slice(-days);
          return { labels: hist.map(h=>h.date), data: hist.map(h=>h.volume) };
        }
      }

      function updateChart(){
        const binId = selectBin.value;
        const days = parseInt(selectRange.value,10);
        const series = getSeries(binId, days);
        buildChart(series.labels, series.data);
      }

      // attach
      selectBin && selectBin.addEventListener('change', updateChart);
      selectRange && selectRange.addEventListener('change', updateChart);
      exportBtn && exportBtn.addEventListener('click', function(){
        // simple CSV export of selected bin
        const binId = selectBin.value;
        const bin = (binId === 'all') ? null : window.bins.find(b=>b.id==binId);
        let csv = 'date,volume\\n';
        if(bin){
          bin.history.forEach(h => csv += `${h.date},${h.volume}\\n`);
        } else {
          // combine all average
          const days = parseInt(selectRange.value,10);
          const s = getSeries('all', days);
          s.labels.forEach((d,i)=> csv += `${d},${s.data[i]}\\n`);
        }
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'sba_history.csv'; a.click();
        URL.revokeObjectURL(url);
      });

      // initial
      updateChart();
      // subscribe updates
      window.sbaSubscribe && window.sbaSubscribe(updateChart);
    }

    // NOTIFICATION page
    function renderNotifications(){
      const listEl = document.getElementById('notifList');
      if(!listEl) return;
      listEl.innerHTML = '';
      // generate notifications from bins: when volume >=90 or suhu >= 45 or offline (not implemented)
      const notif = [];
      window.bins.forEach(b => {
        if(b.volume >= 90) notif.push({id:b.id, text:`${b.lokasi} • Penuh (${Math.round(b.volume)}%)`, time: new Date().toLocaleString()});
        if(b.suhu >= 45) notif.push({id:b.id, text:`${b.lokasi} • Suhu tinggi (${b.suhu}°C)`, time: new Date().toLocaleString()});
      });
      if(notif.length===0){
        listEl.innerHTML = '<li class="muted small">Tidak ada notifikasi aktif.</li>';
      } else {
        notif.forEach(n=>{
          const li = document.createElement('li');
          li.innerHTML = `<strong>${n.text}</strong><div class="muted small">${n.time}</div>`;
          listEl.appendChild(li);
        });
      }
    }
    document.addEventListener('DOMContentLoaded', function(){
      renderNotifications();
    });

    // expose some functions to global if needed
    window.sba = { renderBinsList, renderNotifications };

    // LOGOUT handler on profil page
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn){
      logoutBtn.addEventListener('click', function(){
        localStorage.removeItem('sba_logged');
        localStorage.removeItem('sba_user');
        window.location.href = 'index.html';
      });
    }
  });
})();
