const pathParts = window.location.pathname.split("/");
const attractionId = pathParts[pathParts.length - 1];

const attractionImage = document.querySelector("#attraction-image");
const indicatorBar = document.querySelector("#indicator-bar");

const leftArrow = document.querySelector(".left-arrow");
const rightArrow = document.querySelector(".right-arrow");

let attractionImages = [];
let currentImageIndex = 0;

async function loadAttraction() {
  try {
    const response = await fetch(`/api/attraction/${attractionId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch attraction");
    }

    const result = await response.json();
    const attraction = result.data;

    renderAttraction(attraction);
  } catch (error) {
    console.error("Error loading attraction:", error);
  }
}

function renderAttraction(attraction) {
  document.querySelector("#attraction-name").textContent = attraction.name;

  document.querySelector("#attraction-meta").textContent =
    `${attraction.category} at ${attraction.mrt}`;

  document.querySelector("#attraction-description").textContent =
    attraction.description;

  document.querySelector("#attraction-address").textContent =
    attraction.address;

  document.querySelector("#attraction-transport").textContent =
    attraction.transport;

  attractionImages = attraction.images ?? [];
  currentImageIndex = 0;

  renderSlideshow();
}

/* =========================
   Slideshow
========================= */

function renderSlideshow() {
  if (attractionImages.length === 0) {
    attractionImage.src = "";
    attractionImage.alt = "無景點圖片";

    indicatorBar.innerHTML = "";

    leftArrow.hidden = true;
    rightArrow.hidden = true;

    return;
  }

  attractionImage.src = attractionImages[currentImageIndex];

  renderIndicators();

  if (attractionImages.length === 1) {
    leftArrow.hidden = true;
    rightArrow.hidden = true;
  } else {
    leftArrow.hidden = false;
    rightArrow.hidden = false;
  }
}

function renderIndicators() {
  indicatorBar.innerHTML = "";

  attractionImages.forEach((image, index) => {
    const indicator = document.createElement("div");

    indicator.className = "indicator";

    if (index === currentImageIndex) {
      indicator.classList.add("active");
    }

    indicatorBar.appendChild(indicator);
  });
}

/* =========================
   Previous / Next
========================= */

leftArrow.addEventListener("click", () => {
  currentImageIndex--;

  if (currentImageIndex < 0) {
    currentImageIndex = attractionImages.length - 1;
  }

  renderSlideshow();
});

rightArrow.addEventListener("click", () => {
  currentImageIndex++;

  if (currentImageIndex >= attractionImages.length) {
    currentImageIndex = 0;
  }

  renderSlideshow();
});

/* =========================
   Booking Time
========================= */

const timeOptions = document.querySelectorAll('input[name="booking-time"]');

const priceText = document.querySelector("#price-text");

timeOptions.forEach((option) => {
  option.addEventListener("change", function () {
    if (this.value === "morning") {
      priceText.textContent = "新台幣 2000 元";
    } else {
      priceText.textContent = "新台幣 2500 元";
    }
  });
});

/* =========================
   Initial Load
========================= */

loadAttraction();
