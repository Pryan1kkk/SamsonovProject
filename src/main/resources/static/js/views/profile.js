import { api, setUser } from '../api.js';
import { h, field, notify, roleName, dateTime, passwordInput, stars, avatar } from '../util.js';
export async function profile() {
    const me = await api('GET', '/users/me');
    const reviews = await api('GET', '/users/' + me.id + '/reviews');
    const button = h('button', { type: 'submit', class: 'primary' }, 'Сохранить');
    const form = h('form', {
        onsubmit: async (e) => {
            e.preventDefault();
            button.disabled = true;
            const data = Object.fromEntries(new FormData(form));
            if (!data.password) delete data.password;
            try {
                setUser(await api('PATCH', '/users/me', data));
                notify('Профиль обновлён');
                form.password.value = '';
            } catch (err) {
                notify(err.message, 'error');
            }
            button.disabled = false;
        },
    },
        field('Имя', h('input', { name: 'name', value: me.name, required: true })),
        field('Телефон', h('input', { name: 'phone', type: 'tel', value: me.phone || '' })),
        field('Новый пароль (оставьте пустым, чтобы не менять)', passwordInput({ name: 'password', minLength: 6, maxLength: 100, autocomplete: 'new-password' })),
        button,
    );
    return h('div', {},
        h('h1', {}, 'Профиль'),
        h('div', { class: 'listing-grid' },
            h('div', { class: 'panel' }, form),
            h('div', { class: 'panel' },
                h('h3', {}, me.email),
                h('p', { class: 'muted' }, 'Роль: ' + roleName[me.role]),
                me.role === 'partner' && h('p', {}, me.verified ? 'Аккаунт проверен' : 'Ожидает проверки администратором'),
                h('div', { class: 'lp-rate', style: 'margin: 8px 0' }, stars(me.rating || 0, true), h('span', { class: 'muted' }, me.rating != null ? me.rating.toFixed(1) + ' из 5' : 'Оценок пока нет')),
                h('p', { class: 'muted' }, 'Зарегистрирован: ' + dateTime(me.created_at)),
            ),
        ),
        reviews.length > 0 && h('h2', {}, 'Отзывы обо мне'),
        reviews.length > 0 && h('div', { class: 'panel' }, h('div', { class: 'review-list', style: 'border-top: none; margin-top: 0' }, reviews.map((r) => h('div', { class: 'review' },
            avatar(r.author_name),
            h('div', {},
                h('div', { class: 'review-top' }, h('strong', {}, r.author_name || 'Пользователь'), stars(r.rating), h('span', { class: 'muted' }, dateTime(r.created_at))),
                r.comment && h('p', { class: 'review-text' }, r.comment),
            ))))),
    );
}
