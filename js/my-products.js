class MyProductsPage {
    constructor() {
        this.currentUser = null;
        this.products = [];
        this.init();
    }

    async init() {
        await this.checkLogin();
        this.loadMyProducts();
    }

    async checkLogin() {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            window.location.href = 'index.html';
            return;
        }
        this.currentUser = savedUser;
        const nameEl = document.getElementById('mpUserName');
        if (nameEl) nameEl.textContent = this.getShortEmail(savedUser);
    }

    async loadMyProducts() {
        const grid = document.getElementById('myProductsGrid');

        const cached = this.getCache(`myProducts_${this.currentUser}`);
        if (cached) {
            this.products = cached;
            this.renderProducts(cached);
        }

        try {
            const all = await gitHubDataManager.getProducts();
            const mine = all.filter(p => (p.sellerEmail || p.seller) === this.currentUser || this.getShortEmail(p.sellerEmail || p.seller) === this.getShortEmail(this.currentUser));
            this.products = mine;
            this.setCache(`myProducts_${this.currentUser}`, mine);

            if (mine.length === 0) {
                grid.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <h3>你还没有发布商品</h3>
                        <p>去发布页添加你的第一件闲置吧</p>
                        <button class="btn-primary click-ripple" onclick="location.href='publish.html'">
                            <i class="fas fa-plus"></i> 发布商品
                        </button>
                    </div>
                `;
            } else {
                this.renderProducts(mine);
            }
        } catch (e) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>加载失败</h3>
                    <p>稍后重试或检查网络连接</p>
                </div>
            `;
        }
    }

    renderProducts(list) {
        const grid = document.getElementById('myProductsGrid');
        grid.innerHTML = '';
        list.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card click-ripple';
            const imageHtml = product.images && product.images.length ? `<img src="${product.images[0]}" alt="商品图片">` : this.getProductIcon(product.category);
            card.innerHTML = `
                <div class="product-image">${imageHtml}</div>
                <div class="product-info">
                    <h3 class="product-title">${this.escapeHtml(product.title)}</h3>
                    <div class="product-price">¥${product.price}</div>
                    <p class="product-description">${this.escapeHtml(product.description)}</p>
                    <div class="product-actions">
                        <button class="btn-secondary click-ripple" onclick="location.href='publish.html'">
                            <i class="fas fa-edit"></i> 发布新的
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    getShortEmail(email) { return email ? email.split('@')[0] : '未知用户'; }
    escapeHtml(text) { const d=document.createElement('div'); d.textContent=text||''; return d.innerHTML; }
    getProductIcon(category) {
        const icons = { electronics:'📱', clothing:'👕', home:'🏠', books:'📚', sports:'⚽', other:'📦' };
        return icons[category] || '📦';
    }

    getCache(key) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && Array.isArray(parsed) ? parsed : null;
        } catch { return null; }
    }
    setCache(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
}

document.addEventListener('DOMContentLoaded', () => new MyProductsPage());
