package com.ticketbooking.service;

import com.ticketbooking.dto.BookingResponseDto;
import com.ticketbooking.dto.CreateBookingRequest;
import com.ticketbooking.dto.CreateEventRequest;
import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.exception.BadRequestException;
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
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class BookingServiceTests {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private EventService eventService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private SeatRepository seatRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private EventResponseDto testEvent;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        seatRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();

        testUser = userRepository.save(new User(null, "Test User", "testuser@example.com", "hash", Role.ROLE_USER));

        CreateEventRequest req = new CreateEventRequest();
        req.setTitle("Symphony Orchestra Special");
        req.setDescription("Grand classical symphony concert.");
        req.setCategory("CONCERT");
        req.setVenue("Royal Symphony Hall");
        req.setLocation("Vienna, Austria");
        req.setEventDate(LocalDate.now().plusDays(20));
        req.setStartTime("19:00");
        req.setTicketCategories(List.of(
                new TicketCategory("VIP", "VIP Box", BigDecimal.valueOf(150.0), 4),
                new TicketCategory("STALL", "Front Stall", BigDecimal.valueOf(80.0), 10)
        ));
        testEvent = eventService.createEvent(req);
    }

    @Test
    @DisplayName("Should successfully book available seats and calculate total amount correctly")
    void testCreateBookingSuccess() {
        CreateBookingRequest req = new CreateBookingRequest(
                testEvent.getId(),
                List.of("VIP-1", "VIP-2"),
                "IDEMP-TEST-001",
                "MOCK_CARD"
        );

        BookingResponseDto booking = bookingService.createBooking(req, testUser.getId());

        assertNotNull(booking.getBookingRef());
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());
        assertEquals(PaymentStatus.MOCK_PAID, booking.getPaymentStatus());
        assertEquals(2, booking.getSeatNumbers().size());
        assertEquals(BigDecimal.valueOf(300.0), booking.getTotalAmount());

        // Verify seats in database are now BOOKED
        Seat s1 = seatRepository.findByEventIdAndSeatNumber(testEvent.getId(), "VIP-1").orElseThrow();
        assertEquals(SeatStatus.BOOKED, s1.getStatus());
        assertEquals(booking.getBookingRef(), s1.getBookingId());
    }

    @Test
    @DisplayName("Should guarantee idempotency when same key is submitted twice")
    void testIdempotentBooking() {
        CreateBookingRequest req1 = new CreateBookingRequest(
                testEvent.getId(),
                List.of("VIP-3"),
                "IDEMP-KEY-UNIQUE",
                "MOCK_CARD"
        );
        BookingResponseDto b1 = bookingService.createBooking(req1, testUser.getId());

        // Re-submit identical request with same idempotency key
        BookingResponseDto b2 = bookingService.createBooking(req1, testUser.getId());

        assertEquals(b1.getBookingRef(), b2.getBookingRef());
        assertEquals(b1.getTotalAmount(), b2.getTotalAmount());
        assertEquals(1, bookingRepository.count());
    }

    @Test
    @DisplayName("Should reject duplicate seat numbers in a single request")
    void testRejectDuplicateSeatsInRequest() {
        CreateBookingRequest req = new CreateBookingRequest(
                testEvent.getId(),
                List.of("STALL-1", "STALL-1"),
                "IDEMP-DUP",
                "MOCK_CARD"
        );

        assertThrows(BadRequestException.class, () -> bookingService.createBooking(req, testUser.getId()));
    }

    @Test
    @DisplayName("Should cancel an eligible booking and release seats back to AVAILABLE")
    void testCancelBookingAndReleaseSeats() {
        CreateBookingRequest req = new CreateBookingRequest(
                testEvent.getId(),
                List.of("STALL-2", "STALL-3"),
                "IDEMP-CANCEL-001",
                "MOCK_CARD"
        );
        BookingResponseDto booking = bookingService.createBooking(req, testUser.getId());
        assertEquals(BookingStatus.CONFIRMED, booking.getStatus());

        BookingResponseDto cancelled = bookingService.cancelBooking(booking.getBookingRef(), testUser.getId(), false);

        assertEquals(BookingStatus.CANCELLED, cancelled.getStatus());
        assertEquals(PaymentStatus.REFUNDED, cancelled.getPaymentStatus());
        assertNotNull(cancelled.getCancelledAt());

        // Verify seats are released back to AVAILABLE
        Seat s2 = seatRepository.findByEventIdAndSeatNumber(testEvent.getId(), "STALL-2").orElseThrow();
        Seat s3 = seatRepository.findByEventIdAndSeatNumber(testEvent.getId(), "STALL-3").orElseThrow();
        assertEquals(SeatStatus.AVAILABLE, s2.getStatus());
        assertEquals(SeatStatus.AVAILABLE, s3.getStatus());
        assertNull(s2.getBookingId());
        assertNull(s3.getBookingId());
    }
}

