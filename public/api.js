// api.js - для Netlify Functions

// Базовый URL API (Netlify будет автоматически проксировать)
const API_BASE_URL = '/api';

// Кэш данных пользователя
let userCache = null;

class Api {
    // Инициализация пользователя
    static async initUser(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-init`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                userCache = data.user;
                // Сохраняем в localStorage как fallback
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка инициализации пользователя:', error);
            // Fallback на localStorage
            return this.createLocalUser(userData);
        }
    }
    
    // Получение пользователя по Telegram ID
    static async getUser(telegramId) {
        try {
            // Проверяем кэш
            if (userCache && userCache.telegram_id == telegramId) {
                return { success: true, user: userCache };
            }
            
            const response = await fetch(`${API_BASE_URL}/user-get/${telegramId}`, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                if (response.status === 404) {
                    return { success: false, error: 'Пользователь не найден' };
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                userCache = data.user;
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            // Fallback на localStorage
            const localData = localStorage.getItem('userData');
            if (localData) {
                userCache = JSON.parse(localData);
                return { success: true, user: userCache };
            }
            return { success: false, error: 'Ошибка загрузки данных' };
        }
    }
    
    // Обновление баланса
    static async updateBalance(userId, starsDelta = 0, coinsDelta = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-balance/${userId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ stars: starsDelta, coins: coinsDelta })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && userCache && userCache.id === userId) {
                userCache.balance += starsDelta;
                userCache.coins += coinsDelta;
                userCache.updated_at = new Date().toISOString();
                localStorage.setItem('userData', JSON.stringify(userCache));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления баланса:', error);
            // Fallback на localStorage
            if (userCache && userCache.id === userId) {
                userCache.balance += starsDelta;
                userCache.coins += coinsDelta;
                localStorage.setItem('userData', JSON.stringify(userCache));
                return { success: true };
            }
            return { success: false, error: 'Ошибка обновления' };
        }
    }
    
    // Обновление статистики
    static async updateStats(userId, spinCount = 0, winCount = 0, jackpots = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-stats/${userId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    spin_count: spinCount, 
                    win_count: winCount, 
                    jackpots: jackpots 
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && userCache && userCache.id === userId) {
                userCache.spin_count += spinCount;
                userCache.win_count += winCount;
                userCache.jackpots += jackpots;
                userCache.updated_at = new Date().toISOString();
                localStorage.setItem('userData', JSON.stringify(userCache));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            // Fallback на localStorage
            if (userCache && userCache.id === userId) {
                userCache.spin_count += spinCount;
                userCache.win_count += winCount;
                userCache.jackpots += jackpots;
                localStorage.setItem('userData', JSON.stringify(userCache));
                return { success: true };
            }
            return { success: false, error: 'Ошибка обновления' };
        }
    }
    
    // Покупка подарка (нужно создать функцию user-gifts.js аналогично)
    static async purchaseGift(userId, giftId) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-gifts/${userId}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ gift_id: giftId })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && userCache && userCache.id === userId) {
                if (!userCache.gifts) userCache.gifts = [];
                userCache.gifts.push({
                    id: giftId,
                    purchased_at: new Date().toISOString()
                });
                localStorage.setItem('userData', JSON.stringify(userCache));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка покупки подарка:', error);
            // Fallback на localStorage
            if (userCache && userCache.id === userId) {
                if (!userCache.gifts) userCache.gifts = [];
                userCache.gifts.push({
                    id: giftId,
                    purchased_at: new Date().toISOString()
                });
                localStorage.setItem('userData', JSON.stringify(userCache));
                return { success: true };
            }
            return { success: false, error: 'Ошибка покупки' };
        }
    }
    
    // Получение списка подарков
    static async getGifts() {
        try {
            const response = await fetch(`${API_BASE_URL}/gifts`, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Ошибка получения подарков:', error);
            // Статический список как fallback
            const gifts = [
                {
                    id: 'gift_1',
                    emoji: '🥃',
                    name: '50 грамм',
                    description: '50 грамм самогона',
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
            return { success: true, gifts };
        }
    }
    
    // Получение текущего пользователя
    static getCurrentUser() {
        if (userCache) {
            return userCache;
        }
        
        const localData = localStorage.getItem('userData');
        if (localData) {
            userCache = JSON.parse(localData);
            return userCache;
        }
        
        return null;
    }
    
    // Создание локального пользователя (fallback)
    static createLocalUser(userData) {
        const userId = userData?.id || `guest_${Date.now()}`;
        const user = {
            id: userId,
            telegram_id: userId,
            username: userData?.username || 'Гость',
            first_name: userData?.first_name || '',
            last_name: userData?.last_name || '',
            photo_url: userData?.photo_url || '',
            balance: 100,
            coins: 0,
            spin_count: 0,
            win_count: 0,
            jackpots: 0,
            gifts: [],
            join_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('userData', JSON.stringify(user));
        userCache = user;
        
        return { success: true, user };
    }
}

// Инициализация Telegram Web App
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
            // Инициализация пользователя
            const initUser = async () => {
                const user = tg.initDataUnsafe?.user;
                if (user) {
                    await Api.initUser({
                        id: user.id.toString(),
                        username: user.username,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        photo_url: user.photo_url
                    });
                }
            };
            
            initUser();
        }
    } catch (error) {
        console.log('Telegram Web App не доступен');
    }
});