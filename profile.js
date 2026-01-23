

const SUPABASE_ANON_KEY = window.RENDER_CONFIG.SUPABASE_ANON_KEY;
const SUPABASE_URL = window.RENDER_CONFIG.SUPABASE_URL;


// profile.js - Исправленная версия
const elements = {
    balance: document.getElementById('balance'),
    coins: document.getElementById('coins'),
    totalGifts: document.getElementById('totalGifts'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userId: document.getElementById('userId'),
    joinDate: document.getElementById('joinDate'),
    totalSpins: document.getElementById('totalSpins'),
    totalWins: document.getElementById('totalWins'),
    jackpots: document.getElementById('jackpots'),
    winRate: document.getElementById('winRate'),
    giftsCount: document.getElementById('giftsCount'),
    totalAvailable: document.getElementById('totalAvailable'),
    collectionProgress: document.getElementById('collectionProgress'),
    giftsCollection: document.getElementById('giftsCollection'),
    achievementsGrid: document.getElementById('achievementsGrid'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText')
};

let giftsList = [];

async function init() {
    // Сначала пытаемся синхронизировать с БД
    await syncWithDatabase();
    
    await loadUserData();
    await loadGifts();
    setupEventListeners();
    renderProfile();
    renderGiftsCollection();
    renderAchievements();
}

async function syncWithDatabase() {
    try {
        if (typeof Api !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            const tgUser = tg.initDataUnsafe?.user;
            
            if (tgUser) {
                // Инициализируем пользователя в БД
                await Api.initUser({
                    id: tgUser.id.toString(),
                    username: tgUser.username || 'Гость',
                    first_name: tgUser.first_name || '',
                    last_name: tgUser.last_name || '',
                    photo_url: tgUser.photo_url || ''
                });
                
                // Загружаем свежие данные
                const user = Api.getCurrentUser();
                if (user) {
                    // Обновляем localStorage из БД
                    localStorage.setItem('userData', JSON.stringify(user));
                    
                    // Обновляем gameState из статистики БД
                    const gameState = JSON.parse(localStorage.getItem('gameState') || '{}');
                    gameState.spinCount = user.spin_count || gameState.spinCount || 0;
                    gameState.winCount = user.win_count || gameState.winCount || 0;
                    gameState.jackpots = user.jackpots || gameState.jackpots || 0;
                    localStorage.setItem('gameState', JSON.stringify(gameState));
                }
            }
        }
    } catch (error) {
        console.error('Ошибка синхронизации:', error);
    }
}

async function loadUserData() {
    try {
        // Сначала пробуем загрузить из localStorage
        const localState = localStorage.getItem('gameState');
        if (localState) {
            const gameState = JSON.parse(localState);
            updateUIFromGameState(gameState);
        }
        
        // Затем пробуем загрузить из API
        if (typeof Api !== 'undefined' && Api.getCurrentUser) {
            const user = Api.getCurrentUser();
            if (user) {
                updateUIFromUser(user);
                
                // Синхронизируем с локальными данными
                const localStats = {
                    spinCount: user.spin_count || 0,
                    winCount: user.win_count || 0,
                    jackpots: user.jackpots || 0
                };
                
                // Сохраняем для единообразия
                localStorage.setItem('userStats', JSON.stringify(localStats));
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function updateUIFromGameState(gameState) {
    if (!gameState) return;
    
    if (elements.balance) elements.balance.textContent = gameState.balance || 0;
    if (elements.coins) elements.coins.textContent = gameState.coins || 0;
    if (elements.totalSpins) elements.totalSpins.textContent = gameState.spinCount || 0;
    if (elements.totalWins) elements.totalWins.textContent = gameState.winCount || 0;
    if (elements.jackpots) elements.jackpots.textContent = gameState.jackpots || 0;
    
    if (elements.winRate) {
        const spins = gameState.spinCount || 0;
        const wins = gameState.winCount || 0;
        const winRate = spins > 0 ? Math.round((wins / spins) * 100) : 0;
        elements.winRate.textContent = `${winRate}%`;
    }
}

function updateUIFromUser(user) {
    // В функции updateUIFromUser добавьте в начало:
if (!user) {
    console.log('Пользователь не найден, использую гостя');
    user = {
        username: 'Гость',
        balance: 0,
        coins: 0,
        spin_count: 0,
        win_count: 0,
        jackpots: 0
    };
}
    
    // Баланс
    if (elements.balance) elements.balance.textContent = user.balance || 0;
    if (elements.coins) elements.coins.textContent = user.coins || 0;
    
    // Статистика
    if (elements.totalSpins) {
        elements.totalSpins.textContent = user.spin_count || user.spinCount || 0;
    }
    
    if (elements.totalWins) {
        elements.totalWins.textContent = user.win_count || user.winCount || 0;
    }
    
    if (elements.jackpots) {
        elements.jackpots.textContent = user.jackpots || 0;
    }
    
    if (elements.winRate) {
        const spins = user.spin_count || user.spinCount || 0;
        const wins = user.win_count || user.winCount || 0;
        const winRate = spins > 0 ? Math.round((wins / spins) * 100) : 0;
        elements.winRate.textContent = `${winRate}%`;
    }
    
    // Информация о пользователе
    if (elements.userName) {
        elements.userName.textContent = user.username || 'Гость';
    }
    
    if (elements.userId) {
        elements.userId.textContent = `ID: ${user.id || 'Неизвестен'}`;
    }
    
    if (elements.joinDate && user.join_date) {
        const date = new Date(user.join_date);
        elements.joinDate.textContent = date.toLocaleDateString('ru-RU');
    } else if (elements.joinDate) {
        elements.joinDate.textContent = 'Сегодня';
    }
    
    // Аватар
    if (user.photo_url && elements.userAvatar) {
        elements.userAvatar.innerHTML = `<img src="${user.photo_url}" alt="Аватар" style="width:100%;height:100%;border-radius:50%;">`;
    } else if (elements.userAvatar) {
        elements.userAvatar.innerHTML = '<i class="fas fa-user-circle" style="font-size:60px;"></i>';
    }
}

async function loadGifts() {
    try {
        if (typeof Api !== 'undefined' && Api.getGifts) {
            const result = await Api.getGifts();
            if (result.success) {
                giftsList = result.gifts;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки подарков:', error);
    }
}

function renderProfile() {
    let user = null;
    
    // Пытаемся получить пользователя из API
    if (typeof Api !== 'undefined' && Api.getCurrentUser) {
        user = Api.getCurrentUser();
    }
    
    // Если нет пользователя из API, создаем временного
    if (!user) {
        const localData = localStorage.getItem('userData');
        if (localData) {
            user = JSON.parse(localData);
        }
    }
    
    if (!user) {
        user = {
            gifts: [],
            username: 'Гость'
        };
    }
    
    const userGifts = user.gifts || [];
    const totalGifts = giftsList.length;
    const progress = totalGifts > 0 ? (userGifts.length / totalGifts) * 100 : 0;
    
    if (elements.giftsCount) {
        elements.giftsCount.textContent = userGifts.length;
    }
    
    if (elements.totalAvailable) {
        elements.totalAvailable.textContent = totalGifts;
    }
    
    if (elements.collectionProgress) {
        elements.collectionProgress.value = progress;
    }
    
    if (elements.totalGifts) {
        elements.totalGifts.textContent = userGifts.length;
    }
}

function renderGiftsCollection() {
    let user = null;
    
    if (typeof Api !== 'undefined' && Api.getCurrentUser) {
        user = Api.getCurrentUser();
    }
    
    if (!user) {
        const localData = localStorage.getItem('userData');
        if (localData) {
            user = JSON.parse(localData);
        }
    }
    
    if (!user) return;
    
    const userGifts = user.gifts || [];
    
    if (userGifts.length === 0) {
        if (elements.giftsCollection) {
            elements.giftsCollection.innerHTML = `
                <div class="empty-collection">
                    <i class="fas fa-box-open"></i>
                    <p>Ваша коллекция пуста</p>
                    <p class="hint">Купите подарки в магазине!</p>
                </div>
            `;
        }
        return;
    }
    
    if (elements.giftsCollection) {
        elements.giftsCollection.innerHTML = '';
        
        // Фильтруем только купленные подарки
        const ownedGifts = giftsList.filter(gift => 
            userGifts.some(userGift => userGift.id === gift.id)
        );
        
        ownedGifts.forEach(gift => {
            const giftItem = document.createElement('div');
            giftItem.className = 'gift-collection-item';
            
            giftItem.innerHTML = `
                <div class="gift-icon">${gift.emoji}</div>
                <div class="gift-name">${gift.name}</div>
            `;
            
            elements.giftsCollection.appendChild(giftItem);
        });
    }
}

function renderAchievements() {
    let user = null;
    let gameState = null;
    
    // Получаем данные пользователя
    if (typeof Api !== 'undefined' && Api.getCurrentUser) {
        user = Api.getCurrentUser();
    }
    
    // Получаем игровую статистику
    const localState = localStorage.getItem('gameState');
    if (localState) {
        gameState = JSON.parse(localState);
    }
    
    // Объединяем данные
    const stats = {
        balance: (user?.balance || gameState?.balance || 0),
        coins: (user?.coins || gameState?.coins || 0),
        spinCount: (user?.spin_count || gameState?.spinCount || 0),
        winCount: (user?.win_count || gameState?.winCount || 0),
        jackpots: (user?.jackpots || gameState?.jackpots || 0),
        gifts: user?.gifts || []
    };
    
    const achievements = [
        {
            id: 'first_jackpot',
            title: 'Первый джекпот',
            description: 'Выиграйте джекпот',
            icon: '🎰',
            condition: (stats) => stats.jackpots > 0
        },
        {
            id: 'first_purchase',
            title: 'Первый покупатель',
            description: 'Купите любой подарок',
            icon: '🛍️',
            condition: (stats) => stats.gifts && stats.gifts.length > 0
        },
        {
            id: 'star_player',
            title: 'Звёздный игрок',
            description: 'Накопите 1000 звёзд',
            icon: '⭐',
            condition: (stats) => stats.balance >= 1000
        },
        {
            id: 'spinning_king',
            title: 'Король вращений',
            description: 'Сделайте 100 спинов',
            icon: '👑',
            condition: (stats) => stats.spinCount >= 100
        },
        {
            id: 'rich_chemist',
            title: 'Богатый химик',
            description: 'Соберите все подарки набора',
            icon: '🧪',
            condition: (stats) => stats.gifts && stats.gifts.length >= (giftsList.length || 7)
        }
    ];
    
    if (elements.achievementsGrid) {
        elements.achievementsGrid.innerHTML = '';
        
        achievements.forEach(achievement => {
            const isUnlocked = achievement.condition(stats);
            
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.title}</h4>
                    <p>${achievement.description}</p>
                </div>
                <div class="achievement-status">
                    ${isUnlocked ? '✅' : '<i class="fas fa-lock"></i>'}
                </div>
            `;
            
            elements.achievementsGrid.appendChild(achievementEl);
        });
    }
}

function setupEventListeners() {
    // Можно добавить обработчики для взаимодействий
}

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}