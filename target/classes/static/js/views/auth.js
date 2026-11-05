import { api, setSession } from '../api.js';
import { h, field, select, notify } from '../util.js';

function goHome(user) {
    const target = { client: '#/catalog', partner: '#/partner/listings', admin: '#/admin' }[user.role];
    location.hash = target;
}

function submitHandler(form, button, request) {
    return async (e) => {
        e.preventDefault();
        button.disabled = true;
        try {
            const res = await request(Object.fromEntries(new FormData(form)));
            setSession(res.token, res.user);
            notify('Добро пожаловать, ' + res.user.name + '!');
            goHome(res.user);
        } catch (err) {
            notify(err.message, 'error');
            button.disabled = false;
        }
    };
}

export async function login() {
    const button = h('button', { type: 'submit', class: 'primary' }, 'Войти');
    const form = h('form', {},
        field('Email', h('input', { name: 'email', type: 'email', required: true, autocomplete: 'username' })),
        field('Пароль', h('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password' })),
        button,
    );
    form.addEventListener('submit', submitHandler(form, button, (data) => api('POST', '/auth/login', data)));

    return h('div', { class: 'narrow' },
        h('h1', {}, 'Вход'),
        form,
        h('p', { class: 'hint' }, 'Нет аккаунта? ', h('a', { href: '#/register' }, 'Зарегистрируйтесь')),
    );
}

export async function register() {
    const button = h('button', { type: 'submit', class: 'primary' }, 'Зарегистрироваться');
    const form = h('form', {},
        field('Имя или название проката', h('input', { name: 'name', required: true })),
        field('Email', h('input', { name: 'email', type: 'email', required: true })),
        field('Телефон', h('input', { name: 'phone', type: 'tel' })),
        field('Пароль (не короче 6 символов)', h('input', { name: 'password', type: 'password', required: true, minLength: 6 })),
        field('Я хочу', select('role', [['client', 'арендовать снаряжение'], ['partner', 'сдавать снаряжение']], 'client')),
        button,
    );
    form.addEventListener('submit', submitHandler(form, button, (data) => api('POST', '/auth/register', data)));

    return h('div', { class: 'narrow' },
        h('h1', {}, 'Регистрация'),
        form,
        h('p', { class: 'hint' }, 'Партнёр начнёт публиковать объявления после проверки администратором.'),
    );
}
