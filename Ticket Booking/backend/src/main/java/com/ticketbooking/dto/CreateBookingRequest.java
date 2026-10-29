package com.ticketbooking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class CreateBookingRequest {

    @NotBlank(message = "Event ID is required")
    private String eventId;

    @NotEmpty(message = "At least one seat must be selected")
    private List<String> seatNumbers;

    private String idempotencyKey;

    private String paymentMethod = "MOCK_CARD";

    public CreateBookingRequest() {
    }

    public CreateBookingRequest(String eventId, List<String> seatNumbers, String idempotencyKey, String paymentMethod) {
        this.eventId = eventId;
        this.seatNumbers = seatNumbers;
        this.idempotencyKey = idempotencyKey;
        this.paymentMethod = paymentMethod != null ? paymentMethod : "MOCK_CARD";
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public List<String> getSeatNumbers() {
        return seatNumbers;
    }

    public void setSeatNumbers(List<String> seatNumbers) {
        this.seatNumbers = seatNumbers;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}

