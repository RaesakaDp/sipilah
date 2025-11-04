/* app.js — glue for final Smart Bin App */
const app = (function(){
  // auth (demo)
  function login(e){
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();
    const err = document.getElementById('authError');
    if(!user || !pass){ if(err) err.textContent='Please enter credentials.'; return false; }
    if(user==='admin' && pass==='1234'){
      localStorage.setItem('sba_user', JSON.stringify({name:'Admin', email:'admin@example.com'}));
      localStorage.setItem('sba_logged','1');
      window.location.href='dashboard.html';
      return false;
    }
    if(err) err.textContent='Invalid username or password.';
    return false;
  }

  function register(e){
    e.preventDefault();
    // demo register just redirects to dashboard
    localStorage.setItem('sba_user', JSON.stringify({name:document.getElementById('regName').value||'User', email:document.getElementById('regEmail').value||''}));
    localStorage.setItem('sba_logged','1');
    window.location.href='dashboard.html';
    return false;
  }

  function requireAuth(){
    const p = location.pathname.split('/').pop();
    if(p !== 'auth.html' && !localStorage.getItem('sba_logged')){ window.location.href='auth.html'; }
  }

  function initTheme(){
    const t = localStorage.getItem('sba_theme') || 'light';
    document.body.classList.toggle('light', t==='light');
    document.body.classList.toggle('dark', t!=='light');
    document.querySelectorAll('#btnTheme, #btnTheme2, #btnTheme3, #btnTheme4, #btnTheme5, #btnTheme6').forEach(b=> b.addEventListener('click', toggleTheme));
  }
  function toggleTheme(){ const isLight = document.body.classList.toggle('light'); document.body.classList.toggle('dark', !isLight); localStorage.setItem('sba_theme', isLight ? 'light':'dark'); }

  // render dashboard list
  function renderDashboard(bins){
    const grid = document.getElementById('binsGrid'); if(!grid) return;
    grid.innerHTML='';
    bins.forEach(b=>{
      const div = document.createElement('div'); div.className='bin-item card';
      // status color
      let status = 'Normal';
      if(b.volume >= 90) status = 'Full';
      else if(b.volume >= 70) status = 'Almost full';
      const statusColor = b.volume >= 90 ? 'var(--danger)' : (b.volume >=70 ? 'orange' : 'var(--success)');
      div.innerHTML = `
        <div class="avatar">${(b.name||'Bin').charAt(0)}</div>
        <div class="meta">
          <div class="name">${b.name}</div>
          <div class="muted small">ID: BIN-${b.id} • Temp: ${b.temp}°C</div>
          <div class="progress-bar"><div class="progress" style="width:${b.volume}%"></div></div>
        </div>
        <div style="text-align:right;min-width:110px">
          <div style="color:${statusColor};font-weight:800">${Math.round(b.volume)}%</div>
          <div style="margin-top:8px"><a class="btn ghost" href="detail.html?id=${b.id}">Detail</a></div>
        </div>`;
      grid.appendChild(div);
    });
    const total = bins.length;
    const avg = Math.round(bins.reduce((s,x)=>s+x.volume,0)/bins.length);
    const alerts = bins.filter(x=>x.volume>=90).length;
    const totalEl = document.getElementById('totalBins'); if(totalEl) totalEl.textContent = total;
    const avgEl = document.getElementById('avgFill'); if(avgEl) avgEl.textContent = avg + '%';
    const alertsEl = document.getElementById('alertsCount'); if(alertsEl) alertsEl.textContent = alerts;
  }

  // detail page render
  function renderDetail(){
    const params = new URLSearchParams(location.search);
    const id = parseInt(params.get('id')||'1',10);
    const bin = window.bins.find(b=>b.id===id);
    if(!bin) return;
    const card = document.getElementById('detailCard');
    if(card){
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div class="muted small">ID: BIN-${bin.id}</div>
            <div style="font-weight:800;font-size:20px">${bin.name}</div>
          </div>
          <div style="text-align:right">
            <div class="muted small">Status</div>
            <div style="font-weight:800">${Math.round(bin.volume)}%</div>
          </div>
        </div>
        <div style="margin-top:12px;display:flex;gap:18px;align-items:center">
          <div style="flex:1">
            <canvas id="gauge" width="140" height="140"></canvas>
          </div>
          <div style="flex:1">
            <div class="muted small">Temperature</div>
            <div style="font-weight:700;font-size:18px">${bin.temp}°C</div>
            <div class="muted small" style="margin-top:10px">Location: ${bin.lat.toFixed(4)}, ${bin.lng.toFixed(4)}</div>
          </div>
        </div>`;
      renderGauge('gauge', bin.volume);
    }
    const modeEl = document.getElementById('modeAuto'); if(modeEl){ modeEl.checked = !!bin.auto; document.getElementById('modeLabel').textContent = bin.auto ? 'Automatic' : 'Manual'; modeEl.onchange = ()=>{ bin.auto = modeEl.checked; document.getElementById('modeLabel').textContent = bin.auto ? 'Automatic':'Manual'; alert('Mode changed (simulated)'); } }
    const lidLabel = document.getElementById('lidLabel'); if(lidLabel) lidLabel.textContent = bin.lid ? 'Closed' : 'Open';
    const openBtn = document.getElementById('btnOpen'), closeBtn = document.getElementById('btnClose');
    if(openBtn) openBtn.onclick = ()=>{ bin.lid=false; if(lidLabel) lidLabel.textContent='Open'; alert('Open command sent (simulated)'); }
    if(closeBtn) closeBtn.onclick = ()=>{ bin.lid=true; if(lidLabel) lidLabel.textContent='Closed'; alert('Close command sent (simulated)'); }
  }

  // simple gauge renderer - canvas
  function renderGauge(id, value){
    const c = document.getElementById(id); if(!c) return;
    const ctx = c.getContext('2d'); const w=c.width, h=c.height; ctx.clearRect(0,0,w,h);
    const angle = (Math.PI * 1.4) * (value/100);
    const start = Math.PI * 0.8;
    // background arc
    ctx.lineWidth = 12; ctx.lineCap='round';
    ctx.strokeStyle='rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.arc(w/2, h/1.2, 48, start, start + Math.PI*1.4); ctx.stroke();
    // value arc
    const grad = ctx.createLinearGradient(0,0,w,0); grad.addColorStop(0,'#0d3b66'); grad.addColorStop(1,'#15a3ff');
    ctx.strokeStyle = grad; ctx.beginPath(); ctx.arc(w/2, h/1.2, 48, start, start + angle); ctx.stroke();
    // text
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text'); ctx.font='700 18px sans-serif'; ctx.textAlign='center'; ctx.fillText(value + '%', w/2, h/1.15);
  }

  // history page helpers are in chart.js (Chart.js used there)

  // notifications append dynamic alerts
  function renderNotifications(){
    const list = document.getElementById('notifList'); if(!list) return;
    const dynamic = window.bins.filter(b=>b.volume>=90).map(b=>({text:`${b.name} • Full (${Math.round(b.volume)}%)`, cls:'critical'}));
    dynamic.forEach(d=>{ const li=document.createElement('li'); li.className='alert critical'; li.innerHTML = `<strong>${d.text}</strong>`; list.prepend(li); });
  }

  // history selector population
  function populateHistorySelect(){ const sel=document.getElementById('selectBin'); if(!sel) return; sel.innerHTML = '<option value="all">All bins</option>'; window.bins.forEach(b=> sel.insertAdjacentHTML('beforeend', `<option value="${b.id}">${b.name}</option>`)); }

  // map init called from map.js

  function init(){
    requireAuth();
    initTheme();
    if(window.sbaSubscribe) window.sbaSubscribe((bins)=>{ renderDashboard(bins); renderNotifications(); populateHistorySelect(); if(document.getElementById('detailCard')) renderDetail(); });
    if(window.bins){ renderDashboard(window.bins); renderNotifications(); populateHistorySelect(); if(document.getElementById('detailCard')) renderDetail(); }
    const r = document.getElementById('refreshBtn'); if(r) r.addEventListener('click', ()=> renderDashboard(window.bins));
    const logout = document.getElementById('logoutBtn'); if(logout) logout.addEventListener('click', ()=> { localStorage.clear(); window.location.href='auth.html'; });
    // wire theme buttons already handled in initTheme
  }

  return { login, register, init };
})();

document.addEventListener('DOMContentLoaded', ()=> app.init());

// ==== Animasi Card Saat Muncul ====
document.addEventListener("DOMContentLoaded", () => {
  // scroll ke atas setiap kali halaman dimuat ulang
  window.scrollTo({ top: 0, behavior: "smooth" });

  document.querySelectorAll('.card').forEach((card, i) => {
    setTimeout(() => card.classList.add('show'), i * 200);
  });

  loadBins();
});

// ==== Tombol Refresh ====
const refreshBtn = document.getElementById('refreshBtn');
refreshBtn.addEventListener('click', () => {
  // animasi klik refresh
  refreshBtn.style.animation = 'refreshPulse 0.6s';
  setTimeout(() => refreshBtn.style.animation = '', 600);

  // scroll otomatis ke atas setiap kali klik refresh
  window.scrollTo({ top: 0, behavior: "smooth" });

  loadBins();
});