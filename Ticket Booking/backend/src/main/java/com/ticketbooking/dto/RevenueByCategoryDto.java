package com.ticketbooking.dto;

import java.math.BigDecimal;

public class RevenueByCategoryDto {
    private String category;
    private long ticketsSold;
    private BigDecimal revenue;

    public RevenueByCategoryDto() {
    }

    public RevenueByCategoryDto(String category, long ticketsSold, BigDecimal revenue) {
        this.category = category;
        this.ticketsSold = ticketsSold;
        this.revenue = revenue;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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
}

