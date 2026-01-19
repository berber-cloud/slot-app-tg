// wallet.js
const elements = {
    balance: document.getElementById('balance'),
    coins: document.getElementById('coins'),
    connectWallet: document.getElementById('connectWallet'),
    coinsPacks: document.getElementById('coinsPacks'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText')
};

// Для TON Connect
let tonConnectUI = null;

async function init() {
    await loadUserData();
    setupEventListeners();
    initTONConnect();
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

function initTONConnect() {
    try {
        // Инициализация TON Connect UI
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://your-app.com/tonconnect-manifest.json',
            buttonRootId: 'connectWallet'
        });
        
        // Проверяем статус подключения
        tonConnectUI.connectionRestored.then((connected) => {
            if (connected) {
                elements.coinsPacks.style.display = 'block';
                elements.connectWallet.style.display = 'none';
            }
        });
        
    } catch (error) {
        console.log('TON Connect не доступен:', error);
    }
}

function setupEventListeners() {
    // Обработчики для пакетов Stars
    document.querySelectorAll('.pack-card[data-stars]').forEach(card => {
        card.querySelector('.btn-buy').addEventListener('click', () => {
            const stars = parseInt(card.dataset.stars);
            buyStars(stars);
        });
    });
    
    // Обработчики для пакетов Coins (после подключения TON)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-buy')) {
            const card = e.target.closest('.pack-card[data-coins]');
            if (card) {
                const coins = parseInt(card.dataset.coins);
                buyCoins(coins);
            }
        }
    });
    
    // Имитация покупки через Telegram Stars
    if (elements.connectWallet) {
        elements.connectWallet.addEventListener('click', () => {
            showNotification('Функция пополнения через TON будет доступна позже', 3000);
            // В реальном приложении здесь будет подключение кошелька
            elements.coinsPacks.style.display = 'block';
            elements.connectWallet.style.display = 'none';
        });
    }
}

// Имитация покупки звёзд (в реальном приложении через Telegram Stars API)
async function buyStars(amount) {
    const user = Api.getCurrentUser();
    if (!user) return;
    
    try {
        // В реальном приложении здесь был бы вызов Telegram Stars API
        // Сейчас имитируем успешную покупку
        await Api.updateBalance(user.id, amount, 0);
        
        showNotification(`✅ Успешно куплено ${amount} звёзд!`, 3000);
        updateUIFromUser(Api.getCurrentUser());
        
    } catch (error) {
        console.error('Ошибка покупки:', error);
        showNotification('❌ Ошибка при покупке', 2000);
    }
}

// Имитация покупки монет (в реальном приложении через TON)
async function buyCoins(amount) {
    const user = Api.getCurrentUser();
    if (!user) return;
    
    try {
        // В реальном приложении здесь была бы транзакция TON
        // Сейчас имитируем успешную покупку
        await Api.updateBalance(user.id, 0, amount);
        
        showNotification(`✅ Успешно куплено ${amount} монет!`, 3000);
        updateUIFromUser(Api.getCurrentUser());
        
    } catch (error) {
        console.error('Ошибка покупки:', error);
        showNotification('❌ Ошибка при покупке', 2000);
    }
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