const cards=document.querySelectorAll(".cards article,.panel,.insta-grid div");
cards.forEach(card=>{
  card.addEventListener("mousemove",e=>{
    const r=card.getBoundingClientRect();
    card.style.transform=`perspective(900px) rotateX(${-(e.clientY-r.top-r.height/2)/35}deg) rotateY(${(e.clientX-r.left-r.width/2)/35}deg)`;
  });
  card.addEventListener("mouseleave",()=>card.style.transform="perspective(900px) rotateX(0) rotateY(0)");
});