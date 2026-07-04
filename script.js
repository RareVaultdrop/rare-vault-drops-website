document.getElementById('hamburger')?.addEventListener('click',()=>document.getElementById('nav')?.classList.toggle('open'));
setTimeout(()=>document.getElementById('loader')?.remove(),3400);
const obs = new IntersectionObserver((entries)=>entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('show') }), {threshold:.15});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
