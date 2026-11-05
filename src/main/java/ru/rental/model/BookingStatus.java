package ru.rental.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.List;
import java.util.Locale;

public enum BookingStatus {
    PENDING, CONFIRMED, ACTIVE, COMPLETED, CANCELLED, DISPUTED;

    public static final List<BookingStatus> BLOCKING = List.of(CONFIRMED, ACTIVE);

    @JsonValue
    public String json() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static BookingStatus from(String s) {
        return valueOf(s.trim().toUpperCase(Locale.ROOT));
    }
}
