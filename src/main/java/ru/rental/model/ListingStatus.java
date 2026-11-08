package ru.rental.model;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import java.util.Locale;
public enum ListingStatus {
    ACTIVE, PENDING, HIDDEN, BLOCKED;
    @JsonValue
    public String json() {
        return name().toLowerCase(Locale.ROOT);
    }
    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static ListingStatus from(String s) {
        return valueOf(s.trim().toUpperCase(Locale.ROOT));
    }
}
