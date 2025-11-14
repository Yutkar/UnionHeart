import { db, auth } from "./firebase-init.js";
import { addDoc, collection, serverTimestamp } 
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

// ------- Функция сохранения результата игры -------
export async function saveScore(gameName, score) {
    const user = auth.currentUser;

    // Проверяем: авторизован ли пользователь
    if (!user) {
        console.warn("Игрок не авторизован — результат не записан.");
        return;
    }

    try {
        await addDoc(collection(db, "scores"), {
            userId: user.uid,
            userName: user.displayName || "Игрок",
            game: gameName,                 // название игры
            score: score,                   // очки
            date: serverTimestamp()         // серверная дата
        });

        console.log("Результат сохранён:", gameName, score);

    } catch (error) {
        console.error("Ошибка записи результата:", error);
    }
}
