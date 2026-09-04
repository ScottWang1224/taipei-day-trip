/* =========================
   DOM
========================== */

const memberName = document.querySelector("#member-name");

const bookingContent = document.querySelector("#booking-content");
const emptyBooking = document.querySelector("#empty-booking");

const bookingImage = document.querySelector("#booking-image");
const bookingAttractionName = document.querySelector(
  "#booking-attraction-name",
);
const bookingDate = document.querySelector("#booking-date");
const bookingTime = document.querySelector("#booking-time");
const bookingPrice = document.querySelector("#booking-price");
const bookingAddress = document.querySelector("#booking-address");

const deleteBookingButton = document.querySelector("#delete-booking");

const contactName = document.querySelector("#contact-name");
const contactEmail = document.querySelector("#contact-email");

const confirmPrice = document.querySelector("#confirm-price");

const memberAction = document.querySelector("#member-action");

/* =========================
   Token
========================== */

function getToken() {
  return localStorage.getItem("token");
}

/* =========================
   Authorization
========================== */

function getAuthorizationHeaders() {
  const token = getToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

/* =========================
   Get Current User
========================== */

async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    window.location.href = "/";
    return null;
  }

  try {
    const response = await fetch("/api/user/auth", {
      method: "GET",
      headers: getAuthorizationHeaders(),
    });

    const result = await response.json();

    if (!result.data) {
      localStorage.removeItem("token");
      window.location.href = "/";
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("取得會員資料失敗：", error);

    return null;
  }
}

/* =========================
   Get Booking
========================== */

async function getBooking() {
  try {
    const response = await fetch("/api/booking", {
      method: "GET",
      headers: getAuthorizationHeaders(),
    });

    if (response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/";

      return null;
    }

    if (!response.ok) {
      throw new Error("取得預定行程失敗");
    }

    return await response.json();
  } catch (error) {
    console.error("取得預定行程失敗：", error);

    return null;
  }
}

/* =========================
   Render User
========================== */

function renderUser(user) {
  memberName.textContent = user.name;

  contactName.value = user.name;
  contactEmail.value = user.email;

  memberAction.textContent = "登出系統";
}

/* =========================
   Booking Time
========================== */

function formatBookingTime(time) {
  if (time === "morning") {
    return "早上 9 點到下午 4 點";
  }

  if (time === "afternoon") {
    return "下午 2 點到晚上 9 點";
  }

  return time;
}

/* =========================
   Render Booking
========================== */

function renderBooking(booking) {
  if (!booking) {
    bookingContent.classList.add("hidden");
    emptyBooking.classList.remove("hidden");

    document.body.classList.add("booking-empty-state");

    return;
  }

  document.body.classList.remove("booking-empty-state");

  emptyBooking.classList.add("hidden");
  bookingContent.classList.remove("hidden");

  bookingImage.src = booking.attraction.image;
  bookingImage.alt = booking.attraction.name;

  bookingAttractionName.textContent = booking.attraction.name;

  bookingDate.textContent = booking.date;

  bookingTime.textContent = formatBookingTime(booking.time);

  bookingPrice.textContent = `新台幣 ${booking.price} 元`;

  bookingAddress.textContent = booking.attraction.address;

  confirmPrice.textContent = booking.price;
}

/* =========================
   Delete Booking
========================== */

async function deleteBooking() {
  try {
    const response = await fetch("/api/booking", {
      method: "DELETE",
      headers: getAuthorizationHeaders(),
    });

    if (response.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/";

      return;
    }

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || "刪除預定行程失敗");
    }

    window.location.reload();
  } catch (error) {
    console.error("刪除預定行程失敗：", error);
  }
}

/* =========================
   Logout
========================== */

function logout() {
  localStorage.removeItem("token");

  window.location.href = "/";
}

/* =========================
   Events
========================== */

deleteBookingButton.addEventListener("click", deleteBooking);

memberAction.addEventListener("click", (event) => {
  event.preventDefault();

  logout();
});

/* =========================
   Initialize
========================== */

async function initializeBookingPage() {
  const user = await getCurrentUser();

  if (!user) {
    return;
  }

  renderUser(user);

  const bookingResult = await getBooking();

  if (!bookingResult) {
    return;
  }

  renderBooking(bookingResult.data);
}

initializeBookingPage();
