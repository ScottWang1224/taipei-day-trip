const token = localStorage.getItem("token");

const hostField = document.querySelector("#mcp-host");
const tokenField = document.querySelector("#mcp-token");
const generateButton = document.querySelector("#generate-token-button");
const logoutButton = document.querySelector("#logout-button");

hostField.value = `${window.location.origin}/mcp/`;

async function loadMcpToken() {
  if (!token) {
    window.location.href = "/";
    return;
  }

  const response = await fetch("/api/token", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const result = await response.json();

  tokenField.value = result.data.token || "";
}

async function generateMcpToken() {
  const response = await fetch("/api/token", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return;
  }

  const result = await response.json();

  tokenField.value = result.data.token;
}

generateButton.addEventListener("click", generateMcpToken);

logoutButton.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "/";
});

loadMcpToken();
