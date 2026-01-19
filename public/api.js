// api.js - для Netlify Functions

// Базовый URL API
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
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка инициализации пользователя:', error);
            return this.createLocalUser(userData);
        }
    }
    
    // Получение пользователя по ID (telegram_id или UUID)
    static async getUser(userId) {
        try {
            // Проверяем кэш
            if (userCache && (userCache.id === userId || userCache.telegram_id === userId)) {
                return { success: true, user: userCache };
            }
            
            // ВАЖНО: Используем query параметр
            const response = await fetch(`${API_BASE_URL}/user-get?id=${encodeURIComponent(userId)}`, {
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
            // ВАЖНО: Используем query параметр
            const response = await fetch(`${API_BASE_URL}/user-balance?userId=${encodeURIComponent(userId)}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ stars: starsDelta, coins: coinsDelta })
            });
            
            console.log('📤 Отправка обновления баланса для userId:', userId);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка обновления баланса:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📥 Ответ обновления баланса:', data);
            
            if (data.success && userCache && 
                (userCache.id === userId || userCache.telegram_id === userId)) {
                userCache.balance += starsDelta;
                userCache.coins += coinsDelta;
                userCache.updated_at = new Date().toISOString();
                localStorage.setItem('userData', JSON.stringify(userCache));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления баланса:', error);
            if (userCache && (userCache.id === userId || userCache.telegram_id === userId)) {
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
            // ВАЖНО: Используем query параметр
            const response = await fetch(`${API_BASE_URL}/user-stats?userId=${encodeURIComponent(userId)}`, {
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
            
            console.log('📤 Отправка обновления статистики для userId:', userId);
            console.log('📊 Параметры:', { spinCount, winCount, jackpots });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка обновления статистики:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('📥 Ответ обновления статистики:', data);
            
            if (data.success && userCache && 
                (userCache.id === userId || userCache.telegram_id === userId)) {
                userCache.spin_count += spinCount;
                userCache.win_count += winCount;
                userCache.jackpots += jackpots;
                userCache.updated_at = new Date().toISOString();
                localStorage.setItem('userData', JSON.stringify(userCache));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            if (userCache && (userCache.id === userId || userCache.telegram_id === userId)) {
                userCache.spin_count += spinCount;
                userCache.win_count += winCount;
                userCache.jackpots += jackpots;
                localStorage.setItem('userData', JSON.stringify(userCache));
                return { success: true };
            }
            return { success: false, error: 'Ошибка обновления' };
        }
    }
    
    // Покупка подарка
    static async purchaseGift(userId, giftId) {
        try {
            // ВАЖНО: Используем query параметр
            const response = await fetch(`${API_BASE_URL}/user-gifts?userId=${encodeURIComponent(userId)}`, {
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
            
            if (data.success && userCache && 
                (userCache.id === userId || userCache.telegram_id === userId)) {
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
            if (userCache && (userCache.id === userId || userCache.telegram_id === userId)) {
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
    
    // Получение списка подарков (без изменений)
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
                // ... остальные подарки
            ];
            return { success: true, gifts };
        }
    }
    
    // Получение текущего пользователя (без изменений)
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
    
    // Создание локального пользователя (без изменений)
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

// Инициализация Telegram Web App (без изменений)
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
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