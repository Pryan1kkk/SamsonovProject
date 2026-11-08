import { api, getUser } from '../api.js';
import { calendar } from '../calendar.js';
import { remember } from '../recent.js';
import { h, field, money, date, dateTime, today, daysBetween, notify, stars, avatar } from '../util.js';
function gallery(l) {
    const photos = l.photos;
    if (!photos.length) {
        return h('div', { class: 'gallery' }, h('div', { class: 'thumb big' }, l.title[0]));
    }
    let index = 0;
    const main = h('img', {
        class: 'g-main',
        src: photos[0],
        alt: l.title,
        decoding: 'async',
        onerror: (e) => e.target.replaceWith(h('div', { class: 'thumb big' }, l.title[0])),
    });
    const counter = h('span', { class: 'g-count' }, '1 / ' + photos.length);
    const thumbs = photos.map((src, i) => h('button', {
        type: 'button',
        class: 'g-thumb' + (i === 0 ? ' on' : ''),
        onclick: () => show(i),
    }, h('img', { src, alt: '', loading: 'lazy', decoding: 'async' })));
    function show(i) {
        index = (i + photos.length) % photos.length;
        main.classList.add('swap');
        setTimeout(() => {
            main.src = photos[index];
            main.classList.remove('swap');
        }, 130);
        counter.textContent = (index + 1) + ' / ' + photos.length;
        thumbs.forEach((t, k) => t.classList.toggle('on', k === index));
    }
    function zoom() {
        const big = h('img', { src: photos[index], alt: l.title });
        const dlg = h('dialog', { class: 'lightbox' }, big);
        const go = (d) => {
            show(index + d);
            big.src = photos[index];
        };
        const keys = (e) => {
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        if (photos.length > 1) {
            dlg.append(
                h('button', { type: 'button', class: 'g-arrow left', onclick: (e) => { e.stopPropagation(); go(-1); } }, '‹'),
                h('button', { type: 'button', class: 'g-arrow right', onclick: (e) => { e.stopPropagation(); go(1); } }, '›'),
            );
        }
        dlg.addEventListener('click', () => dlg.close());
        dlg.addEventListener('close', () => {
            document.removeEventListener('keydown', keys);
            dlg.remove();
        });
        document.addEventListener('keydown', keys);
        document.body.append(dlg);
        dlg.showModal();
    }
    const stage = h('div', { class: 'g-stage', onclick: zoom }, main, photos.length > 1 && counter, h('span', { class: 'g-zoom' }, 'Открыть'));
    if (photos.length > 1) {
        stage.append(
            h('button', { type: 'button', class: 'g-arrow left', onclick: (e) => { e.stopPropagation(); show(index - 1); } }, '‹'),
            h('button', { type: 'button', class: 'g-arrow right', onclick: (e) => { e.stopPropagation(); show(index + 1); } }, '›'),
        );
    }
    return h('div', { class: 'gallery' }, stage, photos.length > 1 && h('div', { class: 'g-thumbs' }, thumbs));
}
function ratingBlock(reviews) {
    const count = reviews.length;
    const avg = count ? reviews.reduce((a, r) => a + r.rating, 0) / count : 0;
    const rows = [5, 4, 3, 2, 1].map((n) => {
        const c = reviews.filter((r) => r.rating === n).length;
        const fill = h('div', { class: 'bar-fill', style: 'width: 0' });
        requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = (count ? c / count * 100 : 0) + '%'; }));
        return h('div', { class: 'bar-row slim' }, h('span', { class: 'bar-label' }, n + ' ★'), h('div', { class: 'bar-track' }, fill), h('span', { class: 'muted' }, String(c)));
    });
    return h('div', { class: 'rating-block' },
        h('div', { class: 'rating-big' }, h('div', { class: 'rating-num' }, count ? avg.toFixed(1) : '—'), stars(avg, true), h('div', { class: 'muted' }, count ? 'Отзывов: ' + count : 'Пока нет отзывов')),
        h('div', { class: 'rating-bars' }, rows),
    );
}
export async function listing(id) {
    const [l, busy, reviews, categories, cities] = await Promise.all([
        api('GET', '/listings/' + id),
        api('GET', `/listings/${id}/availability`),
        api('GET', `/listings/${id}/reviews`),
        api('GET', '/categories'),
        api('GET', '/cities'),
    ]);
    remember(l);
    const category = categories.find((c) => c.id === l.category_id);
    const city = cities.find((c) => c.id === l.city_id);
    const notice = {
        blocked: 'Объявление скрыто администрацией и недоступно для бронирования',
        hidden: 'Объявление скрыто владельцем',
        pending: 'Объявление ожидает проверки администратором',
    }[l.status];
    const info = h('div', { class: 'lp-main' },
        gallery(l),
        h('div', { class: 'lp-head' },
            h('div', { class: 'chips' },
                category && h('span', { class: 'chip' }, category.name),
                city && h('span', { class: 'chip' }, '📍 ' + city.name),
            ),
            h('h1', {}, l.title),
            h('div', { class: 'lp-rate' }, stars(l.rating || 0), h('span', { class: 'muted' }, l.rating ? l.rating.toFixed(1) + ' · ' + reviews.length + ' отз.' : 'Пока нет оценок')),
            notice && h('div', { class: 'notice' }, notice),
        ),
        h('div', { class: 'facts-grid' },
            h('div', { class: 'fact accent' }, h('div', { class: 'fact-value' }, money(l.price_per_day)), h('div', { class: 'muted' }, 'за сутки')),
            h('div', { class: 'fact' }, h('div', { class: 'fact-value' }, city ? city.name : '—'), h('div', { class: 'muted' }, 'город выдачи')),
            h('div', { class: 'fact' }, h('div', { class: 'fact-value' }, category ? category.name : '—'), h('div', { class: 'muted' }, 'категория')),
        ),
        h('div', { class: 'panel' },
            h('h2', {}, 'Описание'),
            h('p', { class: 'desc' }, l.description || 'Владелец не добавил описание.'),
            h('div', { class: 'owner' }, avatar(l.partner_name, true), h('div', {}, h('strong', {}, l.partner_name), h('div', { class: 'muted' }, 'Владелец снаряжения'))),
        ),
        h('div', { class: 'panel' },
            h('h2', {}, 'Занятые даты'),
            busy.length
                ? h('div', { class: 'busy-list' }, busy.map((b) => h('span', { class: 'busy-chip' }, date(b.date_from) + ' — ' + date(b.date_to))))
                : h('p', { class: 'free' }, '● Ближайшие даты свободны'),
        ),
        h('div', { class: 'panel' },
            h('h2', {}, 'Отзывы'),
            ratingBlock(reviews),
            reviews.length > 0 && h('div', { class: 'review-list' }, reviews.map((r) => h('div', { class: 'review' },
                avatar(r.author_name),
                h('div', {},
                    h('div', { class: 'review-top' }, h('strong', {}, r.author_name || 'Клиент'), stars(r.rating), h('span', { class: 'muted' }, dateTime(r.created_at))),
                    r.comment && h('p', { class: 'review-text' }, r.comment),
                ),
            ))),
        ),
    );
    return h('div', { class: 'lp' },
        h('p', { class: 'crumbs' }, h('a', { href: '#/catalog' }, '← Каталог'), category && h('span', { class: 'muted' }, ' / ' + category.name)),
        h('div', { class: 'lp-grid' }, info, bookingBox(l, busy)),
    );
}
function bookingBox(l, busy) {
    const user = getUser();
    const box = h('div', { class: 'panel booking-box' }, h('div', { class: 'bb-price' }, h('strong', {}, money(l.price_per_day)), h('span', { class: 'muted' }, ' / сутки')), h('h3', {}, 'Забронировать'));
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
    const cal = calendar(busy, (f, t) => {
        from.value = f;
        to.value = t;
        updateEstimate();
    });
    function updateEstimate() {
        cal.set(from.value, to.value);
        if (!from.value || !to.value) return;
        const days = daysBetween(from.value, to.value);
        estimate.textContent = days > 0
            ? `${days} дн. × ${money(l.price_per_day)} = ${money(days * l.price_per_day)} (плюс залог)`
            : 'Дата окончания раньше даты начала.';
    }
    const preset = (label, days) => h('button', {
        type: 'button',
        class: 'small',
        onclick: () => {
            const start = new Date();
            start.setDate(start.getDate() + 1);
            const end = new Date(start);
            end.setDate(end.getDate() + days - 1);
            const fmt = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            from.value = fmt(start);
            to.value = fmt(end);
            updateEstimate();
        },
    }, label);
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
    }, cal.el, h('div', { class: 'row', style: 'margin: 12px 0' }, preset('Завтра', 1), preset('3 дня', 3), preset('Неделя', 7)), field('С', from), field('По (включительно)', to), estimate, button);
    box.append(form);
    return box;
}
