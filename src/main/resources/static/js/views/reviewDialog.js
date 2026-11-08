import { api } from '../api.js';
import { h, field, select, openDialog, notify, reload } from '../util.js';
export function reviewDialog(booking, targets) {
    const target = select('target_type', targets);
    const rating = select('rating', [[5, '5 — отлично'], [4, '4'], [3, '3'], [2, '2'], [1, '1 — плохо']], 5);
    const comment = h('textarea', { name: 'comment', rows: 4, placeholder: 'Что понравилось или не понравилось' });
    const error = h('div', { class: 'flash error hidden' });
    const send = h('button', { type: 'submit', class: 'primary' }, 'Отправить');
    const form = h('form', {
        onsubmit: async (e) => {
            e.preventDefault();
            send.disabled = true;
            error.classList.add('hidden');
            try {
                await api('POST', '/reviews', {
                    booking_id: booking.id,
                    target_type: target.value,
                    rating: Number(rating.value),
                    comment: comment.value,
                });
                dlg.close();
                notify('Отзыв сохранён');
                reload();
            } catch (err) {
                error.textContent = err.message;
                error.classList.remove('hidden');
                send.disabled = false;
            }
        },
    },
        error,
        field('Кому', target),
        field('Оценка', rating),
        field('Комментарий', comment),
        h('div', { class: 'row' }, send, h('button', { type: 'button', onclick: () => dlg.close() }, 'Отмена')),
    );
    const dlg = openDialog('Отзыв по бронированию №' + booking.id, form);
}
