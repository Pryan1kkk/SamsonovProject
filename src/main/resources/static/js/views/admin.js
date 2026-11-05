import { api } from '../api.js';
import { h, field, select, money, badge, listingStatus, disputeStatus, action, notify, reload } from '../util.js';

let tab = 'partners';
let listingFilter = '';
let disputeFilter = 'open';

const tabs = [
    ['partners', 'Партнёры на проверке'],
    ['listings', 'Объявления'],
    ['disputes', 'Споры'],
    ['dictionaries', 'Справочники'],
];

function table(headers, rows, emptyText) {
    if (!rows.length) return h('p', { class: 'muted' }, emptyText);
    return h('div', { class: 'table-wrap' }, h('table', {},
        h('thead', {}, h('tr', {}, headers.map((t) => h('th', {}, t)))),
        h('tbody', {}, rows)));
}

async function partnersTab() {
    const list = await api('GET', '/admin/partners/pending');
    return table(['Название', 'Email', 'Телефон', ''], list.map((p) => h('tr', {},
        h('td', {}, p.name),
        h('td', {}, p.email),
        h('td', {}, p.phone || '—'),
        h('td', { class: 'actions' }, h('button', {
            class: 'small primary',
            onclick: action(() => api('PATCH', `/admin/partners/${p.id}/verify`), 'Партнёр подтверждён, его объявления опубликованы'),
        }, 'Подтвердить')),
    )), 'Нет партнёров, ожидающих проверки.');
}

async function listingsTab() {
    const list = await api('GET', '/admin/listings' + (listingFilter ? '?status=' + listingFilter : ''));
    const filter = select('status', [['', 'Все статусы']].concat(Object.entries(listingStatus)), listingFilter);
    filter.addEventListener('change', () => {
        listingFilter = filter.value;
        reload();
    });
    const moderate = (l, status, okText) => action(() => api('PATCH', `/admin/listings/${l.id}/moderate`, { status }), okText);

    return h('div', {},
        h('div', { style: 'max-width: 240px; margin-bottom: 12px' }, filter),
        table(['№', 'Название', 'Владелец', 'Цена', 'Статус', ''], list.map((l) => h('tr', {},
            h('td', {}, l.id),
            h('td', {}, h('a', { href: '#/listing/' + l.id }, l.title)),
            h('td', {}, l.partner_name),
            h('td', {}, money(l.price_per_day)),
            h('td', {}, badge(l.status, listingStatus)),
            h('td', { class: 'actions' },
                l.status !== 'active' && h('button', { class: 'small primary', onclick: moderate(l, 'active', 'Объявление опубликовано') }, 'Опубликовать'),
                l.status !== 'hidden' && h('button', { class: 'small danger', onclick: moderate(l, 'hidden', 'Объявление скрыто') }, 'Скрыть'),
            ),
        )), 'Объявлений нет.'),
    );
}

async function disputesTab() {
    const list = await api('GET', '/admin/disputes' + (disputeFilter ? '?status=' + disputeFilter : ''));
    const filter = select('status', [['', 'Все'], ['open', 'Открытые'], ['resolved', 'Решённые']], disputeFilter);
    filter.addEventListener('change', () => {
        disputeFilter = filter.value;
        reload();
    });

    return h('div', {},
        h('div', { style: 'max-width: 240px; margin-bottom: 12px' }, filter),
        table(['№', 'Бронирование', 'Описание', 'Статус', 'Решение', ''], list.map((d) => h('tr', {},
            h('td', {}, d.id),
            h('td', {}, '№' + d.booking_id),
            h('td', {}, d.description),
            h('td', {}, badge(d.status, disputeStatus)),
            h('td', {}, d.resolution || '—'),
            h('td', { class: 'actions' }, d.status === 'open' && h('button', {
                class: 'small primary',
                onclick: (e) => {
                    const text = prompt('Решение по спору (например, «удержан залог 500 ₽»):');
                    if (text && text.trim()) {
                        action(() => api('PATCH', `/admin/disputes/${d.id}/resolve`, { resolution: text.trim() }), 'Спор закрыт')(e);
                    }
                },
            }, 'Разобрать')),
        )), 'Споров нет.'),
    );
}

async function dictionariesTab() {
    const [categories, cities] = await Promise.all([api('GET', '/categories'), api('GET', '/cities')]);

    function block(title, list, path) {
        const input = h('input', { name: 'name', required: true, placeholder: 'Название' });
        const form = h('form', {
            class: 'row',
            onsubmit: async (e) => {
                e.preventDefault();
                try {
                    await api('POST', path, { name: input.value });
                    notify('Добавлено');
                    reload();
                } catch (err) {
                    notify(err.message, 'error');
                }
            },
        }, h('div', { style: 'flex: 1; min-width: 160px' }, input), h('button', { type: 'submit', class: 'primary' }, 'Добавить'));

        return h('div', { class: 'panel' },
            h('h3', {}, title),
            h('ul', { class: 'plain', style: 'margin-bottom: 12px' }, list.map((x) => h('li', {}, x.name))),
            form,
        );
    }

    return h('div', { class: 'filters', style: 'align-items: start' },
        block('Категории', categories, '/admin/categories'),
        block('Города', cities, '/admin/cities'),
    );
}

export async function admin() {
    const content = { partners: partnersTab, listings: listingsTab, disputes: disputesTab, dictionaries: dictionariesTab }[tab];
    return h('div', {},
        h('h1', {}, 'Администрирование'),
        h('div', { class: 'tabs' }, tabs.map(([key, text]) => h('button', {
            class: key === tab ? 'active' : '',
            onclick: () => {
                tab = key;
                reload();
            },
        }, text))),
        await content(),
    );
}
