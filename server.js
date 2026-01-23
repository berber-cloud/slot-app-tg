const express = require('express');
const path = require('path');
const app = express();

// Порт Render предоставит автоматически
const PORT = process.env.PORT || 3000;

// Раздаем статические файлы (ваши html, css, js)
app.use(express.static(__dirname));

// Пример того, как вывести переменную в консоль сервера (для проверки)
console.log("Приложение запускается с API_KEY:", process.env.YOUR_VARIABLE_NAME);

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
