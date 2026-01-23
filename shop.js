// shop.js - Исправленная версия

const SUPABASE_ANON_KEY = sb_publishable_M6Sm5HGOD7VoUpp2RE3dDw_omJAo4Lw;
const SUPABASE_URL = 'https://xxpejmpenonubelocxjs.supabase.co';

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
    // Синхронизируем пользователя
    await Api.syncUser();
    await loadUserData();
    await loadGifts();
    setupEventListeners();
    renderGifts();
    
    // Подписываемся на обновления баланса
    window.updateGlobalUI();
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
    if (elements.giftsCount) {
        const giftsCount = user.gifts ? user.gifts.length : 0;
        elements.giftsCount.textContent = giftsCount;
    }
}

async function loadGifts() {
    const result = await Api.getGifts();
    if (result.success) {
        giftsList = result.gifts;
    }
}

function renderGifts() {
    const user = Api.getCurrentUser();
    if (!user) {
        console.error('❌ Пользователь не найден');
        return;
    }
    
    const userGifts = user.gifts || [];
    const ownedGiftIds = userGifts.map(g => g.gift_id || g.id);
    
    elements.giftsGrid.innerHTML = '';
    
    giftsList.forEach(gift => {
        const isOwned = ownedGiftIds.includes(gift.id);
        
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
    
    if (!user) {
        showNotification('❌ Пользователь не найден', 3000);
        return;
    }
    
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
    if (!user || !user.id) {
        showNotification('❌ Пользователь не найден', 3000);
        return;
    }
    
    try {
        elements.modalConfirm.disabled = true;
        elements.modalConfirm.textContent = 'Покупка...';
        
        // Используем новый метод purchaseGift
        const result = await Api.purchaseGift(
            user.id,
            selectedGift.id,
            selectedGift.price,
            selectedGift.currency
        );
        
        if (result.success) {
            showNotification(`🎁 Вы купили "${selectedGift.name}"!`, 3000);
            
            // Обновляем UI
            await Api.syncUser();
            updateUIFromUser(Api.getCurrentUser());
            renderGifts();
            
            closePurchaseModal();
        } else {
            showNotification(`❌ ${result.error || 'Ошибка покупки'}`, 3000);
            elements.modalConfirm.disabled = false;
            elements.modalConfirm.textContent = 'Купить';
        }
        
    } catch (error) {
        console.error('Ошибка покупки:', error);
        showNotification('❌ Ошибка покупки', 3000);
        elements.modalConfirm.disabled = false;
        elements.modalConfirm.textContent = 'Купить';
    }
}

function closePurchaseModal() {
    elements.purchaseModal.classList.remove('show');
    selectedGift = null;
    elements.modalConfirm.disabled = false;
    elements.modalConfirm.textContent = 'Купить';
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