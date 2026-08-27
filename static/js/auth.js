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

/* =========================
   Dialog
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

checkSignInStatus();
