package com.ticketbooking.dto;

import java.time.Instant;
import java.util.List;

public class HoldResponse {
    private String eventId;
    private List<String> heldSeats;
    private Instant expiresAt;
    private long remainingSeconds;
    private String message;

    public HoldResponse() {
    }

    public HoldResponse(String eventId, List<String> heldSeats, Instant expiresAt, long remainingSeconds, String message) {
        this.eventId = eventId;
        this.heldSeats = heldSeats;
        this.expiresAt = expiresAt;
        this.remainingSeconds = remainingSeconds;
        this.message = message;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public List<String> getHeldSeats() {
        return heldSeats;
    }

    public void setHeldSeats(List<String> heldSeats) {
        this.heldSeats = heldSeats;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(long remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

