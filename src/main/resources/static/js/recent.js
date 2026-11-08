const KEY = 'rental_recent';
export function recent() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
        return [];
    }
}
export function remember(listing) {
    const list = recent().filter((x) => x.id !== listing.id);
    list.unshift({ id: listing.id, title: listing.title });
    try {
        localStorage.setItem(KEY, JSON.stringify(list.slice(0, 6)));
    } catch (e) {
    }
}
