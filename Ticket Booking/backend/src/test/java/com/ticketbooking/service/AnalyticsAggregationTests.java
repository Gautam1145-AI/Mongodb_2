package com.ticketbooking.service;

import com.ticketbooking.analytics.AnalyticsService;
import com.ticketbooking.dto.DashboardOverviewDto;
import com.ticketbooking.dto.EventSalesDto;
import com.ticketbooking.dto.RevenueByCategoryDto;
import com.ticketbooking.model.*;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class AnalyticsAggregationTests {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        seatRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();

        // Create sample event
        Event e1 = new Event(
                null, "Summer Rock Fest", "Live rock", "CONCERT", "Rock Arena", "Austin, TX",
                LocalDate.now().plusDays(10), "18:00", "22:00", EventStatus.PUBLISHED,
                List.of(new TicketCategory("VIP", "VIP", BigDecimal.valueOf(100.0), 20)),
                null
        );
        Event savedE1 = eventRepository.save(e1);

        // Booking 1: CONFIRMED - 2 tickets ($200)
        Booking b1 = new Booking(
                null, "BK-TEST-101", "user1", "user1@example.com", "User One",
                savedE1.getId(), savedE1.getTitle(), List.of("VIP-1", "VIP-2"),
                BookingStatus.CONFIRMED, BigDecimal.valueOf(200.0), PaymentStatus.MOCK_PAID,
                "IDEMP-101", Instant.now()
        );
        b1.setEventCategory("CONCERT");
        bookingRepository.save(b1);

        // Booking 2: CONFIRMED - 1 ticket ($100)
        Booking b2 = new Booking(
                null, "BK-TEST-102", "user2", "user2@example.com", "User Two",
                savedE1.getId(), savedE1.getTitle(), List.of("VIP-3"),
                BookingStatus.CONFIRMED, BigDecimal.valueOf(100.0), PaymentStatus.MOCK_PAID,
                "IDEMP-102", Instant.now()
        );
        b2.setEventCategory("CONCERT");
        bookingRepository.save(b2);

        // Booking 3: CANCELLED - 1 ticket ($100) -> MUST BE EXCLUDED FROM REVENUE
        Booking b3 = new Booking(
                null, "BK-TEST-103", "user3", "user3@example.com", "User Three",
                savedE1.getId(), savedE1.getTitle(), List.of("VIP-4"),
                BookingStatus.CANCELLED, BigDecimal.valueOf(100.0), PaymentStatus.REFUNDED,
                "IDEMP-103", Instant.now()
        );
        b3.setEventCategory("CONCERT");
        bookingRepository.save(b3);
    }

    @Test
    @DisplayName("Dashboard KPI Aggregation: Revenue and ticket counts must exclude cancelled bookings")
    void testDashboardOverviewCalculations() {
        DashboardOverviewDto overview = analyticsService.getDashboardOverview();

        assertEquals(1, overview.getTotalEvents());
        assertEquals(3, overview.getTotalBookings());
        assertEquals(2, overview.getConfirmedBookings());
        assertEquals(1, overview.getCancelledBookings());

        // Confirmed revenue must be 200 + 100 = 300, ignoring the 100 from cancelled booking
        assertEquals(0, BigDecimal.valueOf(300.0).compareTo(overview.getTotalRevenue()));

        // Confirmed tickets count must be 2 + 1 = 3 tickets
        assertEquals(3, overview.getConfirmedTickets());
    }

    @Test
    @DisplayName("Event-wise Sales Aggregation: Should calculate tickets sold and revenue per event")
    void testEventWiseSalesAggregation() {
        List<EventSalesDto> sales = analyticsService.getEventWiseSales();

        assertEquals(1, sales.size());
        EventSalesDto eSales = sales.get(0);
        assertEquals("Summer Rock Fest", eSales.getEventTitle());
        assertEquals(2, eSales.getConfirmedBookings());
        assertEquals(3, eSales.getTicketsSold());
        assertEquals(0, BigDecimal.valueOf(300.0).compareTo(eSales.getRevenue()));
    }

    @Test
    @DisplayName("Category Breakdown Aggregation: Should aggregate revenue by event category")
    void testRevenueByCategoryAggregation() {
        List<RevenueByCategoryDto> catList = analyticsService.getRevenueByCategory();

        assertEquals(1, catList.size());
        RevenueByCategoryDto cat = catList.get(0);
        assertEquals("CONCERT", cat.getCategory());
        assertEquals(3, cat.getTicketsSold());
        assertEquals(0, BigDecimal.valueOf(300.0).compareTo(cat.getRevenue()));
    }
}
