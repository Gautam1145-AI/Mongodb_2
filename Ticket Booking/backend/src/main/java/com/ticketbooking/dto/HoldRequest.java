package com.ticketbooking.dto;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public class HoldRequest {

    @NotEmpty(message = "At least one seat number must be specified")
    private List<String> seatNumbers;

    public HoldRequest() {
    }

    public HoldRequest(List<String> seatNumbers) {
        this.seatNumbers = seatNumbers;
    }

    public List<String> getSeatNumbers() {
        return seatNumbers;
    }

    public void setSeatNumbers(List<String> seatNumbers) {
        this.seatNumbers = seatNumbers;
    }
}

