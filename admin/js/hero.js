async function loadSlides(){

const slides =
await fetch("/api/hero-slides")
.then(r=>r.json());

document.getElementById(
"slidesList"
).innerHTML =

slides.map(slide=>`

<div class="card">

<img
src="${slide.image}"
style="
width:220px;
border-radius:10px;
">

<h2>

${slide.title}

</h2>

<p>

${slide.subtitle}

</p>

</div>

`).join("");

}