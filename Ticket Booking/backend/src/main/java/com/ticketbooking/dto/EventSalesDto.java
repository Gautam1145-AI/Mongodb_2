package com.ticketbooking.dto;

import java.math.BigDecimal;

public class EventSalesDto {
    private String eventId;
    private String eventTitle;
    private String category;
    private long confirmedBookings;
    private long ticketsSold;
    private BigDecimal revenue;
    private int totalCapacity;
    private double occupancyRate;

    public EventSalesDto() {
    }

    public EventSalesDto(String eventId, String eventTitle, String category, long confirmedBookings,
                         long ticketsSold, BigDecimal revenue, int totalCapacity, double occupancyRate) {
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.category = category;
        this.confirmedBookings = confirmedBookings;
        this.ticketsSold = ticketsSold;
        this.revenue = revenue;
        this.totalCapacity = totalCapacity;
        this.occupancyRate = occupancyRate;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public void setEventTitle(String eventTitle) {
        this.eventTitle = eventTitle;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public long getConfirmedBookings() {
        return confirmedBookings;
    }

    public void setConfirmedBookings(long confirmedBookings) {
        this.confirmedBookings = confirmedBookings;
    }

    public long getTicketsSold() {
        return ticketsSold;
    }

    public void setTicketsSold(long ticketsSold) {
        this.ticketsSold = ticketsSold;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }

    public int getTotalCapacity() {
        return totalCapacity;
    }

    public void setTotalCapacity(int totalCapacity) {
        this.totalCapacity = totalCapacity;
    }

    public double getOccupancyRate() {
        return occupancyRate;
    }

    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRate = occupancyRate;
    }
}

