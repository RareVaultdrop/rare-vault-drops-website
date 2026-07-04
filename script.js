document.querySelector('.menu')?.addEventListener('click',()=>document.querySelector('.nav nav').classList.toggle('open'));
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));