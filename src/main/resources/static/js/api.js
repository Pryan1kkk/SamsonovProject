// Работа с сервером и с «сессией» (токен и данные пользователя хранятся в localStorage)

const KEY = 'rental_session';
let session = load();

function load() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch (e) {
        return {};
    }
}

function save() {
    try {
        localStorage.setItem(KEY, JSON.stringify(session));
    } catch (e) {

    }
}

export class ApiError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export const isLogged = () => !!session.token;
export const getUser = () => session.user || null;

export function setSession(token, user) {
    session = { token, user };
    save();
    window.dispatchEvent(new Event('session'));
}

export function setUser(user) {
    session.user = user;
    save();
}

export function clearSession() {
    session = {};
    save();
    window.dispatchEvent(new Event('session'));
}

export async function api(method, path, body) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (session.token) headers['Authorization'] = 'Bearer ' + session.token;

    let res;
    try {
        res = await fetch(path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (e) {
        throw new ApiError(0, 'Не удалось связаться с сервером. Он запущен?');
    }

    if (res.status === 204) return null;

    let data = null;
    try {
        data = await res.json();
    } catch (e) {

    }

    if (!res.ok) {

        if (res.status === 401 && session.token) {
            clearSession();
            location.hash = '#/login';
        }
        let msg = (data && data.error) || 'Ошибка ' + res.status;
        if (data && data.fields) msg += ': ' + Object.values(data.fields).join('; ');
        throw new ApiError(res.status, msg);
    }
    return data;
}
