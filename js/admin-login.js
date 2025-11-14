[file name]: js/admin-login.js
[file content begin]
// 管理员登录逻辑
class AdminLogin {
    constructor() {
        this.init();
    }

    async init() {
        await this.loadSystemStats();
        this.setupEventListeners();
        this.addClickEffects();
    }

    // 加载系统统计
    async loadSystemStats() {
        try {
            const users = await gitHubDataManager.getAllUsers();
            const loginHistory = await gitHubDataManager.getLoginHistory();

            // 计算今日登录次数
            const today = new Date().toDateString();
            const todayLogins = loginHistory.filter(login =>
                new Date(login.loginTime).toDateString() === today
            ).length;

            document.getElementById('userCount').textContent = users.length;
            document.getElementById('todayLogins').textContent = todayLogins;

            // 检查GitHub连接状态
            const githubConnected = await gitHubDataManager.testConnection();
            document.getElementById('githubStatus').textContent = githubConnected ? '🟢 已连接' : '🔴 断开';
            document.getElementById('githubStatus').style.color = githubConnected ? '#2ecc71' : '#e74c3c';

        } catch (error) {
            console.error('加载系统统计失败:', error);
            document.getElementById('githubStatus').textContent = '🔴 连接错误';
            document.getElementById('githubStatus').style.color = '#e74c3c';
        }
    }

    // 设置事件监听器
    setupEventListeners() {
        const adminAuthForm = document.getElementById('adminAuthForm');
        const adminEmail = document.getElementById('adminEmail');
        const adminPassword = document.getElementById('adminPassword');

        adminAuthForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAdminLogin();
        });

        // 输入框特效
        [adminEmail, adminPassword].forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.style.transform = 'scale(1.02)';
                input.parentElement.style.zIndex = '10';
            });

            input.addEventListener('blur', () => {
                input.parentElement.style.transform = 'scale(1)';
                input.parentElement.style.zIndex = '1';
            });
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.handleAdminLogin();
            }
        });
    }

    // 处理管理员登录
    async handleAdminLogin() {
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const submitBtn = document.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');

        // 基本验证
        if (!email || !password) {
            this.showMessage('请输入管理员账号和密码', 'error');
            this.createButtonEffect('error');
            return;
        }

        // 显示加载状态
        btnText.textContent = '验证中...';
        submitBtn.disabled = true;

        try {
            // 验证管理员权限
            const isAdmin = await gitHubDataManager.isAdmin(email);
            if (!isAdmin) {
                throw new Error('无管理员权限');
            }

            // 验证管理员密码
            const users = await gitHubDataManager.getAllUsers();
            const adminUser = users.find(user => user.email === email);

            if (!adminUser || adminUser.password !== password) {
                throw new Error('管理员账号或密码错误');
            }

            // 记录管理员登录
            await gitHubDataManager.recordLogin(adminUser.id, {
                email: email,
                userAgent: navigator.userAgent,
                isAdmin: true
            });

            // 登录成功
            this.showMessage('🔐 管理员验证成功', 'success');
            this.createButtonEffect('success');
            this.createAdminConfetti();

            // 保存管理员登录状态
            localStorage.setItem('adminUser', email);
            localStorage.setItem('adminUserId', adminUser.id);
            localStorage.setItem('isAdmin', 'true');

            // 跳转到管理面板
            setTimeout(() => {
                window.location.href = 'admin-dashboard.html';
            }, 1500);

        } catch (error) {
            this.showMessage(`❌ ${error.message}`, 'error');
            this.createButtonEffect('error');

            // 记录登录失败
            this.recordFailedLoginAttempt(email);
        } finally {
            // 恢复按钮状态
            btnText.textContent = '进入管理系统';
            submitBtn.disabled = false;
        }
    }

    // 记录失败登录尝试
    recordFailedLoginAttempt(email) {
        const failedAttempts = JSON.parse(localStorage.getItem('adminFailedAttempts') || '{}');
        failedAttempts[email] = (failedAttempts[email] || 0) + 1;
        localStorage.setItem('adminFailedAttempts', JSON.stringify(failedAttempts));

        // 如果失败次数过多，显示警告
        if (failedAttempts[email] >= 3) {
            this.showMessage('⚠️ 多次登录失败，请检查账号密码', 'error');
        }
    }

    // 显示消息
    showMessage(message, type) {
        const messageEl = document.getElementById('message');
        messageEl.textContent = message;
        messageEl.className = `message ${type} show`;

        // 添加图标
        if (type === 'success') {
            messageEl.innerHTML = `✅ ${message}`;
        } else if (type === 'error') {
            messageEl.innerHTML = `❌ ${message}`;
        }

        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 4000);
    }

    // 按钮特效
    createButtonEffect(type) {
        const submitBtn = document.querySelector('.submit-btn');

        if (type === 'success') {
            submitBtn.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
            setTimeout(() => {
                submitBtn.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
            }, 1000);
        } else if (type === 'error') {
            submitBtn.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                submitBtn.style.animation = '';
            }, 500);
        }
    }

    // 管理员专属庆祝特效
    createAdminConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#e74c3c', '#c0392b', '#e67e22', '#f1c40f'],
                shapes: ['circle', 'square'],
                scalar: 1.2
            });

            // 第二次爆发
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 80,
                    origin: { x: 0, y: 0.6 },
                    colors: ['#e74c3c', '#c0392b']
                });
            }, 250);

            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 80,
                    origin: { x: 1, y: 0.6 },
                    colors: ['#e74c3c', '#c0392b']
                });
            }, 500);
        }
    }

    // 添加点击特效
    addClickEffects() {
        const interactiveElements = document.querySelectorAll('.input-group, .submit-btn, .switch-link, .info-item');

        interactiveElements.forEach(element => {
            element.addEventListener('click', function(e) {
                // 创建点击波纹效果
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                const ripple = document.createElement('div');
                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    border-radius: 50%;
                    background: rgba(231, 76, 60, 0.6);
                    transform: scale(0);
                    animation: ripple 0.6s linear;
                    pointer-events: none;
                    z-index: 100;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => {
                    if (ripple.parentNode === this) {
                        this.removeChild(ripple);
                    }
                }, 600);
            });
        });
    }
}

// 添加shake动画（如果不存在）
if (!document.querySelector('#shake-animation')) {
    const style = document.createElement('style');
    style.id = 'shake-animation';
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }
    `;
    document.head.appendChild(style);
}

// 初始化管理员登录
document.addEventListener('DOMContentLoaded', function() {
    new AdminLogin();

    // 检查是否已经登录
    const isAdmin = localStorage.getItem('isAdmin');
    const adminUser = localStorage.getItem('adminUser');

    if (isAdmin && adminUser) {
        console.log('🔐 检测到已登录的管理员:', adminUser);
    }
});

// 页面卸载前清理
window.addEventListener('beforeunload', () => {
    console.log('🔒 管理员登录页面关闭');
});
[file content end]