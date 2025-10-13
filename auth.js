// auth.js
import { auth, provider } from "./firebase-init.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");
const message = document.getElementById("authMessage");

loginBtn.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    userInfo.textContent = `👤 ${user.displayName}`;
    message.textContent = `Вы вошли как ${user.email}`;
  } catch (error) {
    console.error(error);
    message.textContent = "Ошибка входа. Проверьте разрешённые домены.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  message.textContent = "Вы вышли из аккаунта.";
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    userInfo.textContent = `👤 ${user.displayName}`;
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
  }
});
