// auth.js
import { auth } from "./firebase-init.js";
import {
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// === Инициализация провайдера ===
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const authMessage = document.getElementById("authMessage");

// === Вход через redirect ===
loginBtn.addEventListener("click", () => {
  authMessage.textContent = "Открывается окно входа...";
  signInWithRedirect(auth, provider);
});

// === Проверяем результат входа после возврата ===
getRedirectResult(auth)
  .then((result) => {
    if (result && result.user) {
      const user = result.user;
      userInfo.textContent = `👤 ${user.displayName}`;
      authMessage.textContent = "Вы вошли через Google ✅";
      loginBtn.style.display = "none";
      logoutBtn.style.display = "inline-block";
    }
  })
  .catch((error) => {
    console.error("Ошибка входа:", error);
    authMessage.textContent = "Ошибка при входе. Проверь разрешённые домены.";
  });

// === Проверяем состояние при загрузке ===
onAuthStateChanged(auth, (user) => {
  if (user) {
    userInfo.textContent = `👤 ${user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    authMessage.textContent = "Вы вошли ✅";
  } else {
    userInfo.textContent = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    authMessage.textContent = "Вы не вошли.";
  }
});

// === Выход ===
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  userInfo.textContent = "";
  authMessage.textContent = "Вы вышли из аккаунта.";
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
});
