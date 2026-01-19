// shop.js
const elements = {
    balance: document.getElementById('balance'),
    coins: document.getElementById('coins'),
    giftsCount: document.getElementById('giftsCount'),
    giftsGrid: document.getElementById('giftsGrid'),
    purchaseModal: document.getElementById('purchaseModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    modalCancel: document.getElementById('modalCancel'),
    modalConfirm: document.getElementById('modalConfirm'),
    notification: document.getElementById('notification'),
    notificationText: document.getElementById('notificationText')
};

let selectedGift = null;
let giftsList = [];

async function init() {
    await loadUserData();
    await loadGifts();
    setupEventListeners();
    renderGifts();
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
    if (elements.giftsCount) elements.giftsCount.textContent = user.gifts ? user.gifts.length : 0;
}

async function loadGifts() {
    const result = await Api.getGifts();
    if (result.success) {
        giftsList = result.gifts;
    }
}

function renderGifts() {
    const user = Api.getCurrentUser();
    const userGifts = user ? user.gifts || [] : [];
    
    elements.giftsGrid.innerHTML = '';
    
    giftsList.forEach(gift => {
        const isOwned = userGifts.some(g => g.id === gift.id);
        
        const giftCard = document.createElement('div');
        giftCard.className = `gift-card ${isOwned ? 'owned' : ''}`;
        giftCard.dataset.id = gift.id;
        
        giftCard.innerHTML = `
            ${isOwned ? '<div class="owned-badge">Куплено</div>' : ''}
            <div class="gift-icon">${gift.emoji}</div>
            <div class="gift-name">${gift.name}</div>
            <div class="gift-price ${gift.currency}">
                <span>${gift.price}</span>
                <span>${gift.currency === 'stars' ? '⭐' : '🪙'}</span>
            </div>
            <div class="gift-description">${gift.description}</div>
            <button class="buy-btn" ${isOwned ? 'disabled' : ''}>
                ${isOwned ? 'Куплено' : 'Купить'}
            </button>
        `;
        
        if (!isOwned) {
            giftCard.querySelector('.buy-btn').addEventListener('click', () => openPurchaseModal(gift));
        }
        
        elements.giftsGrid.appendChild(giftCard);
    });
}

function openPurchaseModal(gift) {
    selectedGift = gift;
    const user = Api.getCurrentUser();
    
    // Проверяем баланс
    const userBalance = gift.currency === 'stars' ? (user.balance || 0) : (user.coins || 0);
    const hasEnough = userBalance >= gift.price;
    
    elements.modalTitle.textContent = `Покупка: ${gift.name}`;
    
    elements.modalBody.innerHTML = `
        <div class="modal-gift-info">
            <div class="modal-gift-icon">${gift.emoji}</div>
            <div class="modal-gift-name">${gift.name}</div>
            <div class="modal-gift-description">${gift.description}</div>
            <div class="modal-price ${gift.currency}">
                <span>Цена: ${gift.price}</span>
                <span>${gift.currency === 'stars' ? '⭐' : '🪙'}</span>
            </div>
        </div>
        <div class="modal-balance-check">
            <p>Ваш баланс: ${userBalance} ${gift.currency === 'stars' ? 'звёзд' : 'монет'}</p>
            <p class="${hasEnough ? 'sufficient' : 'insufficient'}">
                ${hasEnough ? '✅ Достаточно средств' : '❌ Недостаточно средств'}
            </p>
        </div>
    `;
    
    elements.modalConfirm.disabled = !hasEnough;
    elements.purchaseModal.classList.add('show');
}

async function purchaseGift() {
    if (!selectedGift) return;
    
    const user = Api.getCurrentUser();
    if (!user) return;
    
    try {
        // Обновляем баланс
        const starsDelta = selectedGift.currency === 'stars' ? -selectedGift.price : 0;
        const coinsDelta = selectedGift.currency === 'coins' ? -selectedGift.price : 0;
        
        await Api.updateBalance(user.id, starsDelta, coinsDelta);
        
        // Добавляем подарок
        await Api.purchaseGift(user.id, selectedGift.id);
        
        showNotification(`🎁 Вы купили "${selectedGift.name}"!`, 3000);
        
        // Обновляем UI
        updateUIFromUser(Api.getCurrentUser());
        renderGifts();
        
        closePurchaseModal();
        
    } catch (error) {
        console.error('Ошибка покупки:', error);
        showNotification('❌ Ошибка покупки', 2000);
    }
}

function closePurchaseModal() {
    elements.purchaseModal.classList.remove('show');
    selectedGift = null;
}

function showNotification(message, duration = 3000) {
    elements.notificationText.textContent = message;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, duration);
}

function setupEventListeners() {
    elements.modalClose.addEventListener('click', closePurchaseModal);
    elements.modalCancel.addEventListener('click', closePurchaseModal);
    elements.modalConfirm.addEventListener('click', purchaseGift);
    
    // Закрытие по клику вне модального окна
    elements.purchaseModal.addEventListener('click', (e) => {
        if (e.target === elements.purchaseModal) {
            closePurchaseModal();
        }
    });
}

// Инициализация
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}