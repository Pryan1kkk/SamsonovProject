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
const dictCache = new Map();
const pending = new Map();
export async function api(method, path, body) {
    const dict = method === 'GET' && (path === '/categories' || path === '/cities');
    if (dict) {
        const hit = dictCache.get(path);
        if (hit && Date.now() - hit.at < 60000) return hit.data;
    }
    if (method !== 'GET') dictCache.clear();
    const key = method === 'GET' ? path + '|' + (session.token || '') : null;
    if (key && pending.has(key)) return pending.get(key);
    const promise = request(method, path, body);
    if (key) {
        pending.set(key, promise);
        const done = () => pending.delete(key);
        promise.then(done, done);
    }
    const data = await promise;
    if (dict) dictCache.set(path, { at: Date.now(), data });
    return data;
}
async function request(method, path, body) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (session.token) headers['Authorization'] = 'Bearer ' + session.token;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let res;
    try {
        res = await fetch(path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
    } catch (e) {
        throw new ApiError(0, e.name === 'AbortError' ? 'Сервер долго не отвечает, попробуйте ещё раз' : 'Не удалось связаться с сервером. Он запущен?');
    } finally {
        clearTimeout(timer);
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
        let msg = (data && data.error) || (res.status === 429 ? 'Слишком много запросов, подождите минуту' : 'Ошибка ' + res.status);
        if (data && data.fields) msg += ': ' + Object.values(data.fields).join('; ');
        throw new ApiError(res.status, msg);
    }
    return data;
}
export async function upload(file) {
    const body = new FormData();
    body.append('file', file);
    let res;
    try {
        res = await fetch('/uploads', { method: 'POST', headers: { Authorization: 'Bearer ' + session.token }, body });
    } catch (e) {
        throw new ApiError(0, 'Не удалось связаться с сервером');
    }
    let data = null;
    try {
        data = await res.json();
    } catch (e) {
    }
    if (!res.ok) throw new ApiError(res.status, (data && data.error) || 'Не удалось загрузить файл');
    return data.url;
}
export async function download(path, filename) {
    const res = await fetch(path, { headers: session.token ? { Authorization: 'Bearer ' + session.token } : {} });
    if (!res.ok) throw new ApiError(res.status, 'Не удалось скачать файл');
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
