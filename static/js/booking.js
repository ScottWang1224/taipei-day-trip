/* =========================
   TapPay Config
========================== */

const TAPPAY_APP_ID = 171122;
const TAPPAY_APP_KEY =
  "app_bQ3NefrfvWFYELy5jbfDtRRBVTSEieaIjy90ynEXyw9seegcpHBz5UvyaJfT";

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
const contactPhone = document.querySelector("#contact-phone");

const confirmPrice = document.querySelector("#confirm-price");
const confirmPaymentButton = document.querySelector("#confirm-payment");

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
   TapPay Setup
========================== */

function setupTapPay() {
  if (typeof TPDirect === "undefined") {
    console.error("TapPay SDK 載入失敗");
    return;
  }

  TPDirect.setupSDK(TAPPAY_APP_ID, TAPPAY_APP_KEY, "sandbox");

  TPDirect.card.setup({
    fields: {
      number: {
        element: "#card-number",
        placeholder: "**** **** **** ****",
      },

      expirationDate: {
        element: "#card-expiration",
        placeholder: "MM / YY",
      },

      ccv: {
        element: "#card-cvv",
        placeholder: "CVV",
      },
    },

    styles: {
      input: {
        color: "#666666",
        "font-size": "16px",
      },

      ":focus": {
        color: "#666666",
      },

      ".valid": {
        color: "#666666",
      },

      ".invalid": {
        color: "#d9534f",
      },
    },
  });
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
   Validate Contact
========================== */

function validateContact() {
  const name = contactName.value.trim();
  const email = contactEmail.value.trim();
  const phone = contactPhone.value.trim();

  if (!name || !email || !phone) {
    alert("請完整填寫聯絡資訊");
    return false;
  }

  return true;
}

/* =========================
   Create Order
========================== */

async function createOrder(prime) {
  const requestBody = {
    prime: prime,

    order: {
      contact: {
        name: contactName.value.trim(),
        email: contactEmail.value.trim(),
        phone: contactPhone.value.trim(),
      },
    },
  };

  const response = await fetch("/api/orders", {
    method: "POST",

    headers: {
      ...getAuthorizationHeaders(),
      "Content-Type": "application/json",
    },

    body: JSON.stringify(requestBody),
  });

  const result = await response.json();

  if (response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/";

    return null;
  }

  if (!response.ok) {
    throw new Error(result.message || "建立訂單失敗");
  }

  return result;
}

/* =========================
   Confirm Payment
========================== */

function confirmPayment() {
  if (!validateContact()) {
    return;
  }

  const tappayStatus = TPDirect.card.getTappayFieldsStatus();

  if (!tappayStatus.canGetPrime) {
    alert("信用卡資料有誤，請重新確認");
    return;
  }

  confirmPaymentButton.disabled = true;
  confirmPaymentButton.textContent = "付款處理中...";

  TPDirect.card.getPrime(async (result) => {
    if (result.status !== 0) {
      console.error("取得 TapPay Prime 失敗：", result);

      alert(result.msg || "信用卡驗證失敗，請重新確認");

      confirmPaymentButton.disabled = false;
      confirmPaymentButton.textContent = "確認訂購並付款";

      return;
    }

    const prime = result.card.prime;

    try {
      const orderResult = await createOrder(prime);

      if (!orderResult) {
        return;
      }

      const orderNumber = orderResult.data?.number;

      const paymentStatus = orderResult.data?.payment?.status;

      const paymentMessage = orderResult.data?.payment?.message;

      if (paymentStatus === 0 && orderNumber) {
        window.location.href = `/thankyou?number=${encodeURIComponent(
          orderNumber,
        )}`;

        return;
      }

      alert(paymentMessage || "付款失敗，請稍後重新嘗試");
    } catch (error) {
      console.error("付款失敗：", error);

      alert(error.message || "付款失敗，請稍後重新嘗試");
    } finally {
      confirmPaymentButton.disabled = false;
      confirmPaymentButton.textContent = "確認訂購並付款";
    }
  });
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

confirmPaymentButton.addEventListener("click", confirmPayment);

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

  if (bookingResult.data) {
    setupTapPay();
  }
}

initializeBookingPage();
