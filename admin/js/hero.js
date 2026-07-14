let editingSlideId = null;
async function loadSlides() {


    const list = document.getElementById("slidesList");

    list.innerHTML = "<h3>Loading...</h3>";

    try {

        const res = await fetch("/api/hero-slides");

        const json = await res.json();

        if (!json.success) {

            list.innerHTML = `
            <h3 style="color:red">
            Unable to load slides
            </h3>
            `;

            return;

        }

        const slides = json.data;
         window.heroSlides = slides;
        if (slides.length === 0) {

            list.innerHTML = `
            <h3>No Hero Slides Found</h3>
            `;

            return;

        }

        list.innerHTML = slides.map(slide => `

        <div class="card" style="
        margin-bottom:20px;
        padding:15px;
        border-radius:15px;
        ">

            <img
src="${
    slide.image &&
    slide.image.trim() !== ""
        ? slide.image
        : "https://placehold.co/220x140?text=No+Image"
}"
style="
width:220px;
border-radius:12px;
display:block;
margin-bottom:15px;
"
onerror="this.src='https://placehold.co/220x140?text=No+Image'"
>

            <h2>${slide.title}</h2>

            <p>${slide.subtitle}</p>

            <p>

            <b>Button :</b>

            ${slide.button_text}

            </p>

            <p>

            <b>Link :</b>

            ${slide.button_link}

            </p>

            <p>

<b>Status :</b>

${slide.active ? "🟢 Active" : "🔴 Disabled"}

<div style="margin-top:10px;">

<button
class="btn"
onclick="toggleSlide(${slide.id}, ${!slide.active})">

${slide.active ? "🚫 Disable" : "✅ Activate"}

</button>

</div>

</p>

<div style="
margin-top:15px;
display:flex;
gap:8px;
flex-wrap:wrap;
">

<button
class="btn"
onclick="moveSlide(${slide.id},'up')">

⬆

</button>

<button
class="btn"
onclick="moveSlide(${slide.id},'down')">

⬇

</button>

<button
class="btn"
onclick="editSlide(${slide.id})">

✏ Edit

</button>

<button
class="btn"
style="
background:#d32f2f;
color:white;
"
onclick="deleteSlide(${slide.id})">

🗑 Delete

</button>

</div>

</div>

        `).join("");

    }

    catch (err) {

        console.error(err);

        list.innerHTML = `
        <h3 style="color:red">
        Server Error
        </h3>
        `;

    }

}

async function uploadHeroImage(){

    const fileInput =
    document.getElementById("heroImageFile");

    if(fileInput.files.length===0){

        alert("Please choose an image.");

        return;

    }

    const formData =
    new FormData();

    formData.append(
        "image",
        fileInput.files[0]
    );

    document.getElementById(
        "uploadStatus"
    ).innerHTML =
    "⏳ Uploading...";

    try{

        const res =
        await fetch("/api/upload-hero",{

            method:"POST",

            headers:{
                "x-admin-key":
                localStorage.getItem("adminKey")
            },

            body:formData

        });

        const json =
        await res.json();

        if(!json.success){

            alert("Upload Failed");

            return;

        }

        document.getElementById(
            "image"
        ).value =
        json.url;

        const preview =
        document.getElementById(
            "heroPreview"
        );

        preview.src =
        json.url;

        preview.style.display =
        "block";

        document.getElementById(
            "uploadStatus"
        ).innerHTML =
        "✅ Upload Complete";

    }catch(err){

        console.log(err);

        alert("Upload Failed");

    }

}

async function saveSlide() {

    const title = document.getElementById("title").value.trim();

    const subtitle = document.getElementById("subtitle").value.trim();

    const button_text = document.getElementById("buttonText").value.trim();

    const button_link = document.getElementById("buttonLink").value.trim();

    const image = document.getElementById("image").value.trim();

    if (!title) {

        alert("Please enter Slide Title");

        return;

    }

    const url = editingSlideId
    ? "/api/hero-slides/" + editingSlideId
    : "/api/hero-slides";

const method = editingSlideId
    ? "PUT"
    : "POST";

const res = await fetch(url,{

    method,

    headers:{
        "Content-Type":"application/json"
    },

    body:JSON.stringify({

        title,

        subtitle,

        button_text,

        button_link,

        image,

        active:true

    })

});
    const json = await res.json();

    if (json.success) {

        alert(

editingSlideId

?

"Hero Slide Updated Successfully"

:

"Hero Slide Added Successfully"

);

        document.getElementById("title").value = "";

        document.getElementById("subtitle").value = "";

        document.getElementById("buttonText").value = "";

        document.getElementById("buttonLink").value = "";

        document.getElementById("image").value = "";
        
        document.getElementById(
        "heroImageFile"
        ).value = "";

        document.getElementById(
        "heroPreview"
        ).style.display =
        "none";

        document.getElementById(
        "uploadStatus"
        ).innerHTML =
        "";

        editingSlideId = null;

document.querySelector(
'button[onclick="saveSlide()"]'
).innerHTML =
"➕ Add Hero Slide";

        loadSlides();

    }

    else {

        alert(json.message || "Failed");

    }

}

async function toggleSlide(id, active){

    const slide = window.heroSlides.find(
        s => s.id === id
    );

    if(!slide) return;

    const res = await fetch(
        "/api/hero-slides/" + id,
        {
            method:"PUT",
            headers:{
                "Content-Type":"application/json"
            },
            body:JSON.stringify({

                title: slide.title,

                subtitle: slide.subtitle,

                button_text: slide.button_text,

                button_link: slide.button_link,

                image: slide.image,

                active: active

            })
        }
    );

    const data = await res.json();

    if(data.success){

        loadSlides();

    }else{

        alert(
            data.message ||
            "Unable to update status."
        );

    }

}

async function deleteSlide(id){

const ok = confirm(
"Delete this Hero Slide?"
);

if(!ok) return;

const res =
await fetch(
"/api/hero-slides/" + id,
{
method:"DELETE"
}
);

const data =
await res.json();

if(data.success){

alert(
"Hero Slide Deleted Successfully"
);

loadSlides();

}else{

alert(
data.message ||
"Delete Failed"
);

}

}

async function moveSlide(id,direction){

const slides =
[...window.heroSlides];

const index =
slides.findIndex(
s=>s.id===id
);

if(index===-1) return;

if(
direction==="up"
&&
index===0
){

return;

}

if(
direction==="down"
&&
index===slides.length-1
){

return;

}

const swapIndex =
direction==="up"
?
index-1
:
index+1;

const temp =
slides[index];

slides[index] =
slides[swapIndex];

slides[swapIndex] =
temp;

const payload =
slides.map((s,i)=>({

id:s.id,

sort_order:i+1

}));

const res =
await fetch(
"/api/hero-slides/reorder",
{

method:"PUT",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

slides:payload

})

}

);

const json =
await res.json();

if(json.success){

loadSlides();

}else{

alert(

json.message ||

"Unable to reorder"

);

}

}

function editSlide(id){

const slide =
window.heroSlides.find(
s => s.id === id
);

if(!slide) return;

editingSlideId = id;

document.getElementById(
"title"
).value =
slide.title || "";

document.getElementById(
"subtitle"
).value =
slide.subtitle || "";

document.getElementById(
"buttonText"
).value =
slide.button_text || "";

document.getElementById(
"buttonLink"
).value =
slide.button_link || "";

document.getElementById(
"image"
).value =
slide.image || "";

const preview =
document.getElementById(
"heroPreview"
);

if(slide.image){

    preview.src =
    slide.image;

    preview.style.display =
    "block";

}else{

    preview.style.display =
    "none";

}

document.querySelector(
".btn"
).innerText =
"💾 Update Hero Slide";

window.scrollTo({

top:0,

behavior:"smooth"

});

}

window.onload = loadSlides;