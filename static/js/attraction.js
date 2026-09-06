const pathParts = window.location.pathname.split("/");
const attractionId = pathParts[pathParts.length - 1];

const attractionImage = document.querySelector("#attraction-image");
const indicatorBar = document.querySelector("#indicator-bar");

const leftArrow = document.querySelector(".left-arrow");
const rightArrow = document.querySelector(".right-arrow");

let attractionImages = [];
let currentImageIndex = 0;

/* =========================
   Load Attraction
========================= */

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

/* =========================
   Render Attraction
========================= */

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

/* =========================
   Indicators
========================= */

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
   Booking Elements
========================= */

const timeOptions = document.querySelectorAll('input[name="booking-time"]');

const priceText = document.querySelector("#price-text");

const bookingButton = document.querySelector("#booking-button");

// 景點頁只有一個 date input，因此直接取得即可
const bookingDate = document.querySelector('input[type="date"]');

/* =========================
   Booking Time / Price
========================= */

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
   Create Booking
========================= */

bookingButton.addEventListener("click", async () => {
  const token = localStorage.getItem("token");

  // 未登入
  if (!token) {
    showSigninDialog();
    return;
  }

  // 日期
  const date = bookingDate.value;

  if (!date) {
    alert("請選擇日期");
    return;
  }

  // 時段
  const selectedTime = document.querySelector(
    'input[name="booking-time"]:checked',
  );

  if (!selectedTime) {
    alert("請選擇時間");
    return;
  }

  const time = selectedTime.value;

  // 價格
  let price;

  if (time === "morning") {
    price = 2000;
  } else if (time === "afternoon") {
    price = 2500;
  } else {
    alert("預定時段不正確");
    return;
  }

  try {
    const response = await fetch("/api/booking", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        attractionId: Number(attractionId),
        date: date,
        time: time,
        price: price,
      }),
    });

    const result = await response.json();

    // Token 過期或無效
    if (response.status === 403) {
      localStorage.removeItem("token");

      showSigninDialog();

      return;
    }

    // 其他建立失敗
    if (!response.ok) {
      alert(result.message || "建立預定行程失敗");
      return;
    }

    // 建立成功
    window.location.href = "/booking";
  } catch (error) {
    console.error("建立預定行程失敗：", error);

    alert("伺服器連線失敗");
  }
});

/* =========================
   Initial Load
========================= */

loadAttraction();
