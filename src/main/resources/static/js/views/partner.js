import { api, getUser } from '../api.js';
import { h, field, select, money, date, badge, listingStatus, bookingStatus, action, notify, reload } from '../util.js';
import { reviewDialog } from './reviewDialog.js';

export async function partnerListings() {
    const [list, categories, cities] = await Promise.all([
        api('GET', '/partner/listings'),
        api('GET', '/categories'),
        api('GET', '/cities'),
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
    const photos = h('textarea', { name: 'photos', rows: 2, placeholder: 'По одной ссылке на строку (необязательно)' });
    const formTitle = h('h2', {}, 'Новое объявление');
    const submit = h('button', { type: 'submit', class: 'primary' }, 'Опубликовать');
    const cancel = h('button', { type: 'button', class: 'hidden', onclick: () => resetForm() }, 'Отмена');

    function resetForm() {
        editingId = null;
        form.reset();
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
                photos: photos.value.split('\n').map((s) => s.trim()).filter(Boolean),
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
        field('Фотографии', photos),
        h('div', { class: 'row' }, submit, cancel),
    );

    const rows = list.map((l) => h('tr', {},
        h('td', {}, h('a', { href: '#/listing/' + l.id }, l.title)),
        h('td', {}, categoryName[l.category_id]),
        h('td', {}, cityName[l.city_id]),
        h('td', {}, money(l.price_per_day)),
        h('td', {}, badge(l.status, listingStatus)),
        h('td', { class: 'actions' },
            h('button', { class: 'small', onclick: () => edit(l) }, 'Изменить'),
            l.status !== 'hidden' && h('button', {
                class: 'small danger',
                onclick: (e) => {
                    if (confirm('Скрыть объявление «' + l.title + '»?')) {
                        action(() => api('DELETE', '/listings/' + l.id), 'Объявление скрыто')(e);
                    }
                },
            }, 'Скрыть'),
        ),
    ));

    return h('div', {},
        h('h1', {}, 'Мои объявления'),
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
    const path = '/partner/bookings' + (statusFilter ? '?status=' + statusFilter : '');
    const list = await api('GET', path);

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
                        onclick: (e) => {
                            const text = prompt('Опишите повреждение или утерю — по этому будет открыт спор:');
                            if (text !== null) act('PATCH', 'return', 'Спор открыт, администратор уведомлён', { damaged: true, description: text })(e);
                        },
                    }, 'Вернули с повреждением'),
                ];
            case 'completed':
                return h('button', { class: 'small', onclick: () => reviewDialog(b, [['client', 'Клиент']]) }, 'Оценить клиента');
            case 'disputed':
                return h('span', { class: 'muted' }, 'спор у администратора');
            default:
                return null;
        }
    }

    const rows = list.map((b) => h('tr', {},
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
        h('h1', {}, 'Заявки на мои объявления'),
        h('div', { class: 'row', style: 'max-width: 280px; margin-bottom: 12px' }, filter),
        list.length
            ? h('div', { class: 'table-wrap' }, h('table', {},
                h('thead', {}, h('tr', {}, ['№', 'Клиент', 'Снаряжение', 'Период', 'Сумма', 'Статус', 'Оплата', ''].map((t) => h('th', {}, t)))),
                h('tbody', {}, rows)))
            : h('p', { class: 'muted' }, 'Заявок нет.'),
    );
}
