import { h, notify } from './util.js';
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
export function calendar(busy, onPick) {
    const taken = new Set();
    for (const b of busy) {
        const end = new Date(b.date_to + 'T00:00:00');
        for (const d = new Date(b.date_from + 'T00:00:00'); d <= end; d.setDate(d.getDate() + 1)) taken.add(iso(d));
    }
    const todayIso = iso(new Date());
    const view = new Date();
    view.setDate(1);
    let start = null;
    let end = null;
    const root = h('div', { class: 'cal' });
    function clash(from, to) {
        for (const d = new Date(from + 'T00:00:00'); iso(d) <= to; d.setDate(d.getDate() + 1)) {
            if (taken.has(iso(d))) return true;
        }
        return false;
    }
    function pick(day) {
        if (!start || end) {
            start = day;
            end = null;
        } else if (day < start) {
            start = day;
        } else if (clash(start, day)) {
            notify('В выбранном периоде есть занятые даты', 'error');
            start = day;
        } else {
            end = day;
        }
        onPick(start, end || start);
        draw();
    }
    function draw() {
        const first = new Date(view);
        const offset = (first.getDay() + 6) % 7;
        const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < offset; i++) cells.push(h('span', { class: 'cal-cell empty' }));
        for (let n = 1; n <= days; n++) {
            const day = view.getFullYear() + '-' + pad(view.getMonth() + 1) + '-' + pad(n);
            const past = day < todayIso;
            const busyDay = taken.has(day);
            const to = end || start;
            const inRange = start && day >= start && day <= to;
            const cls = ['cal-cell', past && 'past', busyDay && 'busy', inRange && 'range', (day === start || day === to) && inRange && 'edge', day === todayIso && 'today'].filter(Boolean).join(' ');
            cells.push(h('button', { type: 'button', class: cls, disabled: past || busyDay, onclick: () => pick(day) }, String(n)));
        }
        root.replaceChildren(
            h('div', { class: 'cal-head' },
                h('button', { type: 'button', class: 'small', onclick: () => { view.setMonth(view.getMonth() - 1); draw(); } }, '‹'),
                h('strong', {}, monthNames[view.getMonth()] + ' ' + view.getFullYear()),
                h('button', { type: 'button', class: 'small', onclick: () => { view.setMonth(view.getMonth() + 1); draw(); } }, '›'),
            ),
            h('div', { class: 'cal-grid' },
                ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => h('span', { class: 'cal-dow' }, d)),
                cells),
            h('div', { class: 'cal-legend muted' }, h('span', { class: 'dot-busy' }), ' занято'),
        );
    }
    draw();
    return {
        el: root,
        set(from, to) {
            start = from || null;
            end = to && to !== from ? to : null;
            if (start) {
                view.setFullYear(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, 1);
            }
            draw();
        },
    };
}
