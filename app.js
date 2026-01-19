// app.js - Исправленная версия

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
        '🍒🍒🍒': 10
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
    totalWins: document.getElementById('totalWins')
};

// Инициализация
function init() {
    console.log('Инициализация игры...');
    loadGameState();
    updateUI();
    initializeReels();
    setupEventListeners();
    
    // Загружаем данные пользователя из API если есть
    loadUserData();
}

// Загрузка состояния из localStorage
function loadGameState() {
    try {
        const savedBalance = localStorage.getItem('slotsBalance');
        const savedCoins = localStorage.getItem('slotsCoins');
        const savedJackpots = localStorage.getItem('slotsJackpots');
        const savedSpinCount = localStorage.getItem('slotsSpinCount');
        const savedWinCount = localStorage.getItem('slotsWinCount');
        
        console.log('Загрузка из localStorage:', {
            balance: savedBalance,
            coins: savedCoins,
            jackpots: savedJackpots,
            spinCount: savedSpinCount,
            winCount: savedWinCount
        });
        
        if (savedBalance !== null) state.balance = parseInt(savedBalance) || 100;
        if (savedCoins !== null) state.coins = parseInt(savedCoins) || 0;
        if (savedJackpots !== null) state.jackpots = parseInt(savedJackpots) || 0;
        if (savedSpinCount !== null) state.spinCount = parseInt(savedSpinCount) || 0;
        if (savedWinCount !== null) state.winCount = parseInt(savedWinCount) || 0;
        
    } catch (error) {
        console.error('Ошибка загрузки из localStorage:', error);
        // Значения по умолчанию
        state.balance = 100;
        state.coins = 0;
        state.jackpots = 0;
        state.spinCount = 0;
        state.winCount = 0;
    }
}

// Сохранение состояния в localStorage
function saveGameState() {
    try {
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
        if (typeof Api !== 'undefined' && Api.getCurrentUser) {
            const user = Api.getCurrentUser();
            if (user) {
                console.log('Пользователь из API:', user);
                // Обновляем состояние из данных пользователя
                state.balance = user.balance || state.balance;
                state.coins = user.coins || state.coins;
                state.jackpots = user.jackpots || state.jackpots;
                state.spinCount = user.spin_count || state.spinCount;
                state.winCount = user.win_count || state.winCount;
                
                updateUI();
                saveGameState();
            }
        }
    } catch (error) {
        console.log('API не доступен, используем локальные данные');
    }
}

// Инициализация барабанов
function initializeReels() {
    console.log('Инициализация барабанов...');
    
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
    
    const itemHeight = 60; // Высота одного символа
    const reelHeight = 180; // Высота окна слота
    
    // Центрируем символ в окне
    const offset = Math.floor((reelHeight / itemHeight) / 2) * itemHeight;
    const position = -(symbolIndex * itemHeight) + offset;
    
    reel.style.transform = `translateY(${position}px)`;
    reel.style.transition = 'none'; // Убираем анимацию для начальной позиции
    
    // Принудительный reflow
    reel.offsetHeight;
}

// Обновление UI
function updateUI() {
    console.log('Обновление UI:', state);
    
    if (elements.balance) elements.balance.textContent = state.balance;
    if (elements.coins) elements.coins.textContent = state.coins;
    if (elements.jackpots) elements.jackpots.textContent = state.jackpots;
    if (elements.winAmount) elements.winAmount.textContent = state.lastWin;
    if (elements.totalSpins) elements.totalSpins.textContent = state.spinCount;
    if (elements.totalWins) elements.totalWins.textContent = state.winCount;
    
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
            
            // Вычисляем целевую позицию
            const reelHeight = 180;
            const offset = Math.floor((reelHeight / itemHeight) / 2) * itemHeight;
            const targetY = -(symbolIndex * itemHeight) + offset;
            
            // Текущая позиция
            const currentTransform = reel.style.transform || 'translateY(0px)';
            const match = currentTransform.match(/translateY\(([-\d]+)px\)/);
            const currentY = match ? parseInt(match[1]) : 0;
            
            // Добавляем несколько дополнительных оборотов
            const extraSpins = 5;
            const extraDistance = extraSpins * CONFIG.symbols.length * itemHeight;
            
            // Устанавливаем начальную анимацию
            reel.style.transition = 'none';
            reel.style.transform = `translateY(${currentY - extraDistance}px)`;
            
            // Принудительный reflow
            reel.offsetHeight;
            
            // Запускаем анимацию к цели
            reel.style.transition = `transform ${duration}ms cubic-bezier(0.2, 0.8, 0.3, 1)`;
            reel.style.transform = `translateY(${targetY}px)`;
            
            setTimeout(() => {
                resolve();
            }, duration);
        }, delay);
    });
}

// Обновление статистики через API
async function updateGameStats(spinIncrement = 0, winIncrement = 0, jackpotIncrement = 0) {
    try {
        console.log('Обновление статистики:', { spinIncrement, winIncrement, jackpotIncrement });
        
        // Обновляем локальную статистику
        if (spinIncrement > 0) state.spinCount += spinIncrement;
        if (winIncrement > 0) state.winCount += winIncrement;
        if (jackpotIncrement > 0) state.jackpots += jackpotIncrement;
        
        // Сохраняем локально
        saveGameState();
        
        // Обновляем через API если доступно
        if (typeof Api !== 'undefined' && Api.updateStats) {
            const user = Api.getCurrentUser();
            if (user) {
                await Api.updateStats(user.id, spinIncrement, winIncrement, jackpotIncrement);
                console.log('Статистика обновлена через API');
            }
        }
        
        // Обновляем UI
        updateUI();
        
    } catch (error) {
        console.log('Ошибка обновления статистики:', error);
    }
}

// Основная функция вращения
async function spin() {
    console.log('Запуск вращения...');
    
    if (state.isSpinning) {
        console.log('Уже вращается!');
        return;
    }
    
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
    const previousBalance = state.balance;
    state.balance -= 1;
    
    console.log('Баланс до спина:', previousBalance, 'после:', state.balance);
    
    try {
        // Обновляем статистику через API если доступно
        try {
            if (typeof Api !== 'undefined' && Api.updateStats && Api.updateBalance) {
                const user = Api.getCurrentUser();
                if (user) {
                    await Api.updateBalance(user.id, -1, 0);
                    console.log('Баланс обновлен через API');
                }
            }
        } catch (apiError) {
            console.log('API обновление не удалось, используем локальные данные');
        }
        
        // Генерируем новые символы
        const newSymbols = [
            getRandomSymbol(),
            getRandomSymbol(),
            getRandomSymbol()
        ];
        
        console.log('Новые символы:', newSymbols);
        state.currentSymbols = newSymbols;
        
        // Запускаем вращение барабанов с задержкой
        await Promise.all([
            spinReel(elements.reel1, newSymbols[0], 0),
            spinReel(elements.reel2, newSymbols[1], 200),
            spinReel(elements.reel3, newSymbols[2], 400)
        ]);
        
        console.log('Барабаны остановились');
        
        // Проверяем выигрыш
        const winResult = checkWin(newSymbols);
        console.log('Результат проверки выигрыша:', winResult);
        
        if (winResult.amount > 0) {
            state.lastWin = winResult.amount;
            state.balance += winResult.amount;
            
            // Обновляем статистику
            const jackpotIncrement = (winResult.type === 'triple' && newSymbols[0] === '🎰') ? 1 : 0;
            await updateGameStats(0, 1, jackpotIncrement); // winCount +1
            
            if (winResult.type === 'triple' && newSymbols[0] === '🎰') {
                showNotification(`🎉 ДЖЕКПОТ! +${winResult.amount} звёзд! 🎉`, 5000);
            } else if (winResult.type === 'triple') {
                showNotification(`🎊 Три в ряд! +${winResult.amount} звёзд!`, 3000);
            } else {
                showNotification(`🎯 Вы выиграли ${winResult.amount} звёзд!`, 3000);
            }
            
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
            
            // Анимация выигрыша
            if (elements.winDisplay) {
                elements.winDisplay.classList.add('win-animation');
                setTimeout(() => {
                    elements.winDisplay.classList.remove('win-animation');
                }, 1500);
            }
        } else {
            // Проигрыш - только увеличиваем счетчик спинов
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
        
        console.log('Вращение завершено. Новое состояние:', state);
        
        // Загружаем обновленные данные пользователя
        loadUserData();
    }
}

// Проверка выигрышной комбинации
function checkWin(results) {
    const combination = results.join('');
    let winAmount = 0;
    let winType = '';
    
    console.log('Проверка комбинации:', combination);
    
    // Проверяем 3 одинаковых символа
    if (results[0] === results[1] && results[1] === results[2]) {
        const key = results[0] + results[1] + results[2];
        winAmount = CONFIG.payouts[key] || 0;
        winType = 'triple';
        console.log('Три в ряд! Выигрыш:', winAmount);
    } 
    // Проверяем 2 одинаковых символа
    else {
        const combinations = [
            { symbols: [results[0], results[1]], key: results[0] + results[1] },
            { symbols: [results[1], results[2]], key: results[1] + results[2] },
            { symbols: [results[0], results[2]], key: results[0] + results[2] }
        ];
        
        for (const combo of combinations) {
            if (combo.symbols[0] === combo.symbols[1]) {
                // Базовая сумма за 2 символа
                const baseAmount = 5;
                if (baseAmount > winAmount) {
                    winAmount = baseAmount;
                    winType = 'double';
                    console.log('Два одинаковых! Выигрыш:', winAmount);
                }
            }
        }
    }
    
    return { amount: winAmount, type: winType };
}

// Настройка обработчиков событий
function setupEventListeners() {
    console.log('Настройка обработчиков событий...');
    
    if (elements.spinButton) {
        console.log('Кнопка спина найдена');
        
        elements.spinButton.addEventListener('click', function(e) {
            console.log('Клик по кнопке спина!');
            e.preventDefault();
            e.stopPropagation();
            spin();
        });
        
        // Анимация при наведении
        elements.spinButton.addEventListener('mouseenter', () => {
            if (!state.isSpinning) {
                elements.spinButton.style.transform = 'scale(1.05)';
            }
        });
        
        elements.spinButton.addEventListener('mouseleave', () => {
            elements.spinButton.style.transform = 'scale(1)';
        });
    } else {
        console.error('Кнопка спина не найдена!');
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
    console.log('Документ загружается, ждем DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded сработал');
        init();
    });
} else {
    console.log('Документ уже загружен, инициализируем сразу');
    init();
}

// Экспортируем функции для отладки
window.debugGame = {
    state: state,
    spin: spin,
    getRandomSymbol: getRandomSymbol,
    checkWin: checkWin,
    updateUI: updateUI,
    showNotification: showNotification
};

console.log('app.js загружен');