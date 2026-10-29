package com.ticketbooking.dto;

import com.ticketbooking.model.SeatStatus;

import java.math.BigDecimal;
import java.time.Instant;

public class SeatDto {
    private String id;
    private String eventId;
    private String seatNumber;
    private String categoryCode;
    private BigDecimal price;
    private SeatStatus status;
    private boolean heldByMe;
    private Instant holdExpiresAt;

    public SeatDto() {
    }

    public SeatDto(String id, String eventId, String seatNumber, String categoryCode,
                   BigDecimal price, SeatStatus status, boolean heldByMe, Instant holdExpiresAt) {
        this.id = id;
        this.eventId = eventId;
        this.seatNumber = seatNumber;
        this.categoryCode = categoryCode;
        this.price = price;
        this.status = status;
        this.heldByMe = heldByMe;
        this.holdExpiresAt = holdExpiresAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }

    public String getCategoryCode() {
        return categoryCode;
    }

    public void setCategoryCode(String categoryCode) {
        this.categoryCode = categoryCode;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public SeatStatus getStatus() {
        return status;
    }

    public void setStatus(SeatStatus status) {
        this.status = status;
    }

    public boolean isHeldByMe() {
        return heldByMe;
    }

    public void setHeldByMe(boolean heldByMe) {
        this.heldByMe = heldByMe;
    }

    public Instant getHoldExpiresAt() {
        return holdExpiresAt;
    }

    public void setHoldExpiresAt(Instant holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }
}

