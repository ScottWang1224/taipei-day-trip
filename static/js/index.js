const attractionsContainer = document.querySelector(".attractions");

const categorySelector = document.querySelector(".category-selector");
const categoryMenu = document.querySelector(".category-menu");

const searchInput = document.querySelector(".search-input");
const searchButton = document.querySelector(".search-button");

const mrtList = document.querySelector(".mrt-list");
const mrtContainer = document.querySelector(".mrt-container");
const leftArrowButton = document.querySelector(".arrow-left .arrow-button");
const rightArrowButton = document.querySelector(".arrow-right .arrow-button");

/* =========================
   Authentication Elements
========================= */

const memberAction = document.querySelector("#member-action");

const authModal = document.querySelector("#auth-modal");

const signinDialog = document.querySelector("#signin-dialog");
const signupDialog = document.querySelector("#signup-dialog");

const dialogCloseButtons = document.querySelectorAll(".dialog-close");

const showSignupButton = document.querySelector("#show-signup");
const showSigninButton = document.querySelector("#show-signin");

const signinEmail = document.querySelector("#signin-email");
const signinPassword = document.querySelector("#signin-password");
const signinSubmit = document.querySelector("#signin-submit");
const signinMessage = document.querySelector("#signin-message");

const signupName = document.querySelector("#signup-name");
const signupEmail = document.querySelector("#signup-email");
const signupPassword = document.querySelector("#signup-password");
const signupSubmit = document.querySelector("#signup-submit");
const signupMessage = document.querySelector("#signup-message");

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
    const card = document.createElement("a");

    card.className = "attraction-card";
    card.href = `/attraction/${attraction.id}`;

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
   Authentication Dialog
========================= */

function clearAuthMessages() {
  signinMessage.textContent = "";
  signinMessage.classList.remove("active");

  signupMessage.textContent = "";
  signupMessage.classList.remove("active");
}

function showSigninDialog() {
  clearAuthMessages();

  authModal.hidden = false;
  signinDialog.hidden = false;
  signupDialog.hidden = true;
}

function showSignupDialog() {
  clearAuthMessages();

  authModal.hidden = false;
  signinDialog.hidden = true;
  signupDialog.hidden = false;
}

function closeAuthDialog() {
  authModal.hidden = true;

  signinDialog.hidden = false;
  signupDialog.hidden = true;

  clearAuthMessages();
}

showSignupButton.addEventListener("click", () => {
  showSignupDialog();
});

showSigninButton.addEventListener("click", () => {
  showSigninDialog();
});

dialogCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeAuthDialog();
  });
});

/* =========================
   Sign Up
========================= */

signupSubmit.addEventListener("click", async () => {
  clearAuthMessages();

  const name = signupName.value.trim();
  const email = signupEmail.value.trim();
  const password = signupPassword.value.trim();

  try {
    const response = await fetch("/api/user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    const result = await response.json();

    signupMessage.classList.add("active");

    if (response.ok) {
      signupMessage.textContent = "註冊成功，請登入系統";

      signupName.value = "";
      signupEmail.value = "";
      signupPassword.value = "";
    } else {
      signupMessage.textContent = result.message;
    }
  } catch (error) {
    signupMessage.classList.add("active");
    signupMessage.textContent = "伺服器連線失敗";

    console.error("註冊失敗：", error);
  }
});

/* =========================
   Sign In
========================= */

signinSubmit.addEventListener("click", async () => {
  clearAuthMessages();

  const email = signinEmail.value.trim();
  const password = signinPassword.value.trim();

  try {
    const response = await fetch("/api/user/auth", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem("token", result.token);

      location.reload();
    } else {
      signinMessage.classList.add("active");
      signinMessage.textContent = result.message;
    }
  } catch (error) {
    signinMessage.classList.add("active");
    signinMessage.textContent = "伺服器連線失敗";

    console.error("登入失敗：", error);
  }
});

/* =========================
   Sign-In Status
========================= */

async function checkSignInStatus() {
  const token = localStorage.getItem("token");

  if (!token) {
    memberAction.textContent = "登入/註冊";

    memberAction.addEventListener("click", (event) => {
      event.preventDefault();

      showSigninDialog();
    });

    return;
  }

  try {
    const response = await fetch("/api/user/auth", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (result.data) {
      memberAction.textContent = "登出系統";

      memberAction.addEventListener("click", (event) => {
        event.preventDefault();

        localStorage.removeItem("token");

        location.reload();
      });
    } else {
      localStorage.removeItem("token");

      memberAction.textContent = "登入/註冊";

      memberAction.addEventListener("click", (event) => {
        event.preventDefault();

        showSigninDialog();
      });
    }
  } catch (error) {
    console.error("登入狀態檢查失敗：", error);
  }
}

/* =========================
   Initial Load
========================= */

loadCategories();
loadMrts();
loadAttractions();
checkSignInStatus();
