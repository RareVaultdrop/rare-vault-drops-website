const menuBtn=document.getElementById('menuBtn');
const navMenu=document.getElementById('navMenu');
menuBtn?.addEventListener('click',()=>navMenu.classList.toggle('open'));
const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('show');}});},{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
setTimeout(()=>{document.getElementById('vaultIntro')?.remove();},3600);
