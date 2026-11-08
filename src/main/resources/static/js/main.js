import { api, getUser, isLogged, setUser, clearSession } from './api.js';
import { h, errorBox, roleName, notify } from './util.js';
import { login, register } from './views/auth.js';
import { catalog } from './views/catalog.js';
import { listing } from './views/listing.js';
import { myBookings } from './views/bookings.js';
import { partnerListings, partnerBookings } from './views/partner.js';
import { admin } from './views/admin.js';
import { notifications } from './views/notifications.js';
import { profile } from './views/profile.js';
const app = document.getElementById('app');
const nav = document.getElementById('nav');
const routes = [
    [/^#\/catalog$/, catalog],
    [/^#\/listing\/(\d+)$/, listing],
    [/^#\/login$/, login],
    [/^#\/register$/, register],
    [/^#\/my-bookings$/, myBookings, ['client']],
    [/^#\/partner\/listings$/, partnerListings, ['partner']],
    [/^#\/partner\/bookings$/, partnerBookings, ['partner']],
    [/^#\/admin$/, admin, ['admin']],
    [/^#\/notifications$/, notifications, ['client', 'partner', 'admin']],
    [/^#\/profile$/, profile, ['client', 'partner', 'admin']],
];
function savedTheme() {
    try {
        return localStorage.getItem('theme');
    } catch (e) {
        return null;
    }
}
function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    try {
        localStorage.setItem('theme', t);
    } catch (e) {
    }
}
applyTheme(savedTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
let unread = 0;
let navCounter = 0;
let lastHash = null;
function renderNav() {
    const user = getUser();
    const links = [['#/catalog', 'Каталог']];
    if (user && user.role === 'client') links.push(['#/my-bookings', 'Мои бронирования']);
    if (user && user.role === 'partner') {
        links.push(['#/partner/listings', 'Мои объявления'], ['#/partner/bookings', 'Заявки']);
    }
    if (user && user.role === 'admin') links.push(['#/admin', 'Администрирование']);
    if (user) links.push(['#/notifications', 'Уведомления' + (unread ? ' (' + unread + ')' : '')]);
    if (!user) links.push(['#/login', 'Войти'], ['#/register', 'Регистрация']);
    const current = location.hash || '#/catalog';
    const items = links.map(([href, text]) => h('a', { href, class: current.startsWith(href) ? 'current' : '' }, text));
    if (user) {
        items.push(
            h('a', { href: '#/profile', class: 'who' + (current === '#/profile' ? ' current' : '') }, user.name + ' (' + roleName[user.role] + ')'),
            h('a', { href: '#/catalog', onclick: () => {
                api('POST', '/auth/logout').catch(() => {});
                clearSession();
            } }, 'Выйти'),
        );
    }
    items.push(h('button', {
        class: 'theme-toggle',
        title: 'Сменить тему',
        onclick: () => {
            applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
            renderNav();
        },
    }, document.documentElement.dataset.theme === 'dark' ? 'Светлая' : 'Тёмная'));
    nav.replaceChildren(...items);
}
async function refreshUnread() {
    if (!isLogged()) {
        unread = 0;
        return;
    }
    try {
        const list = await api('GET', '/notifications');
        unread = list.filter((n) => !n.read).length;
    } catch (e) {
        unread = 0;
    }
    renderNav();
}
function highlight(full) {
    const q = full.split('?')[1];
    if (!q) return;
    const id = new URLSearchParams(q).get('b');
    history.replaceState(null, '', full.split('?')[0]);
    if (!id) return;
    const target = app.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!target) return;
    target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    target.classList.add('hl');
    setTimeout(() => target.classList.remove('hl'), 2600);
}
async function route() {
    const full = location.hash || '#/catalog';
    const hash = full.split('?')[0];
    const myNumber = ++navCounter;
    renderNav();
    const bar = document.getElementById('bar');
    const settle = () => {
        app.classList.remove('leaving');
        bar.className = 'done';
    };
    if (hash !== lastHash && app.firstElementChild) {
        app.classList.add('leaving');
        await new Promise((resolve) => setTimeout(resolve, 140));
        if (myNumber !== navCounter) return;
    }
    bar.className = 'run';
    for (const [re, view, roles] of routes) {
        const m = hash.match(re);
        if (!m) continue;
        const user = getUser();
        if (roles) {
            if (!user) {
                settle();
                location.hash = '#/login';
                return;
            }
            if (!roles.includes(user.role)) {
                settle();
                app.replaceChildren(h('h1', {}, 'Нет доступа'), h('p', { class: 'muted' }, 'Эта страница для другой роли.'));
                return;
            }
        }
        let content;
        try {
            content = await view(...m.slice(1));
        } catch (e) {
            content = errorBox(e.message);
        }
        if (myNumber !== navCounter) return;
        settle();
        app.replaceChildren(content);
        if (hash !== lastHash) window.scrollTo(0, 0);
        lastHash = hash;
        highlight(full);
        refreshUnread();
        return;
    }
    settle();
    app.replaceChildren(h('h1', {}, 'Страница не найдена'), h('a', { href: '#/catalog' }, 'В каталог'));
}
window.addEventListener('scroll', () => document.querySelector('.top').classList.toggle('scrolled', window.scrollY > 4), { passive: true });
window.addEventListener('hashchange', route);
window.addEventListener('session', () => {
    unread = 0;
    renderNav();
});
async function start() {
    if (isLogged()) {
        try {
            setUser(await api('GET', '/users/me'));
        } catch (e) {
        }
    }
    route();
}
start();
document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('button:not(:disabled):not(.cal-cell):not(.eye):not(.g-arrow):not(.g-thumb)');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const dot = h('span', { class: 'ripple', style: `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px` });
    btn.append(dot);
    setTimeout(() => dot.remove(), 600);
});
window.addEventListener('unhandledrejection', (e) => {
    e.preventDefault();
    notify('Что-то пошло не так, попробуйте ещё раз');
});
