package com.ticketbooking.controller;

import com.ticketbooking.analytics.AnalyticsService;
import com.ticketbooking.dto.DailySalesDto;
import com.ticketbooking.dto.DashboardOverviewDto;
import com.ticketbooking.dto.EventSalesDto;
import com.ticketbooking.dto.RevenueByCategoryDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDto> getOverview() {
        return ResponseEntity.ok(analyticsService.getDashboardOverview());
    }

    @GetMapping("/events")
    public ResponseEntity<List<EventSalesDto>> getEventWiseSales() {
        return ResponseEntity.ok(analyticsService.getEventWiseSales());
    }

    @GetMapping("/revenue-by-category")
    public ResponseEntity<List<RevenueByCategoryDto>> getRevenueByCategory() {
        return ResponseEntity.ok(analyticsService.getRevenueByCategory());
    }

    @GetMapping("/daily-sales")
    public ResponseEntity<List<DailySalesDto>> getDailySales() {
        return ResponseEntity.ok(analyticsService.getDailySalesTrend());
    }
}

