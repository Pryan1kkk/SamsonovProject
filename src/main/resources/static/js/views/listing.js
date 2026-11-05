import { api, getUser } from '../api.js';
import { h, field, money, date, dateTime, today, daysBetween, notify } from '../util.js';

export async function listing(id) {
    const [l, busy, reviews, categories, cities] = await Promise.all([
        api('GET', '/listings/' + id),
        api('GET', `/listings/${id}/availability`),
        api('GET', `/listings/${id}/reviews`),
        api('GET', '/categories'),
        api('GET', '/cities'),
    ]);
    const category = categories.find((c) => c.id === l.category_id);
    const city = cities.find((c) => c.id === l.city_id);

    const info = h('div', {},
        l.photos.map((src) => h('img', { src, alt: '', onerror: (e) => e.target.remove() })),
        h('dl', { class: 'facts' },
            h('dt', {}, 'Категория'), h('dd', {}, category ? category.name : ''),
            h('dt', {}, 'Город'), h('dd', {}, city ? city.name : ''),
            h('dt', {}, 'Владелец'), h('dd', {}, l.partner_name),
            h('dt', {}, 'Цена'), h('dd', {}, money(l.price_per_day) + ' в сутки'),
            h('dt', {}, 'Рейтинг'), h('dd', {}, l.rating ? l.rating.toFixed(1) + ' из 5' : 'пока нет оценок'),
        ),
        h('p', {}, l.description || 'Описание не указано.'),

        h('h2', {}, 'Занятые даты'),
        busy.length
            ? h('ul', { class: 'plain' }, busy.map((b) => h('li', {}, date(b.date_from) + ' — ' + date(b.date_to))))
            : h('p', { class: 'muted' }, 'Ближайшие даты свободны.'),

        h('h2', {}, 'Отзывы'),
        reviews.length
            ? h('ul', { class: 'plain' }, reviews.map((r) => h('li', {},
                h('strong', {}, 'Оценка: ' + r.rating + '/5'),
                ' ',
                h('span', { class: 'muted' }, dateTime(r.created_at)),
                r.comment && h('div', {}, r.comment),
            )))
            : h('p', { class: 'muted' }, 'Отзывов пока нет.'),
    );

    return h('div', {},
        h('p', {}, h('a', { href: '#/catalog' }, '← Назад в каталог')),
        h('h1', {}, l.title),
        h('div', { class: 'listing-grid' }, info, bookingBox(l)),
    );
}

function bookingBox(l) {
    const user = getUser();
    const box = h('div', { class: 'panel' }, h('h3', {}, 'Забронировать'));

    if (!user) {
        box.append(h('p', {}, h('a', { href: '#/login' }, 'Войдите'), ' как клиент, чтобы оформить бронирование.'));
        return box;
    }
    if (user.role !== 'client') {
        box.append(h('p', { class: 'muted' }, 'Бронировать могут только клиенты.'));
        if (user.role === 'partner' && user.id === l.partner_id) {
            box.append(h('a', { href: '#/partner/listings' }, 'Управление объявлениями'));
        }
        return box;
    }

    const from = h('input', { name: 'date_from', type: 'date', required: true, min: today() });
    const to = h('input', { name: 'date_to', type: 'date', required: true, min: today() });
    const estimate = h('p', { class: 'muted' }, 'Выберите даты, чтобы увидеть стоимость.');
    const button = h('button', { type: 'submit', class: 'primary' }, 'Отправить заявку');

    function updateEstimate() {
        if (!from.value || !to.value) return;
        const days = daysBetween(from.value, to.value);
        estimate.textContent = days > 0
            ? `${days} дн. × ${money(l.price_per_day)} = ${money(days * l.price_per_day)} (плюс залог)`
            : 'Дата окончания раньше даты начала.';
    }
    from.addEventListener('change', updateEstimate);
    to.addEventListener('change', updateEstimate);

    const form = h('form', {
        onsubmit: async (e) => {
            e.preventDefault();
            button.disabled = true;
            try {
                await api('POST', '/bookings', { listing_id: l.id, date_from: from.value, date_to: to.value });
                notify('Заявка отправлена. Партнёр её рассмотрит, статус смотрите в «Моих бронированиях».');
                location.hash = '#/my-bookings';
            } catch (err) {
                notify(err.message, 'error');
                button.disabled = false;
            }
        },
    }, field('С', from), field('По (включительно)', to), estimate, button);

    box.append(form);
    return box;
}
