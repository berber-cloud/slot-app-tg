// profile.js - Исправленная версия для загрузки статистики

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
    await loadUserData();
    await loadGifts();
    setupEventListeners();
    renderProfile();
    renderGiftsCollection();
    renderAchievements();
}

async function loadUserData() {
    try {
        // Пытаемся загрузить из API
        if (typeof Api !== 'undefined' && Api.getCurrentUser) {
            const user = Api.getCurrentUser();
            if (user) {
                updateUIFromUser(user);
                return;
            }
        }
        
        // Если API не работает, пробуем загрузить из localStorage
        const localData = localStorage.getItem('userData');
        if (localData) {
            const user = JSON.parse(localData);
            updateUIFromUser(user);
        } else {
            // Если вообще нет данных, создаем гостя
            console.log('Нет данных пользователя, создаем гостя');
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }
}

function updateUIFromUser(user) {
    console.log('Обновление UI пользователя:', user);
    
    // Баланс
    if (elements.balance) elements.balance.textContent = user.balance || 0;
    if (elements.coins) elements.coins.textContent = user.coins || 0;
    if (elements.totalGifts) elements.totalGifts.textContent = user.gifts ? user.gifts.length : 0;
    
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
    
    // Статистика игры - ВАЖНО: используем разные названия полей
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
        } else {
            // Статический список подарков
            giftsList = [
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
        }
    } catch (error) {
        console.error('Ошибка загрузки подарков:', error);
    }
}

function renderProfile() {
    const user = Api.getCurrentUser ? Api.getCurrentUser() : null;
    if (!user) {
        console.log('Пользователь не найден в API, проверяем localStorage');
        const localData = localStorage.getItem('userData');
        if (localData) {
            const localUser = JSON.parse(localData);
            updateUIFromUser(localUser);
        }
        return;
    }
    
    // Прогресс коллекции
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
}

function renderGiftsCollection() {
    const user = Api.getCurrentUser ? Api.getCurrentUser() : null;
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
    const user = Api.getCurrentUser ? Api.getCurrentUser() : null;
    if (!user) return;
    
    const achievements = [
        {
            id: 'first_jackpot',
            title: 'Первый джекпот',
            description: 'Выиграйте джекпот',
            icon: '🎰',
            condition: (user) => (user.jackpots || 0) > 0
        },
        {
            id: 'first_purchase',
            title: 'Первый покупатель',
            description: 'Купите любой подарок',
            icon: '🛍️',
            condition: (user) => user.gifts && user.gifts.length > 0
        },
        {
            id: 'star_player',
            title: 'Звёздный игрок',
            description: 'Накопите 1000 звёзд',
            icon: '⭐',
            condition: (user) => (user.balance || 0) >= 1000
        },
        {
            id: 'spinning_king',
            title: 'Король вращений',
            description: 'Сделайте 100 спинов',
            icon: '👑',
            condition: (user) => (user.spin_count || user.spinCount || 0) >= 100
        },
        {
            id: 'rich_chemist',
            title: 'Богатый химик',
            description: 'Соберите все подарки набора',
            icon: '🧪',
            condition: (user) => user.gifts && user.gifts.length >= (giftsList.length || 7)
        }
    ];
    
    if (elements.achievementsGrid) {
        elements.achievementsGrid.innerHTML = '';
        
        achievements.forEach(achievement => {
            const isUnlocked = achievement.condition(user);
            
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

function showNotification(message, duration = 3000) {
    if (elements.notification && elements.notificationText) {
        elements.notificationText.textContent = message;
        elements.notification.classList.add('show');
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, duration);
    }
}

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}