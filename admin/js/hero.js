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

            </p>

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

    const res = await fetch("/api/hero-slides", {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            title,

            subtitle,

            button_text,

            button_link,

            image

        })

    });

    const json = await res.json();

    if (json.success) {

        alert("Hero Slide Added Successfully");

        document.getElementById("title").value = "";

        document.getElementById("subtitle").value = "";

        document.getElementById("buttonText").value = "";

        document.getElementById("buttonLink").value = "";

        document.getElementById("image").value = "";

        loadSlides();

    }

    else {

        alert(json.message || "Failed");

    }

}

window.onload = loadSlides;