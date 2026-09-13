/* =========================
   DOM
========================== */

const orderNumberElement = document.querySelector("#order-number");

const memberAction = document.querySelector("#member-action");

/* =========================
   Token
========================== */

function getToken() {
  return localStorage.getItem("token");
}

/* =========================
   Order Number
========================== */

function renderOrderNumber() {
  const params = new URLSearchParams(window.location.search);

  const orderNumber = params.get("number");

  if (!orderNumber) {
    orderNumberElement.textContent = "查無訂單編號";

    return;
  }

  orderNumberElement.textContent = orderNumber;
}

/* =========================
   Member Action
========================== */

function setupMemberAction() {
  const token = getToken();

  if (token) {
    memberAction.textContent = "登出系統";

    memberAction.addEventListener("click", (event) => {
      event.preventDefault();

      localStorage.removeItem("token");

      window.location.href = "/";
    });

    return;
  }

  memberAction.textContent = "登入/註冊";

  memberAction.addEventListener("click", (event) => {
    event.preventDefault();

    window.location.href = "/";
  });
}

/* =========================
   Initialize
========================== */

renderOrderNumber();
setupMemberAction();
