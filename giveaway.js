(()=>{
  const f=document.getElementById('giveaway-form'); if(!f)return;
  const status=document.getElementById('giveaway-status'), btn=document.getElementById('enter-btn');
  const gate=document.getElementById('giveaway-gate'), gateTitle=document.getElementById('gate-title'), countdown=document.getElementById('gate-countdown');
  const start=new Date('2026-10-01T14:00:00-05:00'), end=new Date('2026-10-31T14:00:00-05:00');
  const pad=n=>String(n).padStart(2,'0');
  function refresh(){
    const now=new Date();
    if(now<start){
      const d=start-now, days=Math.floor(d/86400000), hrs=Math.floor(d/3600000)%24, mins=Math.floor(d/60000)%60, secs=Math.floor(d/1000)%60;
      gate.className='giveaway-gate upcoming'; gateTitle.textContent='GIVEAWAY OPENS OCTOBER 1, 2026 • 2:00 PM CT';
      countdown.textContent=`Opens in ${days}d ${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`;
      btn.disabled=true; btn.textContent='GIVEAWAY OPENS OCT 1';
    } else if(now>=end){
      gate.className='giveaway-gate closed'; gateTitle.textContent='ENTRIES ARE CLOSED';
      countdown.textContent='Winner announced October 31, 2026 at 6:00 PM CT';
      btn.disabled=true; btn.textContent='ENTRIES CLOSED';
    } else {
      gate.className='giveaway-gate live'; gateTitle.textContent='ENTRIES ARE OPEN';
      const d=end-now, days=Math.floor(d/86400000), hrs=Math.floor(d/3600000)%24, mins=Math.floor(d/60000)%60;
      countdown.textContent=`Free entry closes in ${days}d ${pad(hrs)}h ${pad(mins)}m • October 31 at 2:00 PM CT`;
      if(localStorage.getItem('rvd30-entered')==='yes'){btn.disabled=true;btn.textContent='ENTRY ALREADY RECEIVED';}
      else {btn.disabled=false;btn.textContent='ENTER GIVEAWAY';}
    }
  }
  refresh(); setInterval(refresh,1000);
  f.addEventListener('submit',async e=>{
    e.preventDefault(); const now=new Date();
    if(now<start){status.textContent='Entries open October 1, 2026 at 2:00 PM CT.';return}
    if(now>=end){status.textContent='Entries closed October 31, 2026 at 2:00 PM CT.';return}
    if(localStorage.getItem('rvd30-entered')==='yes'){status.textContent='This device has already submitted an entry.';return}
    const id='RVD30-'+crypto.randomUUID().slice(0,8).toUpperCase();
    document.getElementById('entry-id').value=id; document.getElementById('entry-time').value=now.toISOString();
    btn.disabled=true; btn.textContent='SUBMITTING...';
    try{
      const r=await fetch(f.action,{method:'POST',body:new FormData(f),headers:{Accept:'application/json'}}); if(!r.ok)throw 0;
      localStorage.setItem('rvd30-entered','yes'); f.reset(); status.textContent=`YOU'RE IN! Entry ${id} has been received.`; btn.textContent='ENTRY RECEIVED';
    }catch{status.textContent='We could not submit your entry. Please try again.';btn.disabled=false;btn.textContent='ENTER GIVEAWAY'}
  });
})();