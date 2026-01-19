const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Инициализация базы данных
const db = new sqlite3.Database(':memory:'); // Используем SQLite в памяти (для демо)
// Для продакшена используйте файловую БД: new sqlite3.Database('database.db')

// Создание таблиц
db.serialize(() => {
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        photo_url TEXT,
        language_code TEXT,
        balance INTEGER DEFAULT 100,
        coins INTEGER DEFAULT 0,
        spin_count INTEGER DEFAULT 0,
        win_count INTEGER DEFAULT 0,
        jackpots INTEGER DEFAULT 0,
        gifts TEXT DEFAULT '[]',
        join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Таблица транзакций (опционально)
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        type TEXT,
        amount INTEGER,
        currency TEXT,
        status TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`);
});

// API Endpoints

// Инициализация/регистрация пользователя
app.post('/api/user/init', (req, res) => {
    const { id, username, first_name, last_name, photo_url, language_code } = req.body;
    
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, existingUser) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (existingUser) {
            // Пользователь уже существует
            return res.json({ success: true, user: existingUser });
        } else {
            // Создаем нового пользователя
            const newUser = {
                id,
                username: username || 'Гость',
                first_name,
                last_name,
                photo_url,
                language_code,
                balance: 100,
                coins: 0,
                spin_count: 0,
                win_count: 0,
                jackpots: 0,
                gifts: '[]',
                join_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            db.run(
                `INSERT INTO users (
                    id, username, first_name, last_name, photo_url, language_code,
                    balance, coins, spin_count, win_count, jackpots, gifts, join_date, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    newUser.id,
                    newUser.username,
                    newUser.first_name,
                    newUser.last_name,
                    newUser.photo_url,
                    newUser.language_code,
                    newUser.balance,
                    newUser.coins,
                    newUser.spin_count,
                    newUser.win_count,
                    newUser.jackpots,
                    newUser.gifts,
                    newUser.join_date,
                    newUser.updated_at
                ],
                function(err) {
                    if (err) {
                        return res.status(500).json({ success: false, error: err.message });
                    }
                    res.json({ success: true, user: newUser });
                }
            );
        }
    });
});

// Получение пользователя по ID
app.get('/api/user/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (user) {
            // Парсим JSON поля
            try {
                user.gifts = JSON.parse(user.gifts);
            } catch {
                user.gifts = [];
            }
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
    });
});

// Обновление баланса
app.post('/api/user/:id/balance', (req, res) => {
    const { id } = req.params;
    const { stars = 0, coins = 0 } = req.body;
    
    db.get('SELECT balance, coins FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        const newBalance = Math.max(0, user.balance + stars);
        const newCoins = Math.max(0, user.coins + coins);
        
        db.run(
            'UPDATE users SET balance = ?, coins = ?, updated_at = ? WHERE id = ?',
            [newBalance, newCoins, new Date().toISOString(), id],
            function(err) {
                if (err) {
                    return res.status(500).json({ success: false, error: err.message });
                }
                
                // Логируем транзакцию
                if (stars !== 0) {
                    db.run(
                        'INSERT INTO transactions (user_id, type, amount, currency, status) VALUES (?, ?, ?, ?, ?)',
                        [id, stars > 0 ? 'deposit' : 'withdraw', Math.abs(stars), 'stars', 'completed']
                    );
                }
                
                if (coins !== 0) {
                    db.run(
                        'INSERT INTO transactions (user_id, type, amount, currency, status) VALUES (?, ?, ?, ?, ?)',
                        [id, coins > 0 ? 'deposit' : 'withdraw', Math.abs(coins), 'coins', 'completed']
                    );
                }
                
                res.json({ 
                    success: true, 
                    balance: newBalance, 
                    coins: newCoins 
                });
            }
        );
    });
});

// Обновление статистики
app.post('/api/user/:id/stats', (req, res) => {
    const { id } = req.params;
    const { spin_count = 0, win_count = 0, jackpots = 0 } = req.body;
    
    db.get('SELECT spin_count, win_count, jackpots FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        const newSpinCount = user.spin_count + spin_count;
        const newWinCount = user.win_count + win_count;
        const newJackpots = user.jackpots + jackpots;
        
        db.run(
            'UPDATE users SET spin_count = ?, win_count = ?, jackpots = ?, updated_at = ? WHERE id = ?',
            [newSpinCount, newWinCount, newJackpots, new Date().toISOString(), id],
            function(err) {
                if (err) {
                    return res.status(500).json({ success: false, error: err.message });
                }
                res.json({ 
                    success: true, 
                    spin_count: newSpinCount, 
                    win_count: newWinCount, 
                    jackpots: newJackpots 
                });
            }
        );
    });
});

// Покупка подарка
app.post('/api/user/:id/gifts', (req, res) => {
    const { id } = req.params;
    const { gift_id } = req.body;
    
    if (!gift_id) {
        return res.status(400).json({ success: false, error: 'Не указан ID подарка' });
    }
    
    db.get('SELECT gifts FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        
        let gifts;
        try {
            gifts = JSON.parse(user.gifts);
        } catch {
            gifts = [];
        }
        
        // Проверяем, не куплен ли уже подарок
        if (gifts.some(gift => gift.id === gift_id)) {
            return res.status(400).json({ success: false, error: 'Подарок уже куплен' });
        }
        
        // Добавляем подарок
        gifts.push({
            id: gift_id,
            purchased_at: new Date().toISOString()
        });
        
        db.run(
            'UPDATE users SET gifts = ?, updated_at = ? WHERE id = ?',
            [JSON.stringify(gifts), new Date().toISOString(), id],
            function(err) {
                if (err) {
                    return res.status(500).json({ success: false, error: err.message });
                }
                res.json({ success: true, gifts: gifts });
            }
        );
    });
});

// Получение списка подарков
app.get('/api/gifts', (req, res) => {
    const gifts = [
        {
            id: 'gift_1',
            emoji: '🥃',
            name: 'Пузырь самогона',
            description: '50 грамм (рюмка) самогона для настоящих мужчин',
            price: 5,
            currency: 'coins',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_2',
            emoji: '🚬',
            name: 'Марльборо',
            description: 'Пачка сигарет для создания дымной завесы',
            price: 10,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_3',
            emoji: '💪',
            name: 'Протеин',
            description: 'Банка протеина для наращивания мышц',
            price: 15,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_4',
            emoji: '💉',
            name: 'Тренболон ацетат',
            description: 'Ампула для настоящих качков',
            price: 20,
            currency: 'coins',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_5',
            emoji: '🔥',
            name: 'Зажигалка',
            description: 'Зажигалка для поджигания отношений',
            price: 8,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_6',
            emoji: '🧪',
            name: 'Колба химика',
            description: 'Пустая колба для экспериментов',
            price: 12,
            currency: 'stars',
            category: 'Набор юного химика'
        },
        {
            id: 'gift_7',
            emoji: '🧫',
            name: 'Пробирка',
            description: 'Пробирка для хранения веществ',
            price: 7,
            currency: 'stars',
            category: 'Набор юного химика'
        }
    ];
    
    res.json({ success: true, gifts });
});

// Обслуживание статических файлов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`API доступно по адресу: http://localhost:${PORT}/api`);
});