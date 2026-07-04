
document.getElementById('menuBtn')?.addEventListener('click',()=>document.getElementById('navMenu')?.classList.toggle('open'));
setTimeout(()=>document.getElementById('intro')?.remove(),3800);
const obs=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
