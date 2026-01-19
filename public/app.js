// app.js - С исправленной статистикой
// Отладка Telegram
if (window.Telegram && window.Telegram.WebApp) {
    console.log('=== TELEGRAM DEBUG ===');
    const tg = window.Telegram.WebApp;
    console.log('Telegram WebApp version:', tg.version);
    console.log('Telegram user:', tg.initDataUnsafe?.user);
    console.log('Telegram user ID:', tg.initDataUnsafe?.user?.id);
    console.log('=====================');
    
    // Расширяем окно и показываем интерфейс
    tg.expand();
    tg.ready();
}
// Конфигурация игры
const CONFIG = {
    symbols: ['🍒', '🍋', '🍊', '🍉', '⭐', '🔔', '💎', '🎰'],
    probabilities: {
        '🍒': 0.18,
        '🍋': 0.16,
        '🍊': 0.14,
        '🍉': 0.12,
        '⭐': 0.10,
        '🔔': 0.10,
        '💎': 0.10,
        '🎰': 0.10
    },
    payouts: {
        '🎰🎰🎰': 1000,
        '💎💎💎': 500,
        '🔔🔔🔔': 200,
        '⭐⭐⭐': 100,
        '🍉🍉🍉': 50,
        '🍊🍊🍊': 30,
        '🍋🍋🍋': 20,
        '🍒🍒🍒': 10,
        // Добавляем выигрыши за 2 символа
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
    coins: 0,
    jackpots: 0,
    isSpinning: false,
    lastWin: 0,
    spinCount: 0,
    winCount: 0,
    currentSymbols: ['🍒', '🍒', '🍒']
};

// DOM элементы
const elements = {
    balance: document.getElementById('balance'),
    coins: document.getElementById('coins'),
    jackpots: document.getElementById('jackpots'),
    spinButton: document.getElementById('spinButton'),
    winAmount: document.getElementById('winAmount'),
    winDisplay: document.getElementById('winDisplay'),
    reel1: document.getElementById('reel1'),
    reel2: document.getElementById('reel2'),
    reel3: document.getElementById('reel3'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText'),
    totalSpins: document.getElementById('totalSpins'),
    totalWins: document.getElementById('totalWins'),
    winRate: document.getElementById('winRate')
};

// Инициализация
function init() {
    console.log('Инициализация игры...');
    loadGameState();
    updateUI();
    initializeReels();
    setupEventListeners();
    loadUserData();
}

// Загрузка состояния из localStorage
function loadGameState() {
    try {
        // Проверяем, есть ли данные в localStorage
        const savedState = localStorage.getItem('gameState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            Object.assign(state, parsed);
        }
        
        // Для обратной совместимости с старым форматом
        const savedBalance = localStorage.getItem('slotsBalance');
        const savedCoins = localStorage.getItem('slotsCoins');
        const savedJackpots = localStorage.getItem('slotsJackpots');
        const savedSpinCount = localStorage.getItem('slotsSpinCount');
        const savedWinCount = localStorage.getItem('slotsWinCount');
        
        if (savedBalance !== null) state.balance = parseInt(savedBalance) || 100;
        if (savedCoins !== null) state.coins = parseInt(savedCoins) || 0;
        if (savedJackpots !== null) state.jackpots = parseInt(savedJackpots) || 0;
        if (savedSpinCount !== null) state.spinCount = parseInt(savedSpinCount) || 0;
        if (savedWinCount !== null) state.winCount = parseInt(savedWinCount) || 0;
        
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
    }
}

// Сохранение состояния в localStorage
function saveGameState() {
    try {
        // Сохраняем полное состояние
        localStorage.setItem('gameState', JSON.stringify(state));
        
        // Также сохраняем для обратной совместимости
        localStorage.setItem('slotsBalance', state.balance.toString());
        localStorage.setItem('slotsCoins', state.coins.toString());
        localStorage.setItem('slotsJackpots', state.jackpots.toString());
        localStorage.setItem('slotsSpinCount', state.spinCount.toString());
        localStorage.setItem('slotsWinCount', state.winCount.toString());
    } catch (error) {
        console.error('Ошибка сохранения в localStorage:', error);
    }
}

// Загрузка данных пользователя из API
async function loadUserData() {
    try {
        // Пытаемся получить Telegram пользователя
        let telegramUser = null;
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            telegramUser = tg.initDataUnsafe?.user;
        }
        
        if (telegramUser && typeof Api !== 'undefined') {
            console.log('Telegram пользователь найден:', telegramUser);
            
            // 1. Инициализируем/получаем пользователя
            const initResult = await Api.initUser({
                id: telegramUser.id.toString(),
                username: telegramUser.username || 'Гость',
                first_name: telegramUser.first_name || '',
                last_name: telegramUser.last_name || '',
                photo_url: telegramUser.photo_url || ''
            });
            
            if (initResult.success) {
                const dbUser = initResult.user;
                console.log('Пользователь из БД:', dbUser);
                
                // 2. Синхронизируем локальные данные с БД
                // Если в БД статистика больше - используем её
                if (dbUser.spin_count > state.spinCount) {
                    state.spinCount = dbUser.spin_count;
                }
                if (dbUser.win_count > state.winCount) {
                    state.winCount = dbUser.win_count;
                }
                if (dbUser.jackpots > state.jackpots) {
                    state.jackpots = dbUser.jackpots;
                }
                
                // 3. Обновляем баланс из БД
                state.balance = dbUser.balance || state.balance;
                state.coins = dbUser.coins || state.coins;
                
                // 4. Сохраняем синхронизированные данные
                saveGameState();
                
                // 5. Устанавливаем глобальную переменную
                if (window.currentTelegramUser === null) {
                    window.currentTelegramUser = dbUser;
                }
            }
        } else {
            console.log('Telegram WebApp не обнаружен, используем локальные данные');
        }
        
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
        // Используем локальные данные как fallback
    }
    
    updateUI();
}

// Инициализация барабанов
function initializeReels() {
    const reels = [elements.reel1, elements.reel2, elements.reel3];
    
    // Проверяем, существуют ли элементы
    if (!reels[0] || !reels[1] || !reels[2]) {
        console.error('Элементы барабанов не найдены!');
        return;
    }
    
    reels.forEach((reel, index) => {
        // Очищаем барабан
        reel.innerHTML = '';
        
        // Создаем 3 копии каждого символа
        for (let copy = 0; copy < 3; copy++) {
            CONFIG.symbols.forEach(symbol => {
                const item = document.createElement('div');
                item.className = 'slot-item';
                item.textContent = symbol;
                
                // Добавляем класс для цвета
                if (symbol === '🍒') item.classList.add('cherry');
                else if (symbol === '🍋') item.classList.add('lemon');
                else if (symbol === '🍊') item.classList.add('orange');
                else if (symbol === '🍉') item.classList.add('watermelon');
                else if (symbol === '⭐') item.classList.add('star');
                else if (symbol === '🔔') item.classList.add('bell');
                else if (symbol === '💎') item.classList.add('diamond');
                else if (symbol === '🎰') item.classList.add('seven');
                
                reel.appendChild(item);
            });
        }
        
        // Устанавливаем начальную позицию
        setReelPosition(reel, index);
    });
}

// Установка позиции барабана
function setReelPosition(reel, reelIndex) {
    const symbol = state.currentSymbols[reelIndex] || '🍒';
    const symbolIndex = CONFIG.symbols.indexOf(symbol);
    if (symbolIndex === -1) return;
    
    const itemHeight = 60;
    const reelHeight = 180;
    const offset = Math.floor((reelHeight / itemHeight) / 2) * itemHeight;
    const position = -(symbolIndex * itemHeight) + offset;
    
    reel.style.transform = `translateY(${position}px)`;
    reel.style.transition = 'none';
    reel.offsetHeight;
}

// Обновление UI
function updateUI() {
    if (elements.balance) elements.balance.textContent = state.balance;
    if (elements.coins) elements.coins.textContent = state.coins;
    if (elements.jackpots) elements.jackpots.textContent = state.jackpots;
    if (elements.winAmount) elements.winAmount.textContent = state.lastWin;
    if (elements.totalSpins) elements.totalSpins.textContent = state.spinCount;
    if (elements.totalWins) elements.totalWins.textContent = state.winCount;
    
    // Рассчитываем процент побед
    if (elements.winRate) {
        const winRate = state.spinCount > 0 ? 
            Math.round((state.winCount / state.spinCount) * 100) : 0;
        elements.winRate.textContent = `${winRate}%`;
    }
    
    // Показываем/скрываем дисплей выигрыша
    if (elements.winDisplay) {
        elements.winDisplay.style.display = state.lastWin > 0 ? 'flex' : 'none';
    }
    
    // Обновляем состояние кнопки
    if (elements.spinButton) {
        elements.spinButton.disabled = state.isSpinning || state.balance <= 0;
    }
}

// Показ уведомления
function showNotification(message, duration = 3000) {
    if (!elements.notification || !elements.notificationText) return;
    
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, duration);
}

// Генерация случайного символа
function getRandomSymbol() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const [symbol, probability] of Object.entries(CONFIG.probabilities)) {
        cumulative += probability;
        if (rand <= cumulative) {
            return symbol;
        }
    }
    
    return '🍒';
}

// Анимация вращения барабана
function spinReel(reel, finalSymbol, delay = 0) {
    return new Promise(resolve => {
        setTimeout(() => {
            const duration = 2000;
            const itemHeight = 60;
            const symbolIndex = CONFIG.symbols.indexOf(finalSymbol);
            
            const reelHeight = 180;
            const offset = Math.floor((reelHeight / itemHeight) / 2) * itemHeight;
            const targetY = -(symbolIndex * itemHeight) + offset;
            
            const currentTransform = reel.style.transform || 'translateY(0px)';
            const match = currentTransform.match(/translateY\(([-\d]+)px\)/);
            const currentY = match ? parseInt(match[1]) : 0;
            
            const extraSpins = 5;
            const extraDistance = extraSpins * CONFIG.symbols.length * itemHeight;
            
            reel.style.transition = 'none';
            reel.style.transform = `translateY(${currentY - extraDistance}px)`;
            reel.offsetHeight;
            
            reel.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.3, 1)`;
            reel.style.transform = `translateY(${targetY}px)`;
            
            setTimeout(() => {
                resolve();
            }, duration);
        }, delay);
    });
}

// Обновление статистики
async function updateGameStats(spinIncrement = 0, winIncrement = 0, jackpotIncrement = 0) {
    console.log('Обновление статистики:', { spinIncrement, winIncrement, jackpotIncrement });
    
    // 1. Обновляем локальную статистику
    state.spinCount += spinIncrement;
    state.winCount += winIncrement;
    state.jackpots += jackpotIncrement;
    
    // 2. Сохраняем локально
    saveGameState();
    updateUI();
    
    // 3. Обновляем через API если доступно
    try {
        if (typeof Api !== 'undefined' && Api.updateStats) {
            const user = Api.getCurrentUser();
            
            if (user && user.id) {
                console.log('Обновление статистики для пользователя ID:', user.id);
                
                // ВАЖНО: передаем ВНУТРЕННИЙ ID пользователя (UUID из БД)
                const result = await Api.updateStats(user.id, spinIncrement, winIncrement, jackpotIncrement);
                
                if (result.success) {
                    console.log('✅ Статистика обновлена в БД:', result.user);
                } else {
                    console.error('❌ Ошибка обновления статистики:', result.error);
                }
            } else {
                console.log('⚠️ Пользователь не найден для обновления статистики');
            }
        }
    } catch (error) {
        console.log('API обновление не удалось:', error);
    }
}

// Отладочная функция для проверки
function debugUserInfo() {
    const user = Api.getCurrentUser();
    console.log('=== DEBUG USER INFO ===');
    console.log('User from Api:', user);
    console.log('User ID:', user?.id);
    console.log('Telegram ID:', user?.telegram_id);
    console.log('Balance:', user?.balance);
    console.log('Stats:', { 
        spins: user?.spin_count, 
        wins: user?.win_count, 
        jackpots: user?.jackpots 
    });
    console.log('========================');
}

// Вызовите где-нибудь для проверки
debugUserInfo();

// Основная функция вращения
async function spin() {
    if (state.isSpinning) return;
    
    if (state.balance <= 0) {
        showNotification('Недостаточно звёзд! Пополните баланс.', 2000);
        return;
    }
    
    state.isSpinning = true;
    state.lastWin = 0;
    
    if (elements.spinButton) {
        elements.spinButton.disabled = true;
    }
    
    updateUI();
    
    // Вычитаем 1 звезду за спин
    state.balance -= 1;
    
    try {
        // Обновляем баланс через API если доступно
        try {
            if (typeof Api !== 'undefined' && Api.updateBalance) {
                const user = Api.getCurrentUser();
                if (user) {
                    await Api.updateBalance(user.id, -1, 0);
                }
            }
        } catch (apiError) {
            console.log('API обновление не удалось');
        }
        
        // Генерируем новые символы
        const newSymbols = [
            getRandomSymbol(),
            getRandomSymbol(),
            getRandomSymbol()
        ];
        
        state.currentSymbols = newSymbols;
        
        // Запускаем вращение барабанов
        await Promise.all([
            spinReel(elements.reel1, newSymbols[0], 0),
            spinReel(elements.reel2, newSymbols[1], 200),
            spinReel(elements.reel3, newSymbols[2], 400)
        ]);
        
        // Проверяем выигрыш
        const winResult = checkWin(newSymbols);
        
        if (winResult.amount > 0) {
            state.lastWin = winResult.amount;
            state.balance += winResult.amount;
            
            // Обновляем статистику - ВЫИГРЫШ
            const jackpotIncrement = (winResult.type === 'triple' && newSymbols[0] === '🎰') ? 1 : 0;
            await updateGameStats(1, 1, jackpotIncrement); // spinCount +1, winCount +1
            
            // Обновляем баланс через API
            try {
                if (typeof Api !== 'undefined' && Api.updateBalance) {
                    const user = Api.getCurrentUser();
                    if (user) {
                        await Api.updateBalance(user.id, winResult.amount, 0);
                    }
                }
            } catch (apiError) {
                console.log('API обновление выигрыша не удалось');
            }
            
            // Уведомление
            if (winResult.type === 'triple' && newSymbols[0] === '🎰') {
                showNotification(`🎉 ДЖЕКПОТ! +${winResult.amount} звёзд! 🎉`, 5000);
            } else if (winResult.type === 'triple') {
                showNotification(`🎊 Три в ряд! +${winResult.amount} звёзд!`, 3000);
            } else {
                showNotification(`🎯 Два одинаковых! +${winResult.amount} звёзд!`, 3000);
            }
            
            // Анимация выигрыша
            if (elements.winDisplay) {
                elements.winDisplay.classList.add('win-animation');
                setTimeout(() => {
                    elements.winDisplay.classList.remove('win-animation');
                }, 1500);
            }
        } else {
            // Проигрыш - обновляем только счетчик спинов
            await updateGameStats(1, 0, 0); // spinCount +1
            showNotification('Повезёт в следующий раз!', 2000);
        }
        
    } catch (error) {
        console.error('Ошибка вращения:', error);
        showNotification('Ошибка вращения', 2000);
    } finally {
        // Сбрасываем состояние
        state.isSpinning = false;
        
        if (elements.spinButton) {
            elements.spinButton.disabled = false;
        }
        
        updateUI();
        saveGameState();
    }
}

// Проверка выигрышной комбинации
function checkWin(results) {
    const combination = results.join('');
    let winAmount = 0;
    let winType = '';
    
    // Проверяем 3 одинаковых символа
    if (results[0] === results[1] && results[1] === results[2]) {
        const key = results[0] + results[1] + results[2];
        winAmount = CONFIG.payouts[key] || 0;
        winType = 'triple';
    } 
    // Проверяем 2 одинаковых символа
    else {
        // Проверяем первые два
        if (results[0] === results[1]) {
            const key = results[0] + results[1];
            winAmount = CONFIG.payouts[key] || 0;
            winType = 'double';
        }
        // Проверяем последние два
        else if (results[1] === results[2]) {
            const key = results[1] + results[2];
            winAmount = CONFIG.payouts[key] || 0;
            winType = 'double';
        }
        // Проверяем первый и третий
        else if (results[0] === results[2]) {
            const key = results[0] + results[2];
            winAmount = CONFIG.payouts[key] || 0;
            winType = 'double';
        }
    }
    
    return { amount: winAmount, type: winType };
}

// Настройка обработчиков событий
function setupEventListeners() {
    if (elements.spinButton) {
        elements.spinButton.addEventListener('click', function(e) {
            e.preventDefault();
            spin();
        });
        
        elements.spinButton.addEventListener('mouseenter', () => {
            if (!state.isSpinning) {
                elements.spinButton.style.transform = 'scale(1.05)';
            }
        });
        
        elements.spinButton.addEventListener('mouseleave', () => {
            elements.spinButton.style.transform = 'scale(1)';
        });
    }
    
    // Добавляем обработчик для клавиши пробела
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && !state.isSpinning && state.balance > 0) {
            e.preventDefault();
            spin();
        }
    });
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Функции для отладки
window.debugGame = {
    state: state,
    spin: spin,
    updateUI: updateUI,
    resetStats: function() {
        state.spinCount = 0;
        state.winCount = 0;
        state.jackpots = 0;
        saveGameState();
        updateUI();
        showNotification('Статистика сброшена!', 2000);
    },
    addStars: function(amount) {
        state.balance += amount;
        saveGameState();
        updateUI();
        showNotification(`Добавлено ${amount} звёзд!`, 2000);
    }
};