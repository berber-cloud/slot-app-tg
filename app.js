// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
if (tg && tg.expand) tg.expand();

// Конфигурация игры
const CONFIG = {
    symbols: [
        { emoji: '🍒', class: 'cherry', weight: 20 },
        { emoji: '🍋', class: 'lemon', weight: 18 },
        { emoji: '🍊', class: 'orange', weight: 16 },
        { emoji: '🍉', class: 'watermelon', weight: 14 },
        { emoji: '⭐', class: 'star', weight: 12 },
        { emoji: '🔔', class: 'bell', weight: 10 },
        { emoji: '💎', class: 'diamond', weight: 7 },
        { emoji: '🎰', class: 'seven', weight: 3 }
    ],
    payouts: {
        '🎰🎰🎰': 1000,  // Джекпот
        '💎💎💎': 500,
        '🔔🔔🔔': 200,
        '⭐⭐⭐': 100,
        '🍉🍉🍉': 50,
        '🍊🍊🍊': 30,
        '🍋🍋🍋': 20,
        '🍒🍒🍒': 10,
        // Комбинации с 2 одинаковыми символами
        '🎰🎰': 50,
        '💎💎': 40,
        '🔔🔔': 30,
        '⭐⭐': 25,
        '🍉🍉': 20,
        '🍊🍊': 15,
        '🍋🍋': 10,
        '🍒🍒': 5
    }
};

// Состояние игры
const state = {
    balance: 100,
    jackpots: 0,
    isSpinning: false,
    lastWin: 0,
    currentSymbols: ['🍒', '🍒', '🍒'],
    spinCount: 0,
    winCount: 0,
    loseStreak: 0
};

// DOM элементы
const elements = {
    balance: document.getElementById('balance'),
    jackpots: document.getElementById('jackpots'),
    spinButton: document.getElementById('spinButton'),
    winAmount: document.getElementById('winAmount'),
    winDisplay: document.getElementById('winDisplay'),
    reel1: document.getElementById('reel1'),
    reel2: document.getElementById('reel2'),
    reel3: document.getElementById('reel3'),
    addCoins: document.getElementById('addCoins'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    totalSpins: document.getElementById('totalSpins'),
    totalWins: document.getElementById('totalWins')
};

// Инициализация
function init() {
    loadGameState();
    initializeReels();
    updateUI();
    setupEventListeners();
}

// Загрузка состояния из localStorage
function loadGameState() {
    const savedBalance = localStorage.getItem('slotsBalance');
    const savedJackpots = localStorage.getItem('slotsJackpots');
    const savedSpinCount = localStorage.getItem('slotsSpinCount');
    const savedWinCount = localStorage.getItem('slotsWinCount');
    
    if (savedBalance) state.balance = parseInt(savedBalance);
    if (savedJackpots) state.jackpots = parseInt(savedJackpots);
    if (savedSpinCount) state.spinCount = parseInt(savedSpinCount);
    if (savedWinCount) state.winCount = parseInt(savedWinCount);
}

// Сохранение состояния в localStorage
function saveGameState() {
    localStorage.setItem('slotsBalance', state.balance.toString());
    localStorage.setItem('slotsJackpots', state.jackpots.toString());
    localStorage.setItem('slotsSpinCount', state.spinCount.toString());
    localStorage.setItem('slotsWinCount', state.winCount.toString());
}

// Инициализация барабанов
function initializeReels() {
    const reels = [elements.reel1, elements.reel2, elements.reel3];
    
    reels.forEach(reel => {
        reel.innerHTML = '';
        
        // Создаем 8 символов (двойной набор для плавности)
        for (let i = 0; i < 8; i++) {
            CONFIG.symbols.forEach(symbol => {
                const item = document.createElement('div');
                item.className = `slot-item ${symbol.class}`;
                item.textContent = symbol.emoji;
                item.dataset.symbol = symbol.emoji;
                reel.appendChild(item);
            });
        }
        
        // Устанавливаем начальную позицию (показываем вишни в середине)
        setReelToSymbol(reel, '🍒');
    });
}

// Установить барабан на конкретный символ
function setReelToSymbol(reel, symbol) {
    const symbolIndex = CONFIG.symbols.findIndex(s => s.emoji === symbol);
    if (symbolIndex === -1) return;
    
    const itemHeight = 60; // Высота одного символа
    const reelHeight = 180; // Высота окна слота
    
    // Центрируем символ в окне
    const offset = Math.floor((reelHeight / itemHeight) / 2) * itemHeight;
    const position = -(symbolIndex * itemHeight) + offset;
    
    reel.style.transform = `translateY(${position}px)`;
}

// Обновление UI
function updateUI() {
    elements.balance.textContent = state.balance;
    elements.jackpots.textContent = state.jackpots;
    elements.winAmount.textContent = state.lastWin;
    
    if (elements.totalSpins) {
        elements.totalSpins.textContent = state.spinCount;
    }
    if (elements.totalWins) {
        elements.totalWins.textContent = state.winCount;
    }
    
    // Показываем/скрываем дисплей выигрыша
    elements.winDisplay.style.display = state.lastWin > 0 ? 'flex' : 'none';
}

// Показ уведомления
function showNotification(message, duration = 3000) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, duration);
}

// Получить случайный символ с учетом весов
function getRandomSymbol() {
    const totalWeight = CONFIG.symbols.reduce((sum, symbol) => sum + symbol.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const symbol of CONFIG.symbols) {
        if (random < symbol.weight) {
            return symbol.emoji;
        }
        random -= symbol.weight;
    }
    
    return CONFIG.symbols[0].emoji;
}

// Генерация результатов сбалансированно
function generateResults() {
    state.spinCount++;
    
    // Каждый 5-8 спин увеличиваем шансы на выигрыш
    const shouldIncreaseWinChance = state.loseStreak >= 3 || (state.spinCount % 6 === 0);
    
    let results = [];
    
    if (shouldIncreaseWinChance) {
        // Генерируем выигрышную комбинацию
        const winType = Math.random();
        
        if (winType < 0.3) {
            // 3 одинаковых символа (кроме джекпота если мало спинов)
            let availableSymbols = CONFIG.symbols;
            if (state.spinCount < 20) {
                availableSymbols = CONFIG.symbols.filter(s => s.emoji !== '🎰');
            }
            const symbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
            results = [symbol.emoji, symbol.emoji, symbol.emoji];
        } else if (winType < 0.7) {
            // 2 одинаковых символа
            const symbol = CONFIG.symbols[Math.floor(Math.random() * CONFIG.symbols.length)];
            const position = Math.floor(Math.random() * 3); // 0, 1, или 2
            
            results = [
                position === 0 ? symbol.emoji : getRandomSymbol(),
                position === 1 ? symbol.emoji : getRandomSymbol(),
                position === 2 ? symbol.emoji : getRandomSymbol()
            ];
            
            // Гарантируем, что хотя бы 2 одинаковых
            if (position === 0) results[1] = symbol.emoji;
            else if (position === 1) results[2] = symbol.emoji;
            else results[0] = symbol.emoji;
        } else {
            // Случайная комбинация с увеличенными шансами на совпадение
            const firstSymbol = getRandomSymbol();
            const secondSymbol = Math.random() < 0.4 ? firstSymbol : getRandomSymbol();
            const thirdSymbol = Math.random() < 0.3 ? firstSymbol : getRandomSymbol();
            
            results = [firstSymbol, secondSymbol, thirdSymbol];
        }
        
        // Сбрасываем счетчик проигрышей
        state.loseStreak = 0;
    } else {
        // Обычная случайная генерация
        for (let i = 0; i < 3; i++) {
            results.push(getRandomSymbol());
        }
        
        // Небольшой шанс на случайное совпадение
        if (Math.random() < 0.15 && results[0] === results[1]) {
            results[2] = results[0];
        }
    }
    
    return results;
}

// Анимация вращения барабана
async function spinReel(reel, finalSymbol, reelIndex) {
    return new Promise(resolve => {
        const duration = 2000 + (reelIndex * 200); // Разная длительность для каждого барабана
        const itemHeight = 60;
        const symbolIndex = CONFIG.symbols.findIndex(s => s.emoji === finalSymbol);
        
        // Текущая позиция барабана
        const currentTransform = reel.style.transform || 'translateY(0px)';
        const currentY = parseInt(currentTransform.match(/translateY\(([-\d]+)px\)/)[1]) || 0;
        
        // Целевая позиция (центрируем символ)
        const reelHeight = 180;
        const offset = Math.floor((reelHeight / itemHeight) / 2) * itemHeight;
        const targetY = -(symbolIndex * itemHeight) + offset;
        
        // Для плавного вращения создаем "виртуальный" прокрут
        const totalDistance = Math.abs(currentY - targetY) + (20 * itemHeight); // Добавляем несколько лишних оборотов
        const startTime = Date.now();
        
        function animate() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Кривая замедления
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            // Вычисляем текущую позицию
            let currentDistance = totalDistance * easeOut;
            let newY = currentY - currentDistance;
            
            // Нормализуем позицию (зацикливаем)
            const totalSymbols = CONFIG.symbols.length * 8; // Всего символов в барабане
            const maxY = -totalSymbols * itemHeight;
            
            if (newY < maxY) {
                newY = 0;
            }
            
            reel.style.transform = `translateY(${newY}px)`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Финальная позиция
                reel.style.transform = `translateY(${targetY}px)`;
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

// Проверка выигрышной комбинации
function checkWin(results) {
    let winAmount = 0;
    let winType = '';
    
    // Проверяем 3 одинаковых символа
    if (results[0] === results[1] && results[1] === results[2]) {
        const key = results[0] + results[1] + results[2];
        winAmount = CONFIG.payouts[key] || 0;
        winType = 'triple';
    } 
    // Проверяем 2 одинаковых символа (разные варианты)
    else {
        const combinations = [
            { symbols: [results[0], results[1]], key: results[0] + results[1] }, // Первые два
            { symbols: [results[1], results[2]], key: results[1] + results[2] }, // Последние два
            { symbols: [results[0], results[2]], key: results[0] + results[2] }  // Первый и третий
        ];
        
        for (const combo of combinations) {
            if (combo.symbols[0] === combo.symbols[1]) {
                const amount = CONFIG.payouts[combo.key] || 0;
                if (amount > winAmount) {
                    winAmount = amount;
                    winType = 'double';
                }
            }
        }
    }
    
    return { amount: winAmount, type: winType };
}

// Основная функция вращения
async function spin() {
    if (state.isSpinning) return;
    
    if (state.balance <= 0) {
        showNotification('Недостаточно звёзд! Добавьте ещё.', 2000);
        return;
    }
    
    state.isSpinning = true;
    state.lastWin = 0;
    elements.spinButton.disabled = true;
    updateUI();
    
    // Генерируем результаты
    const newSymbols = generateResults();
    state.currentSymbols = newSymbols;
    
    try {
        // Запускаем вращение всех барабанов
        await Promise.all([
            spinReel(elements.reel1, newSymbols[0], 0),
            spinReel(elements.reel2, newSymbols[1], 1),
            spinReel(elements.reel3, newSymbols[2], 2)
        ]);
        
        // Проверяем выигрыш
        const winResult = checkWin(newSymbols);
        
        if (winResult.amount > 0) {
            state.lastWin = winResult.amount;
            state.balance += winResult.amount;
            state.winCount++;
            state.loseStreak = 0;
            
            // Показываем соответствующее уведомление
            if (winResult.type === 'triple') {
                if (newSymbols[0] === '🎰') {
                    state.jackpots++;
                    showNotification(`🎉 ДЖЕКПОТ! +${winResult.amount} звёзд! 🎉`, 5000);
                    
                    // Анимация джекпота
                    const reels = [elements.reel1, elements.reel2, elements.reel3];
                    reels.forEach(reel => {
                        reel.classList.add('winning-combo');
                    });
                    
                    setTimeout(() => {
                        reels.forEach(reel => {
                            reel.classList.remove('winning-combo');
                        });
                    }, 3000);
                } else {
                    showNotification(`🎊 Три в ряд! +${winResult.amount} звёзд!`, 3000);
                }
            } else if (winResult.type === 'double') {
                // Определяем, какие именно символы совпали
                let matchType = '';
                if (newSymbols[0] === newSymbols[1]) matchType = 'первые два';
                else if (newSymbols[1] === newSymbols[2]) matchType = 'последние два';
                else if (newSymbols[0] === newSymbols[2]) matchType = 'крайние';
                
                showNotification(`🎯 Два одинаковых (${matchType})! +${winResult.amount} звёзд!`, 3000);
            }
            
            // Анимация выигрыша
            elements.winDisplay.classList.add('win-animation');
            setTimeout(() => {
                elements.winDisplay.classList.remove('win-animation');
            }, 1500);
        } else {
            state.loseStreak++;
            showNotification('Повезёт в следующий раз!', 2000);
        }
        
    } catch (error) {
        console.error('Spin error:', error);
        showNotification('Ошибка вращения', 2000);
    } finally {
        // Сбрасываем состояние
        state.isSpinning = false;
        elements.spinButton.disabled = false;
        updateUI();
        saveGameState();
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    elements.spinButton.addEventListener('click', spin);
    
    elements.addCoins.addEventListener('click', () => {
        state.balance += 100;
        updateUI();
        saveGameState();
        showNotification('+100 звёзд добавлено!', 2000);
    });
    
    // Анимация при наведении на кнопку спины
    elements.spinButton.addEventListener('mouseenter', () => {
        if (!state.isSpinning) {
            elements.spinButton.style.transform = 'scale(1.05)';
        }
    });
    
    elements.spinButton.addEventListener('mouseleave', () => {
        elements.spinButton.style.transform = 'scale(1)';
    });
    
    // Обработчик для Telegram кнопки "назад"
    if (tg && tg.BackButton) {
        tg.BackButton.onClick(() => {
            tg.close();
        });
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', init);