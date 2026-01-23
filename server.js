const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Это "магия", которая заставляет сервер отдавать все файлы из гит-репозитория
app.use(express.static(path.join(__dirname)));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Пример API-маршрута, чтобы ваш JS-файл мог получить ключи от БД безопасно
app.get('/api/config', (req, res) => {
    res.json({
        dbUrl: process.env.DATABASE_URL, // Переменная с Render
        apiKey: process.env.API_KEY      // Переменная с Render
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});

