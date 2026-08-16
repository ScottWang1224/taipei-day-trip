const attractionsContainer = document.querySelector(".attractions");

const categorySelector = document.querySelector(".category-selector");
const categoryMenu = document.querySelector(".category-menu");

const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");

const mrtList = document.querySelector(".mrt-list");
const mrtContainer = document.querySelector(".mrt-container");
const leftArrowButton = document.querySelector(".arrow-left .arrow-button");
const rightArrowButton = document.querySelector(".arrow-right .arrow-button");

let nextPage = 0;
let isLoading = false;

let currentCategory = "";
let currentKeyword = "";

/* =========================
   Attractions
========================= */

async function loadAttractions() {
  if (nextPage === null || isLoading) {
    return;
  }

  isLoading = true;

  try {
    const params = new URLSearchParams();

    params.append("page", nextPage);

    if (currentCategory !== "") {
      params.append("category", currentCategory);
    }

    if (currentKeyword !== "") {
      params.append("keyword", currentKeyword);
    }

    const response = await fetch(`/api/attractions?${params.toString()}`);

    const result = await response.json();

    renderAttractions(result.data);

    nextPage = result.nextPage;
  } catch (error) {
    console.error("景點資料載入失敗：", error);
  } finally {
    isLoading = false;
  }
}

/* =========================
   Render Attractions
========================= */

function renderAttractions(attractions) {
  attractions.forEach((attraction) => {
    const card = document.createElement("article");

    card.className = "attraction-card";

    const imageUrl = attraction.images.length > 0 ? attraction.images[0] : "";

    card.innerHTML = `
      <div class="attraction-image">
        <img
          src="${imageUrl}"
          alt="${attraction.name}"
        />

        <div class="attraction-name">
          ${attraction.name}
        </div>
      </div>

      <div class="attraction-info">
        <span>
          ${attraction.mrt ?? ""}
        </span>

        <span>
          ${attraction.category}
        </span>
      </div>
    `;

    attractionsContainer.appendChild(card);
  });
}

/* =========================
   Search
========================= */

async function searchAttractions() {
  currentKeyword = searchInput.value.trim();

  nextPage = 0;

  attractionsContainer.innerHTML = "";

  await loadAttractions();
}

searchButton.addEventListener("click", () => {
  searchAttractions();
});

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    searchAttractions();
  }
});

/* =========================
   Infinite Scroll
========================= */

const observerTarget = document.createElement("div");

observerTarget.className = "observer-target";

attractionsContainer.after(observerTarget);

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadAttractions();
  }
});

observer.observe(observerTarget);

/* =========================
   Categories
========================= */

async function loadCategories() {
  try {
    const response = await fetch("/api/categories");

    const result = await response.json();

    renderCategories(result.data);
  } catch (error) {
    console.error("分類資料載入失敗：", error);
  }
}

function renderCategories(categories) {
  categoryMenu.innerHTML = "";

  const allItem = createCategoryItem("全部分類", "");

  categoryMenu.appendChild(allItem);

  categories.forEach((category) => {
    const item = createCategoryItem(category, category);

    categoryMenu.appendChild(item);
  });
}

function createCategoryItem(label, value) {
  const button = document.createElement("button");

  button.type = "button";
  button.className = "category-item";
  button.textContent = label;

  button.addEventListener("click", () => {
    currentCategory = value;

    if (currentCategory === "") {
      categorySelector.textContent = "全部分類 ▼";
    } else {
      categorySelector.textContent = `${currentCategory} ▼`;
    }

    categoryMenu.hidden = true;
  });

  return button;
}

categorySelector.addEventListener("click", () => {
  categoryMenu.hidden = !categoryMenu.hidden;
});

/* =========================
   MRT
========================= */

async function loadMrts() {
  try {
    const response = await fetch("/api/mrts");

    const result = await response.json();

    renderMrts(result.data);
  } catch (error) {
    console.error("捷運站資料載入失敗：", error);
  }
}

function renderMrts(mrts) {
  mrtList.innerHTML = "";

  mrts.forEach((mrt) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "mrt-item";
    button.textContent = mrt;

    button.addEventListener("click", () => {
      searchInput.value = mrt;

      currentKeyword = mrt;

      nextPage = 0;

      attractionsContainer.innerHTML = "";

      loadAttractions();
    });

    mrtList.appendChild(button);
  });
}

/* =========================
   MRT Horizontal Scroll
========================= */

leftArrowButton.addEventListener("click", () => {
  mrtContainer.scrollBy({
    left: -300,
    behavior: "smooth",
  });
});

rightArrowButton.addEventListener("click", () => {
  mrtContainer.scrollBy({
    left: 300,
    behavior: "smooth",
  });
});

/* =========================
   Initial Load
========================= */

loadCategories();
loadMrts();
loadAttractions();
