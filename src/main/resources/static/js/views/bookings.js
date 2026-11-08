import { api, download } from '../api.js';
import { h, money, date, badge, bookingStatus, action, stepper, notify, askConfirm } from '../util.js';
import { reviewDialog } from './reviewDialog.js';
export async function myBookings() {
    const [list, mine] = await Promise.all([api('GET', '/bookings'), api('GET', '/reviews/mine')]);
    const leftFor = (b) => [['listing', 'Снаряжение'], ['partner', 'Партнёр']].filter(([k]) => !(mine[b.id] || []).includes(k));
    const cards = list.map((b) => h('div', { class: 'panel booking', 'data-id': b.id },
        h('div', { class: 'booking-head' },
            h('div', {}, h('a', { href: '#/listing/' + b.listing_id, class: 'booking-title' }, b.listing_title),
                h('div', { class: 'muted' }, 'Бронирование №' + b.id)),
            badge(b.status, bookingStatus),
        ),
        stepper(b),
        h('div', { class: 'booking-facts' },
            h('div', {}, h('span', { class: 'muted' }, 'Период'), h('strong', {}, date(b.date_from) + ' — ' + date(b.date_to))),
            h('div', {}, h('span', { class: 'muted' }, 'Стоимость'), h('strong', {}, money(b.total_price))),
            h('div', {}, h('span', { class: 'muted' }, 'Залог'), h('strong', {}, money(b.deposit))),
            h('div', {}, h('span', { class: 'muted' }, 'Оплата'), h('strong', {}, b.paid ? 'Оплачено' : 'Нет')),
        ),
        h('div', { class: 'row' },
            b.status === 'confirmed' && !b.paid && h('button', {
                class: 'primary',
                onclick: action(() => api('POST', `/bookings/${b.id}/pay`), 'Оплата прошла (имитация)'),
            }, 'Оплатить'),
            (b.status === 'pending' || b.status === 'confirmed') && h('button', {
                class: 'danger',
                onclick: async (e) => {
                    const target = e.currentTarget;
                    if (await askConfirm('Отмена бронирования', 'Отменить бронирование №' + b.id + '?', 'Отменить бронирование')) {
                        action(() => api('PATCH', `/bookings/${b.id}/cancel`), 'Бронирование отменено')({ currentTarget: target });
                    }
                },
            }, 'Отменить'),
            b.status === 'completed' && (leftFor(b).length
                ? h('button', { onclick: () => reviewDialog(b, leftFor(b)) }, 'Оставить отзыв')
                : h('span', { class: 'muted' }, 'Отзыв оставлен')),
        ),
    ));
    return h('div', {},
        h('div', { class: 'row', style: 'justify-content: space-between; margin: 24px 0 16px' },
            h('h1', { style: 'margin: 0' }, 'Мои бронирования'),
            list.length > 0 && h('button', { onclick: () => download('/bookings/export', 'my-bookings.csv').catch((e) => notify(e.message, 'error')) }, 'Скачать CSV'),
        ),
        list.length
            ? h('div', {}, cards)
            : h('p', { class: 'muted' }, 'Бронирований пока нет. ', h('a', { href: '#/catalog' }, 'Выбрать снаряжение')),
        h('p', { class: 'hint' },
            'Порядок: заявка → партнёр подтверждает → вы оплачиваете → партнёр выдаёт снаряжение → возврат → отзыв.'),
    );
}
