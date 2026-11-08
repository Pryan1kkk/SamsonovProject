export function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs || {})) {
        if (value === null || value === undefined || value === false) continue;
        if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
        else if (key === 'class') node.className = value;
        else if (key in node) node[key] = value;
        else node.setAttribute(key, value);
    }
    for (const child of children.flat(Infinity)) {
        if (child === null || child === undefined || child === false) continue;
        node.append(child instanceof Node ? child : String(child));
    }
    return node;
}
const rub = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 });
export const money = (v) => rub.format(Number(v));
export function date(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.slice(0, 10).split('-');
    return `${d}.${m}.${y}`;
}
export function dateTime(iso) {
    return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}
export function today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
export function daysBetween(from, to) {
    return Math.round((Date.parse(to) - Date.parse(from)) / 86400000) + 1;
}
export const bookingStatus = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Подтверждено',
    active: 'Выдано',
    completed: 'Завершено',
    cancelled: 'Отменено',
    disputed: 'Спор',
};
export const listingStatus = { active: 'Опубликовано', pending: 'На проверке', hidden: 'Скрыто партнёром', blocked: 'Скрыто администрацией' };
export const disputeStatus = { open: 'Открыт', resolved: 'Решён' };
export const roleName = { client: 'клиент', partner: 'партнёр', admin: 'администратор' };
export function badge(status, labels) {
    return h('span', { class: 'badge badge-' + status }, labels[status] || status);
}
export function notify(text, type = 'ok') {
    const box = document.getElementById('flash');
    if (!box) return;
    const n = h('div', { class: 'flash ' + type }, text);
    const close = () => {
        n.classList.add('out');
        setTimeout(() => n.remove(), 300);
    };
    n.addEventListener('click', close);
    box.append(n);
    setTimeout(close, 4500);
}
export function stars(value, big = false) {
    const pct = Math.max(0, Math.min(5, Number(value) || 0)) / 5 * 100;
    return h('span', { class: 'stars-row' + (big ? ' big' : ''), role: 'img', 'aria-label': (Number(value) || 0).toFixed(1) + ' из 5' },
        h('span', { class: 'stars-bg' }, '★★★★★'),
        h('span', { class: 'stars-fill', style: 'width:' + pct + '%' }, '★★★★★'));
}
export function avatar(name, big = false) {
    const text = String(name || '?').trim();
    let hue = 0;
    for (const ch of text) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return h('span', { class: 'avatar' + (big ? ' big' : ''), style: `background: hsl(${hue} 38% 42%)` }, text.charAt(0).toUpperCase());
}
export function hashParam(name) {
    const q = location.hash.split('?')[1];
    return q ? new URLSearchParams(q).get(name) : null;
}
export const errorBox = (text) => h('div', { class: 'flash error' }, text);
export function reload() {
    window.dispatchEvent(new HashChangeEvent('hashchange'));
}
export function qs(obj) {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(obj)) {
        if (v !== '' && v !== null && v !== undefined) p.set(k, v);
    }
    const s = p.toString();
    return s ? '?' + s : '';
}
export function field(label, input) {
    return h('label', { class: 'field' }, h('span', {}, label), input);
}
export function select(name, options, value = '') {
    const s = h('select', { name }, options.map(([v, l]) => h('option', { value: v }, l)));
    if (value !== '' && value !== null && value !== undefined) s.value = String(value);
    return s;
}
export function action(fn, okText) {
    return async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        try {
            await fn();
            if (okText) notify(okText);
            reload();
        } catch (err) {
            notify(err.message, 'error');
            btn.disabled = false;
        }
    };
}
export function openDialog(title, ...content) {
    const dlg = h('dialog', { class: 'modal' }, h('h2', {}, title), ...content);
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
    return dlg;
}
const steps = ['Заявка', 'Подтверждено', 'Оплачено', 'Выдано', 'Завершено'];
export function stepper(b) {
    const special = { cancelled: 'Бронирование отменено', disputed: 'По возврату открыт спор' }[b.status];
    if (special) return h('div', { class: 'step-note ' + b.status }, special);
    const at = { pending: 0, confirmed: b.paid ? 2 : 1, active: 3, completed: 4 }[b.status];
    return h('div', { class: 'stepper' }, steps.map((t, i) => h('div', { class: 'step' + (i < at ? ' done' : i === at ? ' now' : '') },
        h('span', { class: 'dot' }), h('span', { class: 'label' }, t))));
}
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export function tile(label, value, format = String) {
    const num = h('div', { class: 'tile-value' }, format(typeof value === 'number' ? 0 : value));
    if (typeof value === 'number') {
        if (calm() || value === 0) {
            num.textContent = format(value);
        } else {
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min(1, (now - start) / 800);
                num.textContent = format(value * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }
    }
    return h('div', { class: 'tile' }, num, h('div', { class: 'muted' }, label));
}
const eyeOn = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const eyeOff = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9M9.9 5.2A10.7 10.7 0 0 1 12 5c7 0 11 7 11 7a18.6 18.6 0 0 1-2.2 3.2M1 1l22 22"/></svg>';
export function passwordInput(attrs) {
    const input = h('input', { type: 'password', ...attrs });
    const toggle = h('button', { type: 'button', class: 'eye', title: 'Показать пароль', tabindex: '-1' });
    toggle.innerHTML = eyeOn;
    const flip = () => {
        const shown = input.type === 'text';
        input.type = shown ? 'password' : 'text';
        toggle.innerHTML = shown ? eyeOn : eyeOff;
        toggle.title = shown ? 'Показать пароль' : 'Скрыть пароль';
    };
    toggle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        flip();
    });
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.detail === 0) flip();
    });
    return h('div', { class: 'pass' }, input, toggle);
}
export function askText(title, label, submitText, required = true) {
    return new Promise((resolve) => {
        let answer = null;
        const area = h('textarea', { rows: 4, maxLength: 1000, required });
        const send = h('button', { type: 'submit', class: 'primary' }, submitText);
        const form = h('form', {
            onsubmit: (e) => {
                e.preventDefault();
                answer = area.value.trim();
                dlg.close();
            },
        }, field(label, area), h('div', { class: 'row' }, send, h('button', { type: 'button', onclick: () => dlg.close() }, 'Отмена')));
        const dlg = openDialog(title, form);
        dlg.addEventListener('close', () => resolve(answer));
        area.focus();
    });
}
export function askConfirm(title, message, okText = 'Да') {
    return new Promise((resolve) => {
        let ok = false;
        const dlg = openDialog(title,
            h('p', {}, message),
            h('div', { class: 'row' },
                h('button', { class: 'danger', onclick: () => { ok = true; dlg.close(); } }, okText),
                h('button', { onclick: () => dlg.close() }, 'Отмена')));
        dlg.addEventListener('close', () => resolve(ok));
    });
}
