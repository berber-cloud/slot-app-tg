// api.js - для Cloudflare Functions
const API_BASE_URL = '/api';

class Api {
    static async initUser(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-init`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('initUser error:', error);
            return this.createLocalUser(userData);
        }
    }
    
    static async getUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-get?id=${encodeURIComponent(userId)}`);
            return await response.json();
        } catch (error) {
            console.error('getUser error:', error);
            const localData = localStorage.getItem('userData');
            if (localData) {
                return { success: true, user: JSON.parse(localData) };
            }
            return { success: false, error: 'Ошибка загрузки' };
        }
    }
    
    static async updateBalance(userId, starsDelta = 0, coinsDelta = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-balance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: userId,
                    stars: starsDelta, 
                    coins: coinsDelta 
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                const user = this.getCurrentUser();
                if (user && (user.id === userId || user.telegram_id === userId)) {
                    user.balance = (user.balance || 0) + starsDelta;
                    user.coins = (user.coins || 0) + coinsDelta;
                    localStorage.setItem('userData', JSON.stringify(user));
                }
            }
            
            return data;
        } catch (error) {
            console.error('updateBalance error:', error);
            throw error;
        }
    }
    
    static async updateStats(userId, spinCount = 0, winCount = 0, jackpots = 0) {
        try {
            const response = await fetch(`${API_BASE_URL}/user-stats`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: userId,
                    spin_count: spinCount, 
                    win_count: winCount, 
                    jackpots: jackpots 
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.user) {
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === data.user.id) {
                    localStorage.setItem('userData', JSON.stringify(data.user));
                }
            }
            
            return data;
        } catch (error) {
            console.error('updateStats error:', error);
            throw error;
        }
    }
    
    static async purchaseGift(userId, giftId, giftPrice, giftCurrency) {
        try {
            // 1. Списываем средства
            const starsDelta = giftCurrency === 'stars' ? -giftPrice : 0;
            const coinsDelta = giftCurrency === 'coins' ? -giftPrice : 0;
            
            const balanceResult = await this.updateBalance(userId, starsDelta, coinsDelta);
            
            if (!balanceResult.success) {
                return balanceResult;
            }
            
            // 2. Добавляем подарок
            const response = await fetch(`${API_BASE_URL}/user-gifts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: userId,
                    gift_id: giftId 
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.gift) {
                const user = this.getCurrentUser();
                if (user && !user.gifts) user.gifts = [];
                user.gifts.push(data.gift);
                localStorage.setItem('userData', JSON.stringify(user));
            }
            
            return data;
        } catch (error) {
            console.error('purchaseGift error:', error);
            return { success: false, error: error.message };
        }
    }
    
    static async getGifts() {
        try {
            const response = await fetch(`${API_BASE_URL}/gifts`);
            return await response.json();
        } catch (error) {
            console.error('getGifts error:', error);
            // Fallback статический список
            return {
                success: true,
                gifts: [
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
                ]
            };
        }
    }
    
    static getCurrentUser() {
        const localData = localStorage.getItem('userData');
        return localData ? JSON.parse(localData) : null;
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
        return { success: true, user };
    }
}

// Инициализация Telegram
document.addEventListener('DOMContentLoaded', async () => {
    try {
        if (window.Telegram?.WebApp) {
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
        }
    } catch (error) {
        console.log('Telegram init error:', error);
    }
});