import { api } from '../api.js';
import { h, money, date, badge, bookingStatus, action } from '../util.js';
import { reviewDialog } from './reviewDialog.js';

export async function myBookings() {
    const list = await api('GET', '/bookings');

    const rows = list.map((b) => h('tr', {},
        h('td', {}, '№' + b.id),
        h('td', {}, h('a', { href: '#/listing/' + b.listing_id }, b.listing_title)),
        h('td', {}, date(b.date_from) + ' — ' + date(b.date_to)),
        h('td', {}, money(b.total_price)),
        h('td', {}, money(b.deposit)),
        h('td', {}, badge(b.status, bookingStatus)),
        h('td', {}, b.paid ? 'Оплачено' : 'Нет'),
        h('td', { class: 'actions' },
            b.status === 'confirmed' && !b.paid && h('button', {
                class: 'small primary',
                onclick: action(() => api('POST', `/bookings/${b.id}/pay`), 'Оплата прошла (имитация)'),
            }, 'Оплатить'),
            (b.status === 'pending' || b.status === 'confirmed') && h('button', {
                class: 'small danger',
                onclick: (e) => {
                    if (confirm('Отменить бронирование №' + b.id + '?')) {
                        action(() => api('PATCH', `/bookings/${b.id}/cancel`), 'Бронирование отменено')(e);
                    }
                },
            }, 'Отменить'),
            b.status === 'completed' && h('button', {
                class: 'small',
                onclick: () => reviewDialog(b, [['listing', 'Снаряжение'], ['partner', 'Партнёр']]),
            }, 'Оставить отзыв'),
        ),
    ));

    return h('div', {},
        h('h1', {}, 'Мои бронирования'),
        list.length
            ? h('div', { class: 'table-wrap' }, h('table', {},
                h('thead', {}, h('tr', {}, ['№', 'Снаряжение', 'Период', 'Стоимость', 'Залог', 'Статус', 'Оплата', ''].map((t) => h('th', {}, t)))),
                h('tbody', {}, rows)))
            : h('p', { class: 'muted' }, 'Бронирований пока нет. ', h('a', { href: '#/catalog' }, 'Выбрать снаряжение')),
        h('p', { class: 'hint' },
            'Порядок: заявка → партнёр подтверждает → вы оплачиваете → партнёр выдаёт снаряжение → возврат → отзыв.'),
    );
}
