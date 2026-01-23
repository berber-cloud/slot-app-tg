// wallet.js - с платежами Telegram Stars

const SUPABASE_ANON_KEY = sb_publishable_M6Sm5HGOD7VoUpp2RE3dDw_omJAo4Lw;
const SUPABASE_URL = 'https://xxpejmpenonubelocxjs.supabase.co';





const elements = {
    balance: document.getElementById('balance'),
    coins: document.getElementById('coins'),
    connectWallet: document.getElementById('connectWallet'),
    coinsPacks: document.getElementById('coinsPacks'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText')
};

async function init() {
    await Api.syncUser();
    await loadUserData();
    setupEventListeners();
}

async function loadUserData() {
    const user = Api.getCurrentUser();
    if (user) {
        updateUIFromUser(user);
    }
}

function updateUIFromUser(user) {
    if (elements.balance) elements.balance.textContent = user.balance || 0;
    if (elements.coins) elements.coins.textContent = user.coins || 0;
}

function setupEventListeners() {
    // Обработчики для пакетов Stars
    document.querySelectorAll('.pack-card[data-stars]').forEach(card => {
        card.querySelector('.btn-buy').addEventListener('click', () => {
            const stars = parseInt(card.dataset.stars);
            buyStars(stars);
        });
    });
    
    // Обработчики для TON (заглушка)
    if (elements.connectWallet) {
        elements.connectWallet.addEventListener('click', () => {
            showNotification('Функция TON будет доступна позже', 3000);
            elements.coinsPacks.style.display = 'block';
            elements.connectWallet.style.display = 'none';
        });
    }
}

// Покупка через Telegram Stars
async function buyStars(amount) {
    try {
        showNotification(`🔄 Открываем платеж на ${amount} звёзд...`, 2000);
        
        const result = await Api.processStarsPayment(amount, `Пополнение на ${amount} звёзд`);
        
        if (result.success) {
            showNotification(`✅ Успешно куплено ${amount} звёзд!`, 3000);
            
            // Синхронизируем данные
            await Api.syncUser();
            updateUIFromUser(Api.getCurrentUser());
            
        } else {
            showNotification(`❌ ${result.error || 'Ошибка платежа'}`, 3000);
        }
        
    } catch (error) {
        console.error('Ошибка покупки:', error);
        showNotification('❌ Ошибка при покупке', 2000);
    }
}

// Альтернативный способ - через инвойс
function buyStarsWithInvoice(amount) {
    Api.showStarsInvoice(amount, `Пополнение на ${amount} звёзд`);
}

function showNotification(message, duration = 3000) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, duration);
}

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}