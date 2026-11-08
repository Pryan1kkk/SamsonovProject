import { recent } from '../recent.js';
import { api } from '../api.js';
import { h, field, select, money, qs, errorBox, reload, stars } from '../util.js';
let filters = {};
export async function catalog() {
    const [categories, cities] = await Promise.all([api('GET', '/categories'), api('GET', '/cities')]);
    const categoryName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const cityName = Object.fromEntries(cities.map((c) => [c.id, c.name]));
    const results = h('div', { class: 'cards' });
    const count = h('div', { class: 'muted', style: 'margin-top: 4px' });
    function card(l) {
        return h('a', { class: 'card', href: '#/listing/' + l.id },
            l.photos.length > 0
                ? h('img', { src: l.photos[0], alt: '', loading: 'lazy', decoding: 'async', onerror: (e) => e.target.replaceWith(h('div', { class: 'thumb' }, l.title[0])) })
                : h('div', { class: 'thumb' }, l.title[0]),
            h('h3', {}, l.title),
            l.rating != null && h('div', { class: 'card-rate' }, stars(l.rating), h('span', { class: 'muted' }, l.rating.toFixed(1))),
            h('div', { class: 'meta' }, categoryName[l.category_id] + ', ' + cityName[l.city_id]),
            h('div', { class: 'price' }, money(l.price_per_day) + ' / сутки'),
        );
    }
    async function load() {
        results.replaceChildren(...[1, 2, 3, 4].map(() => h('div', { class: 'skeleton' })));
        try {
            const list = await api('GET', '/listings' + qs(filters));
            count.textContent = list.length ? 'Найдено: ' + list.length : '';
            results.replaceChildren(...(list.length
                ? list.map(card)
                : [h('p', { class: 'muted' }, 'По вашему запросу ничего не найдено.')]));
        } catch (e) {
            results.replaceChildren(errorBox(e.message));
        }
    }
    const allOption = (text) => [['', text]];
    const form = h('form', {
        class: 'filters',
        onsubmit: (e) => {
            e.preventDefault();
            filters = Object.fromEntries(new FormData(form));
            load();
        },
    },
        field('Поиск по названию', h('input', { name: 'q', value: filters.q || '', placeholder: 'Например, палатка' })),
        field('Сортировка', select('sort', [['', 'Сначала новые'], ['price_asc', 'Сначала дешёвые'], ['price_desc', 'Сначала дорогие']], filters.sort || '')),
        field('Категория', select('category_id', allOption('Все').concat(categories.map((c) => [c.id, c.name])), filters.category_id || '')),
        field('Город', select('city_id', allOption('Все').concat(cities.map((c) => [c.id, c.name])), filters.city_id || '')),
        field('С даты', h('input', { name: 'date_from', type: 'date', value: filters.date_from || '' })),
        field('По дату', h('input', { name: 'date_to', type: 'date', value: filters.date_to || '' })),
        field('Цена от, ₽', h('input', { name: 'price_min', type: 'number', min: 0, value: filters.price_min || '' })),
        field('Цена до, ₽', h('input', { name: 'price_max', type: 'number', min: 0, value: filters.price_max || '' })),
        h('div', { class: 'row' },
            h('button', { type: 'submit', class: 'primary' }, 'Найти'),
            h('button', {
                type: 'button',
                onclick: () => {
                    filters = {};
                    form.reset();
                    load();
                },
            }, 'Сбросить'),
        ),
    );
    load();
    return h('div', {},
        h('div', { class: 'hero' },
            h('h1', {}, 'Снаряжение для активного отдыха'),
            h('p', {}, 'Палатки, велосипеды, лыжи и байдарки напрокат в вашем городе'),
        ),
        h('div', { style: 'height:18px' }),
        h('div', { class: 'chips filter-chips' }, [['', 'Все']].concat(categories.map((c) => [String(c.id), c.name])).map(([id, name]) => h('button', {
            type: 'button',
            class: 'chip' + ((filters.category_id || '') === id ? ' on' : ''),
            onclick: () => {
                filters = { ...filters, category_id: id };
                reload();
            },
        }, name))),
        recent().length > 0 && h('div', { class: 'recent' }, h('span', { class: 'muted' }, 'Вы смотрели: '),
            recent().map((x) => h('a', { href: '#/listing/' + x.id, class: 'chip' }, x.title))),
        h('div', { class: 'panel' }, form),
        count,
        results,
    );
}
