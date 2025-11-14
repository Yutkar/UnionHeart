import { db } from "./firebase-init.js";
import { addDoc, collection, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ------- Функция сохранения результата игры -------
export async function saveScore(gameName, score) {
    // Если есть авторизованный пользователь — берём его данные
    let userId = "guest_" + Math.floor(Math.random() * 1000000); // случайный ID для гостя
    let userName = "Гость";

    try {
        // Если auth.currentUser существует, заменяем данные
        if (typeof auth !== "undefined" && auth.currentUser) {
            userId = auth.currentUser.uid;
            userName = auth.currentUser.displayName || "Игрок";
        }

        await addDoc(collection(db, "scores"), {
            userId: userId,
            userName: userName,
            game: gameName,    // название игры
            score: score,      // очки
            date: serverTimestamp() // серверная дата
        });

        console.log("Результат сохранён:", gameName, score, "Пользователь:", userName);

    } catch (error) {
        console.error("Ошибка записи результата:", error);
    }
}
