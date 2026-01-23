const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

// Функция для вставки переменных в любой HTML файл
function sendHtmlWithConfig(req, res, fileName) {
    const filePath = path.join(__dirname, fileName);
    if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

    let html = fs.readFileSync(filePath, 'utf8');
    
    // Вставляем скрипт с переменными ДО всех остальных скриптов
    const configScript = `
    <script>
        window.RENDER_CONFIG = {
            SUPABASE_ANON_KEY: "${process.env.API_KEY || ''}",
            SUPABASE_URL: "${process.env.DB_URL || ''}"
        };
    </script>`;
    
    html = html.replace('<head>', '<head>' + configScript);
    res.send(html);
}

// Обработка главной и других страниц
app.get('/', (req, res) => sendHtmlWithConfig(req, res, 'index.html'));
app.get('/:page.html', (req, res) => sendHtmlWithConfig(req, res, req.params.page + '.html'));

app.listen(PORT, () => console.log(`Server running`));
