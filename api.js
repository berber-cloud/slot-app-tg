// api.js - Упрощенная версия для работы без сервера

// Данные пользователя
let userData = null;

// Класс API с заглушками для работы без сервера
class Api {
    // Инициализация пользователя
    static async initUser(userData) {
        try {
            // Проверяем, есть ли данные Telegram
            const user = userData || {
                id: `guest_${Date.now()}`,
                username: 'Гость',
                first_name: '',
                last_name: '',
                photo_url: ''
            };
            
            // Создаем объект пользователя
            const newUser = {
                id: user.id,
                username: user.username || 'Гость',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                photo_url: user.photo_url || '',
                balance: 100,
                coins: 0,
                spin_count: 0,
                win_count: 0,
                jackpots: 0,
                gifts: [],
                join_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('userId', newUser.id);
            localStorage.setItem('userData', JSON.stringify(newUser));
            userData = newUser;
            
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Ошибка инициализации пользователя:', error);
            return this.createLocalUser(userData);
        }
    }
    
    // Создание локального пользователя
    static createLocalUser(user) {
        const userId = user?.id || `guest_${Date.now()}`;
        const newUser = {
            id: userId,
            username: user?.username || 'Гость',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            photo_url: user?.photo_url || '',
            balance: 100,
            coins: 0,
            spin_count: 0,
            win_count: 0,
            jackpots: 0,
            gifts: [],
            join_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        localStorage.setItem('userId', userId);
        localStorage.setItem('userData', JSON.stringify(newUser));
        userData = newUser;
        
        return { success: true, user: newUser };
    }
    
    // Получение данных пользователя
    static async getUser(userId) {
        try {
            // Проверяем кэш
            if (userData && userData.id === userId) {
                return { success: true, user: userData };
            }
            
            // Получаем из localStorage
            const localData = localStorage.getItem('userData');
            if (localData) {
                userData = JSON.parse(localData);
                return { success: true, user: userData };
            }
            
            // Если нет данных, создаем нового пользователя
            return this.createLocalUser({ id: userId });
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            return { success: false, error: 'Ошибка загрузки данных' };
        }
    }
    
    // Обновление баланса
    static async updateBalance(userId, starsDelta = 0, coinsDelta = 0) {
        try {
            // Получаем текущего пользователя
            const user = this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'Пользователь не найден' };
            }
            
            // Обновляем баланс
            user.balance = Math.max(0, (user.balance || 0) + starsDelta);
            user.coins = Math.max(0, (user.coins || 0) + coinsDelta);
            user.updated_at = new Date().toISOString();
            
            // Сохраняем
            localStorage.setItem('userData', JSON.stringify(user));
            userData = user;
            
            return { success: true };
        } catch (error) {
            console.error('Ошибка обновления баланса:', error);
            return { success: false, error: 'Ошибка обновления' };
        }
    }
    
    // Обновление статистики
    static async updateStats(userId, spinCount = 0, winCount = 0, jackpots = 0) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'Пользователь не найден' };
            }
            
            user.spin_count = (user.spin_count || 0) + spinCount;
            user.win_count = (user.win_count || 0) + winCount;
            user.jackpots = (user.jackpots || 0) + jackpots;
            user.updated_at = new Date().toISOString();
            
            localStorage.setItem('userData', JSON.stringify(user));
            userData = user;
            
            return { success: true };
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            return { success: false, error: 'Ошибка обновления' };
        }
    }
    
    // Покупка подарка
    static async purchaseGift(userId, giftId) {
        try {
            const user = this.getCurrentUser();
            if (!user) {
                return { success: false, error: 'Пользователь не найден' };
            }
            
            if (!user.gifts) user.gifts = [];
            
            // Проверяем, не куплен ли уже подарок
            if (user.gifts.some(gift => gift.id === giftId)) {
                return { success: false, error: 'Подарок уже куплен' };
            }
            
            // Добавляем подарок
            user.gifts.push({
                id: giftId,
                purchased_at: new Date().toISOString()
            });
            
            user.updated_at = new Date().toISOString();
            localStorage.setItem('userData', JSON.stringify(user));
            userData = user;
            
            return { success: true };
        } catch (error) {
            console.error('Ошибка покупки подарка:', error);
            return { success: false, error: 'Ошибка покупки' };
        }
    }
    
    // Получение списка подарков
    static async getGifts() {
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
        
        return { success: true, gifts };
    }
    
    // Получение текущего пользователя
    static getCurrentUser() {
        if (userData) {
            return userData;
        }
        
        const localData = localStorage.getItem('userData');
        if (localData) {
            userData = JSON.parse(localData);
            return userData;
        }
        
        return null;
    }
    
    // Очистка кэша
    static clearCache() {
        userData = null;
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
                } else {
                    // Гостевой доступ
                    const guestId = localStorage.getItem('userId') || `guest_${Date.now()}`;
                    await Api.initUser({
                        id: guestId,
                        username: 'Гость'
                    });
                }
            };
            
            initUser();
        } else {
            // Если не в Telegram, создаем гостя
            const guestId = localStorage.getItem('userId') || `guest_${Date.now()}`;
            Api.initUser({
                id: guestId,
                username: 'Гость'
            });
        }
    } catch (error) {
        console.log('Telegram Web App не доступен, работаем в браузере');
        const guestId = localStorage.getItem('userId') || `guest_${Date.now()}`;
        Api.initUser({
            id: guestId,
            username: 'Гость'
        });
    }
});