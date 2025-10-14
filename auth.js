// auth.js
import { auth } from "./firebase-init.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

// === Инициализация провайдера Google ===
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const authMessage = document.getElementById("authMessage");

// === Вход через Google (popup) ===
loginBtn.addEventListener("click", async () => {
  try {
    authMessage.textContent = "Открывается окно входа...";
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    userInfo.textContent = `👤 ${user.displayName}`;
    authMessage.textContent = "Вы успешно вошли через Google ✅";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } catch (error) {
    console.error("Ошибка входа:", error);
    authMessage.textContent = "Ошибка при входе. Проверьте разрешённые домены в Firebase.";
  }
});

// === Проверка состояния авторизации ===
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
