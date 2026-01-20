// api.js - Полная версия с платежами и синхронизацией

const API_BASE_URL = '/api';
let userCache = null;
let lastSyncTime = 0;
const SYNC_INTERVAL = 30000; // Синхронизация каждые 30 секунд

class Api {
    // ==================== СИНХРОНИЗАЦИЯ ====================
    
    // Принудительная синхронизация пользователя
    static async syncUser() {
        try {
            const user = this.getCurrentUser();
            if (!user || !user.telegram_id) return null;
            
            const result = await this.getUser(user.telegram_id);
            if (result.success) {
                userCache = result.user;
                localStorage.setItem('userData', JSON.stringify(result.user));
                lastSyncTime = Date.now();
                console.log('✅ Пользователь синхронизирован');
                return result.user;
            }
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
        }
        return null;
    }
    
    // Автоматическая синхронизация при необходимости
    static async autoSync() {
        if (Date.now() - lastSyncTime > SYNC_INTERVAL) {
            return await this.syncUser();
        }
        return this.getCurrentUser();
    }
    
    // ==================== ОСНОВНЫЕ МЕТОДЫ ====================
    
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
                lastSyncTime = Date.now();
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            return this.createLocalUser(userData);
        }
    }
    
    static async getUser(userId) {
        try {
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
                lastSyncTime = Date.now();
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка получения:', error);
            const localData = localStorage.getItem('userData');
            if (localData) {
                userCache = JSON.parse(localData);
                return { success: true, user: userCache };
            }
            return { success: false, error: 'Ошибка загрузки' };
        }
    }
    
    static async updateBalance(userId, starsDelta = 0, coinsDelta = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-balance?userId=${encodeURIComponent(userId)}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ stars: starsDelta, coins: coinsDelta })
            });
            
            console.log('💰 Отправка обновления баланса:', { userId, starsDelta, coinsDelta });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка баланса:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Ответ баланса:', data);
            
            if (data.success && data.user) {
                userCache = data.user;
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления баланса:', error);
            throw error;
        }
    }
    
    static async updateStats(userId, spinCount = 0, winCount = 0, jackpots = 0) {
        try {
            console.log('📊 Отправка статистики:', { userId, spinCount, winCount, jackpots });
            
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
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка статистики:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Ответ статистики:', data);
            
            if (data.success && data.user) {
                userCache = data.user;
                localStorage.setItem('userData', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка обновления статистики:', error);
            throw error;
        }
    }
    
    static async purchaseGift(userId, giftId, giftPrice, giftCurrency) {
        try {
            console.log('🎁 Покупка подарка:', { userId, giftId, giftPrice, giftCurrency });
            
            // 1. Проверяем баланс
            const user = this.getCurrentUser();
            const userBalance = giftCurrency === 'stars' ? user.balance : user.coins;
            
            if (userBalance < giftPrice) {
                return {
                    success: false,
                    error: `Недостаточно ${giftCurrency === 'stars' ? 'звёзд' : 'монет'}`
                };
            }
            
            // 2. Списываем средства
            const starsDelta = giftCurrency === 'stars' ? -giftPrice : 0;
            const coinsDelta = giftCurrency === 'coins' ? -giftPrice : 0;
            
            const balanceResult = await this.updateBalance(userId, starsDelta, coinsDelta);
            
            if (!balanceResult.success) {
                return balanceResult;
            }
            
            // 3. Добавляем подарок
            const response = await fetch(`${API_BASE_URL}/user-gifts?userId=${encodeURIComponent(userId)}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ gift_id: giftId })
            });
            
            if (!response.ok) {
                // Если ошибка добавления подарка, возвращаем деньги
                await this.updateBalance(userId, -starsDelta, -coinsDelta);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.gift) {
                // Обновляем локальный кэш
                if (!userCache.gifts) userCache.gifts = [];
                userCache.gifts.push(data.gift);
                localStorage.setItem('userData', JSON.stringify(userCache));
            }
            
            return data;
        } catch (error) {
            console.error('Ошибка покупки:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ==================== TELEGRAM STARS API ====================
    
    static async processStarsPayment(starsAmount, description = "Пополнение баланса") {
        try {
            // Проверяем что в Telegram Web App
            if (!window.Telegram?.WebApp) {
                return {
                    success: false,
                    error: 'Telegram Web App не доступен'
                };
            }
            
            const tg = window.Telegram.WebApp;
            
            // Используем Telegram Stars API
            const result = await tg.sendData(JSON.stringify({
                type: 'stars_payment',
                amount: starsAmount,
                description: description
            }));
            
            console.log('💳 Результат платежа Stars:', result);
            
            if (result && result.success) {
                // Обновляем баланс пользователя
                const user = this.getCurrentUser();
                if (user && user.id) {
                    await this.updateBalance(user.id, starsAmount, 0);
                }
                
                return {
                    success: true,
                    transactionId: result.transaction_id,
                    amount: starsAmount
                };
            } else {
                return {
                    success: false,
                    error: result?.error || 'Ошибка платежа'
                };
            }
            
        } catch (error) {
            console.error('Ошибка платежа Stars:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    static showStarsInvoice(amount, title = "Пополнение баланса") {
        if (!window.Telegram?.WebApp) {
            alert('Telegram Stars доступны только в Telegram');
            return;
        }
        
        const tg = window.Telegram.WebApp;
        
        // Открываем инвойс для оплаты
        tg.openInvoice({
            title: title,
            description: `Пополнение на ${amount} звёзд`,
            payload: JSON.stringify({
                type: 'stars_purchase',
                amount: amount,
                userId: this.getCurrentUser()?.id
            }),
            prices: [
                {
                    label: `${amount} Telegram Stars`,
                    amount: amount * 100, // В копейках/центах
                    currency: 'XTR'
                }
            ],
            need_name: false,
            need_phone_number: false,
            need_email: false,
            need_shipping_address: false
        }, (status) => {
            console.log('📦 Статус инвойса:', status);
            
            if (status === 'paid') {
                // Обработка успешной оплаты
                const user = this.getCurrentUser();
                if (user && user.id) {
                    this.updateBalance(user.id, amount, 0)
                        .then(result => {
                            if (result.success) {
                                tg.showAlert(`✅ Успешно пополнено ${amount} звёзд!`);
                            }
                        });
                }
            }
        });
    }
    
    // ==================== УТИЛИТЫ ====================
    
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
    
    // ==================== СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ ====================
    
    static initStorageSync() {
        // Синхронизация между вкладками
        window.addEventListener('storage', (event) => {
            if (event.key === 'userData' && event.newValue) {
                try {
                    userCache = JSON.parse(event.newValue);
                    console.log('🔄 Данные синхронизированы из другой вкладки');
                    
                    // Обновляем UI если есть функция
                    if (window.updateGlobalUI) {
                        window.updateGlobalUI();
                    }
                } catch (e) {
                    console.error('Ошибка синхронизации:', e);
                }
            }
        });
        
        // Периодическая синхронизация с сервером
        setInterval(() => {
            this.autoSync().catch(console.error);
        }, SYNC_INTERVAL);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Инициализируем синхронизацию
        Api.initStorageSync();
        
        if (window.Telegram && window.Telegram.WebApp) {
            const tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            
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
            
            // Обработчик платежей Telegram Stars
            tg.onEvent('invoiceClosed', (event) => {
                console.log('💳 Инвойс закрыт:', event);
            });
        }
    } catch (error) {
        console.log('Инициализация не удалась:', error);
    }
});

// Глобальная функция для обновления UI
window.updateGlobalUI = () => {
    const user = Api.getCurrentUser();
    if (user) {
        // Обновляем баланс на всех страницах
        const balanceElements = document.querySelectorAll('#balance, .balance-value');
        balanceElements.forEach(el => {
            if (el.id === 'balance' || el.classList.contains('balance-value')) {
                el.textContent = user.balance || 0;
            }
        });
        
        const coinsElements = document.querySelectorAll('#coins, .coins-value');
        coinsElements.forEach(el => {
            if (el.id === 'coins' || el.classList.contains('coins-value')) {
                el.textContent = user.coins || 0;
            }
        });
    }
};