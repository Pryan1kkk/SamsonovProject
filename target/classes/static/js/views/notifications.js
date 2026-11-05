import { api } from '../api.js';
import { h, dateTime, action } from '../util.js';

export async function notifications() {
    const list = await api('GET', '/notifications');
    const unread = list.filter((n) => !n.read);

    const items = list.map((n) => h('li', { style: 'display: flex; gap: 12px; justify-content: space-between; align-items: center' },
        h('div', {},
            h('div', { style: n.read ? 'color: #777' : 'font-weight: 600' }, n.message),
            h('div', { class: 'muted', style: 'font-size: 12px' }, dateTime(n.created_at)),
        ),
        !n.read && h('button', {
            class: 'small',
            onclick: action(() => api('PATCH', `/notifications/${n.id}/read`)),
        }, 'Прочитано'),
    ));

    return h('div', {},
        h('h1', {}, 'Уведомления'),
        unread.length > 1 && h('p', {}, h('button', {
            onclick: action(async () => {
                for (const n of unread) await api('PATCH', `/notifications/${n.id}/read`);
            }),
        }, 'Отметить все прочитанными')),
        list.length
            ? h('div', { class: 'panel' }, h('ul', { class: 'plain' }, items))
            : h('p', { class: 'muted' }, 'Уведомлений пока нет.'),
    );
}
