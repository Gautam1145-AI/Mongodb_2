package com.ticketbooking.dto;

import java.math.BigDecimal;

public class DailySalesDto {
    private String date;
    private long bookingsCount;
    private long ticketsCount;
    private BigDecimal revenue;

    public DailySalesDto() {
    }

    public DailySalesDto(String date, long bookingsCount, long ticketsCount, BigDecimal revenue) {
        this.date = date;
        this.bookingsCount = bookingsCount;
        this.ticketsCount = ticketsCount;
        this.revenue = revenue;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getBookingsCount() {
        return bookingsCount;
    }

    public void setBookingsCount(long bookingsCount) {
        this.bookingsCount = bookingsCount;
    }

    public long getTicketsCount() {
        return ticketsCount;
    }

    public void setTicketsCount(long ticketsCount) {
        this.ticketsCount = ticketsCount;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}

