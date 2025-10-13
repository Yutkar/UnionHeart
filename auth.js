// auth.js
import { auth, provider } from "./firebase-init.js";
import { signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const userInfo = document.getElementById("userInfo");

// === Вход ===
loginBtn.addEventListener("click", () => {
  signInWithPopup(auth, provider)
    .then(result => {
      const user = result.user;
      userInfo.textContent = `👤 ${user.displayName}`;
      console.log("Вошёл:", user.email);
    })
    .catch(console.error);
});

// === Выход ===
logoutBtn.addEventListener("click", () => {
  signOut(auth);
});

// === Проверяем вход ===
onAuthStateChanged(auth, user => {
  if (user) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    userInfo.textContent = `👤 ${user.displayName}`;
  } else {
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    userInfo.textContent = "";
  }
});
