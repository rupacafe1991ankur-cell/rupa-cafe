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
            src="${slide.image || '/images/no-image.png'}"
            style="
            width:220px;
            border-radius:12px;
            display:block;
            margin-bottom:15px;
            ">

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

window.onload = loadSlides;