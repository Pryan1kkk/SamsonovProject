package ru.rental.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum TargetType {
    LISTING, PARTNER, CLIENT;

    @JsonValue
    public String json() {
        return name().toLowerCase(Locale.ROOT);
    }

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public static TargetType from(String s) {
        return valueOf(s.trim().toUpperCase(Locale.ROOT));
    }
}
