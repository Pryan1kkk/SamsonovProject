
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
export const listingStatus = { active: 'Опубликовано', pending: 'На проверке', hidden: 'Скрыто' };
export const disputeStatus = { open: 'Открыт', resolved: 'Решён' };
export const roleName = { client: 'клиент', partner: 'партнёр', admin: 'администратор' };

export function badge(status, labels) {
    return h('span', { class: 'badge badge-' + status }, labels[status] || status);
}

export function notify(text, type = 'ok') {
    const box = document.getElementById('flash');
    if (!box) return;
    const n = h('div', { class: 'flash ' + type }, text);
    box.append(n);
    setTimeout(() => n.remove(), 5000);
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
    // если значение не задано, остаётся выбранным первый пункт
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
