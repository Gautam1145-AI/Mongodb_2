package com.ticketbooking.dto;

import java.math.BigDecimal;

public class DashboardOverviewDto {
    private long totalEvents;
    private long totalBookings;
    private long confirmedBookings;
    private long confirmedTickets;
    private long cancelledBookings;
    private double cancellationRate;
    private BigDecimal totalRevenue;
    private long totalSeats;
    private long availableSeats;
    private long heldSeats;
    private long bookedSeats;

    public DashboardOverviewDto() {
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getConfirmedBookings() {
        return confirmedBookings;
    }

    public void setConfirmedBookings(long confirmedBookings) {
        this.confirmedBookings = confirmedBookings;
    }

    public long getConfirmedTickets() {
        return confirmedTickets;
    }

    public void setConfirmedTickets(long confirmedTickets) {
        this.confirmedTickets = confirmedTickets;
    }

    public long getCancelledBookings() {
        return cancelledBookings;
    }

    public void setCancelledBookings(long cancelledBookings) {
        this.cancelledBookings = cancelledBookings;
    }

    public double getCancellationRate() {
        return cancellationRate;
    }

    public void setCancellationRate(double cancellationRate) {
        this.cancellationRate = cancellationRate;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalSeats() {
        return totalSeats;
    }

    public void setTotalSeats(long totalSeats) {
        this.totalSeats = totalSeats;
    }

    public long getAvailableSeats() {
        return availableSeats;
    }

    public void setAvailableSeats(long availableSeats) {
        this.availableSeats = availableSeats;
    }

    public long getHeldSeats() {
        return heldSeats;
    }

    public void setHeldSeats(long heldSeats) {
        this.heldSeats = heldSeats;
    }

    public long getBookedSeats() {
        return bookedSeats;
    }

    public void setBookedSeats(long bookedSeats) {
        this.bookedSeats = bookedSeats;
    }
}

