import { api, getUser, download, upload } from '../api.js';
import { tile, h, field, select, money, date, badge, listingStatus, bookingStatus, action, notify, reload, askText, askConfirm, hashParam } from '../util.js';
import { reviewDialog } from './reviewDialog.js';
const whole = (v) => String(Math.round(v));
export async function partnerListings() {
    const [list, categories, cities, stats] = await Promise.all([
        api('GET', '/partner/listings'),
        api('GET', '/categories'),
        api('GET', '/cities'),
        api('GET', '/partner/stats'),
    ]);
    const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const cityName = Object.fromEntries(cities.map((c) => [c.id, c.name]));
    const user = getUser();
    let editingId = null;
    const title = h('input', { name: 'title', required: true });
    const category = select('category_id', categories.map((c) => [c.id, c.name]));
    const city = select('city_id', cities.map((c) => [c.id, c.name]));
    const price = h('input', { name: 'price_per_day', type: 'number', min: 1, step: '0.01', required: true });
    const description = h('textarea', { name: 'description', rows: 3 });
    const photos = h('textarea', { name: 'photos', rows: 2, placeholder: 'Ссылки на фото, по одной на строку (необязательно)' });
    const strip = h('div', { class: 'photo-strip' });
    const photoList = () => photos.value.split('\n').map((s) => s.trim()).filter(Boolean);
    function renderStrip() {
        strip.replaceChildren(...photoList().map((src, i) => h('div', { class: 'photo-item' },
            h('img', { src, alt: '' }),
            h('button', {
                type: 'button',
                title: 'Убрать фото',
                onclick: () => {
                    const rest = photoList();
                    rest.splice(i, 1);
                    photos.value = rest.join('\n');
                    renderStrip();
                },
            }, '×'))));
    }
    photos.addEventListener('input', renderStrip);
    const files = h('input', {
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,image/gif',
        multiple: true,
        onchange: async () => {
            for (const f of files.files) {
                if (f.size > 5 * 1024 * 1024) {
                    notify('Файл «' + f.name + '» больше 5 МБ', 'error');
                    continue;
                }
                try {
                    photos.value = photoList().concat(await upload(f)).join('\n');
                    renderStrip();
                } catch (err) {
                    notify(err.message, 'error');
                }
            }
            files.value = '';
        },
    });
    const formTitle = h('h2', {}, 'Новое объявление');
    const submit = h('button', { type: 'submit', class: 'primary' }, 'Опубликовать');
    const cancel = h('button', { type: 'button', class: 'hidden', onclick: () => resetForm() }, 'Отмена');
    function resetForm() {
        editingId = null;
        form.reset();
        renderStrip();
        formTitle.textContent = 'Новое объявление';
        submit.textContent = 'Опубликовать';
        cancel.classList.add('hidden');
    }
    function edit(l) {
        editingId = l.id;
        title.value = l.title;
        category.value = l.category_id;
        city.value = l.city_id;
        price.value = l.price_per_day;
        description.value = l.description || '';
        photos.value = l.photos.join('\n');
        renderStrip();
        formTitle.textContent = 'Редактирование объявления №' + l.id;
        submit.textContent = 'Сохранить';
        cancel.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth' });
    }
    const form = h('form', {
        onsubmit: async (e) => {
            e.preventDefault();
            const body = {
                category_id: Number(category.value),
                city_id: Number(city.value),
                title: title.value,
                description: description.value,
                price_per_day: Number(price.value),
                photos: photoList(),
            };
            submit.disabled = true;
            try {
                if (editingId) await api('PATCH', '/listings/' + editingId, body);
                else await api('POST', '/listings', body);
                notify(editingId ? 'Изменения сохранены' : 'Объявление создано');
                reload();
            } catch (err) {
                notify(err.message, 'error');
                submit.disabled = false;
            }
        },
    },
        formTitle,
        field('Название', title),
        h('div', { class: 'filters' }, field('Категория', category), field('Город', city), field('Цена за сутки, ₽', price)),
        field('Описание', description),
        field('Фотографии: загрузите файлы (JPG, PNG, WEBP или GIF до 5 МБ)', files),
        strip,
        field('Или вставьте ссылки', photos),
        h('div', { class: 'row' }, submit, cancel),
    );
    const rows = list.map((l) => h('tr', {},
        h('td', {}, h('a', { href: '#/listing/' + l.id }, l.title)),
        h('td', {}, categoryName[l.category_id]),
        h('td', {}, cityName[l.city_id]),
        h('td', {}, money(l.price_per_day)),
        h('td', {}, badge(l.status, listingStatus)),
        h('td', { class: 'actions' }, l.status === 'blocked' ? h('span', { class: 'muted' }, 'Скрыто администрацией, обратитесь к администратору') : [
            h('button', { class: 'small', onclick: () => edit(l) }, 'Изменить'),
            l.status !== 'hidden' && h('button', {
                class: 'small danger',
                onclick: async (e) => {
                    const target = e.currentTarget;
                    if (await askConfirm('Скрытие объявления', 'Скрыть объявление «' + l.title + '»? Позже его можно вернуть.', 'Скрыть')) {
                        action(() => api('DELETE', '/listings/' + l.id), 'Объявление скрыто')({ currentTarget: target });
                    }
                },
            }, 'Скрыть'),
            l.status === 'hidden' && h('button', {
                class: 'small',
                onclick: (e) => action(() => api('PATCH', '/listings/' + l.id + '/restore'), 'Объявление возвращено')(e),
            }, 'Вернуть'),
        ]),
    ));
    return h('div', {},
        h('h1', {}, 'Мои объявления'),
        h('div', { class: 'tiles six', style: 'margin-bottom: 20px' },
            tile('Объявлений', stats.listings, whole),
            tile('Новых заявок', stats.new_requests, whole),
            tile('Сейчас в аренде', stats.active_rentals, whole),
            tile('Завершено', stats.completed, whole),
            tile('Заработано', Number(stats.earned), money),
            tile('Рейтинг', stats.rating != null ? '★ ' + stats.rating.toFixed(1) : '—'),
        ),
        !user.verified && h('div', { class: 'flash error' },
            'Ваш аккаунт ещё не проверен администратором. Объявления сохраняются, но в каталоге появятся только после проверки.'),
        list.length
            ? h('div', { class: 'table-wrap' }, h('table', {},
                h('thead', {}, h('tr', {}, ['Название', 'Категория', 'Город', 'Цена за сутки', 'Статус', ''].map((t) => h('th', {}, t)))),
                h('tbody', {}, rows)))
            : h('p', { class: 'muted' }, 'У вас пока нет объявлений.'),
        h('div', { class: 'panel', style: 'margin-top: 20px' }, form),
    );
}
let statusFilter = '';
export async function partnerBookings() {
    if (hashParam('b')) statusFilter = '';
    const path = '/partner/bookings' + (statusFilter ? '?status=' + statusFilter : '');
    const [list, mine] = await Promise.all([api('GET', path), api('GET', '/reviews/mine')]);
    const filter = select('status', [['', 'Все статусы']].concat(Object.entries(bookingStatus)), statusFilter);
    filter.addEventListener('change', () => {
        statusFilter = filter.value;
        reload();
    });
    function actions(b) {
        const act = (method, suffix, okText, body) => action(() => api(method, `/partner/bookings/${b.id}/${suffix}`, body), okText);
        switch (b.status) {
            case 'pending':
                return [
                    h('button', { class: 'small primary', onclick: act('PATCH', 'confirm', 'Заявка подтверждена') }, 'Подтвердить'),
                    h('button', { class: 'small danger', onclick: act('PATCH', 'reject', 'Заявка отклонена') }, 'Отклонить'),
                ];
            case 'confirmed':
                return b.paid
                    ? h('button', { class: 'small primary', onclick: act('PATCH', 'issue', 'Снаряжение выдано') }, 'Выдать снаряжение')
                    : h('span', { class: 'muted' }, 'ждём оплату клиента');
            case 'active':
                return [
                    h('button', { class: 'small primary', onclick: act('PATCH', 'return', 'Возврат принят') }, 'Принять возврат'),
                    h('button', {
                        class: 'small danger',
                        onclick: async (e) => {
                            const target = e.currentTarget;
                            const text = await askText('Возврат с повреждением', 'Опишите повреждение или утерю. По этому будет открыт спор', 'Открыть спор');
                            if (text) act('PATCH', 'return', 'Спор открыт, администратор уведомлён', { damaged: true, description: text })({ currentTarget: target });
                        },
                    }, 'Вернули с повреждением'),
                ];
            case 'completed':
                return (mine[b.id] || []).includes('client')
                    ? h('span', { class: 'muted' }, 'Клиент оценён')
                    : h('button', { class: 'small', onclick: () => reviewDialog(b, [['client', 'Клиент']]) }, 'Оценить клиента');
            case 'disputed':
                return h('span', { class: 'muted' }, 'спор у администратора');
            default:
                return null;
        }
    }
    const rows = list.map((b) => h('tr', { 'data-id': b.id },
        h('td', {}, '№' + b.id),
        h('td', {}, b.client_name),
        h('td', {}, h('a', { href: '#/listing/' + b.listing_id }, b.listing_title)),
        h('td', {}, date(b.date_from) + ' — ' + date(b.date_to)),
        h('td', {}, money(b.total_price)),
        h('td', {}, badge(b.status, bookingStatus)),
        h('td', {}, b.paid ? 'Оплачено' : 'Нет'),
        h('td', { class: 'actions' }, actions(b)),
    ));
    return h('div', {},
        h('div', { class: 'row', style: 'justify-content: space-between; margin: 24px 0 16px' },
            h('h1', { style: 'margin: 0' }, 'Заявки на мои объявления'),
            h('button', { onclick: () => download('/partner/bookings/export', 'partner-bookings.csv').catch((e) => notify(e.message, 'error')) }, 'Скачать CSV'),
        ),
        h('div', { class: 'row', style: 'max-width: 280px; margin-bottom: 12px' }, filter),
        list.length
            ? h('div', { class: 'table-wrap' }, h('table', {},
                h('thead', {}, h('tr', {}, ['№', 'Клиент', 'Снаряжение', 'Период', 'Сумма', 'Статус', 'Оплата', ''].map((t) => h('th', {}, t)))),
                h('tbody', {}, rows)))
            : h('p', { class: 'muted' }, 'Заявок нет.'),
    );
}
