package ru.rental.service;
import ru.rental.dto.Dto.BookingDto;
import java.util.List;
public final class BookingCsv {
    private BookingCsv() {
    }
    public static String build(List<BookingDto> list) {
        StringBuilder sb = new StringBuilder("\uFEFF");
        sb.append("Номер;Снаряжение;Клиент;С;По;Статус;Стоимость;Залог;Оплачено\n");
        for (BookingDto b : list) {
            sb.append(b.id()).append(';')
                    .append(cell(b.listingTitle())).append(';')
                    .append(cell(b.clientName())).append(';')
                    .append(b.dateFrom()).append(';')
                    .append(b.dateTo()).append(';')
                    .append(b.status().json()).append(';')
                    .append(b.totalPrice()).append(';')
                    .append(b.deposit()).append(';')
                    .append(b.paid() ? "да" : "нет").append('\n');
        }
        return sb.toString();
    }
    private static String cell(String v) {
        return '"' + v.replace("\"", "\"\"") + '"';
    }
}
