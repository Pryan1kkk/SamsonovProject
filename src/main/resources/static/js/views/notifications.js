import { api } from '../api.js';
import { h, dateTime, action } from '../util.js';
export async function notifications() {
    const list = await api('GET', '/notifications');
    const unread = list.filter((n) => !n.read);
    async function open(n) {
        try {
            if (!n.read) await api('PATCH', `/notifications/${n.id}/read`);
        } catch (e) {
        }
        location.hash = n.link;
    }
    const items = list.map((n) => h('div', {
        class: 'notif' + (n.read ? '' : ' unread') + (n.link ? ' link' : ''),
        onclick: n.link ? (e) => {
            if (!e.target.closest('button')) open(n);
        } : null,
    },
        h('div', {},
            h('div', { class: 'n-text' }, n.message),
            h('div', { class: 'muted', style: 'font-size: 12px' }, dateTime(n.created_at)),
        ),
        h('div', { class: 'row' },
            n.link && h('span', { class: 'go' }, 'Перейти →'),
            !n.read && h('button', {
                class: 'small',
                onclick: action(() => api('PATCH', `/notifications/${n.id}/read`)),
            }, 'Прочитано'),
        ),
    ));
    return h('div', {},
        h('h1', {}, 'Уведомления'),
        unread.length > 1 && h('p', {}, h('button', {
            onclick: action(async () => {
                await api('PATCH', '/notifications/read-all');
            }),
        }, 'Отметить все прочитанными')),
        list.length
            ? h('div', {}, items)
            : h('p', { class: 'muted' }, 'Уведомлений пока нет.'),
    );
}
