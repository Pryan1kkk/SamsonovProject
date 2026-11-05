// Точка входа: меню и простой роутер на основе адреса после # (например, #/listing/3)

import { api, getUser, isLogged, setUser, clearSession } from './api.js';
import { h, errorBox, roleName } from './util.js';
import { login, register } from './views/auth.js';
import { catalog } from './views/catalog.js';
import { listing } from './views/listing.js';
import { myBookings } from './views/bookings.js';
import { partnerListings, partnerBookings } from './views/partner.js';
import { admin } from './views/admin.js';
import { notifications } from './views/notifications.js';

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
];

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
            h('span', { class: 'who' }, user.name + ' (' + roleName[user.role] + ')'),
            h('a', { href: '#/catalog', onclick: () => clearSession() }, 'Выйти'),
        );
    }
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

async function route() {
    const hash = location.hash || '#/catalog';
    const myNumber = ++navCounter;
    renderNav();

    for (const [re, view, roles] of routes) {
        const m = hash.match(re);
        if (!m) continue;

        const user = getUser();
        if (roles) {
            if (!user) {
                location.hash = '#/login';
                return;
            }
            if (!roles.includes(user.role)) {
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
        if (myNumber !== navCounter) return; // пока грузилось, пользователь ушёл на другую страницу

        app.replaceChildren(content);
        if (hash !== lastHash) window.scrollTo(0, 0);
        lastHash = hash;
        refreshUnread();
        return;
    }
    app.replaceChildren(h('h1', {}, 'Страница не найдена'), h('a', { href: '#/catalog' }, 'В каталог'));
}

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
