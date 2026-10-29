package com.ticketbooking.concurrency;

import com.ticketbooking.dto.BookingResponseDto;
import com.ticketbooking.dto.CreateBookingRequest;
import com.ticketbooking.dto.CreateEventRequest;
import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.exception.SeatConflictException;
import com.ticketbooking.model.*;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.UserRepository;
import com.ticketbooking.service.BookingService;
import com.ticketbooking.service.EventService;
import com.ticketbooking.service.SeatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class ConcurrentBookingTests {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SeatService seatService;

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

    private User userA;
    private User userB;
    private EventResponseDto event;

    @BeforeEach
    void setUp() {
        bookingRepository.deleteAll();
        seatRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();

        userA = userRepository.save(new User(null, "Alice Johnson", "alice@example.com", "hash", Role.ROLE_USER));
        userB = userRepository.save(new User(null, "Bob Smith", "bob@example.com", "hash", Role.ROLE_USER));

        CreateEventRequest req = new CreateEventRequest();
        req.setTitle("Grand Opera Championship 2026");
        req.setDescription("World Opera Championship live.");
        req.setCategory("THEATER");
        req.setVenue("Metropolitan Opera House");
        req.setLocation("New York, NY");
        req.setEventDate(LocalDate.now().plusDays(15));
        req.setStartTime("19:30");
        req.setTicketCategories(List.of(
                new TicketCategory("VIP", "VIP Diamond", BigDecimal.valueOf(300.0), 5),
                new TicketCategory("GEN", "General Tier", BigDecimal.valueOf(100.0), 10)
        ));
        event = eventService.createEvent(req);
    }

    @Test
    @DisplayName("Concurrency Prevention: Two users attempt to book the EXACT SAME seat simultaneously")
    void testConcurrentBookingSameSeat() throws InterruptedException {
        String contestedSeat = "VIP-1";
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<BookingResponseDto> successfulBookings = Collections.synchronizedList(new ArrayList<>());
        List<Throwable> exceptions = Collections.synchronizedList(new ArrayList<>());

        // Thread 1: User A requests contestedSeat
        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await(); // wait for simultaneous trigger
                CreateBookingRequest req = new CreateBookingRequest(event.getId(), List.of(contestedSeat), "KEY-A", "MOCK_CARD");
                BookingResponseDto b = bookingService.createBooking(req, userA.getId());
                successfulBookings.add(b);
            } catch (Throwable t) {
                exceptions.add(t);
            }
        });

        // Thread 2: User B requests contestedSeat
        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await(); // wait for simultaneous trigger
                CreateBookingRequest req = new CreateBookingRequest(event.getId(), List.of(contestedSeat), "KEY-B", "MOCK_CARD");
                BookingResponseDto b = bookingService.createBooking(req, userB.getId());
                successfulBookings.add(b);
            } catch (Throwable t) {
                exceptions.add(t);
            }
        });

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Fire both threads simultaneously

        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));

        // CRITICAL INVARIANT: Exactly ONE request must succeed!
        assertEquals(1, successfulBookings.size(), "Exactly one user must acquire the contested seat");
        assertEquals(1, exceptions.size(), "The losing user must encounter a conflict exception");

        // The losing user's exception is either SeatConflictException or MongoDB's transactional WriteConflict
        Throwable losingEx = exceptions.get(0);
        boolean isConflict = losingEx instanceof SeatConflictException ||
                (losingEx.getMessage() != null && (losingEx.getMessage().contains("Write conflict") ||
                        losingEx.getMessage().contains("WriteConflict") ||
                        losingEx.getMessage().contains("TransientTransactionError") ||
                        losingEx.getMessage().contains("Seat")));
        assertTrue(isConflict, "Losing user must receive a conflict exception or transaction write conflict, got: " + losingEx);

        // Verify database state: exactly 1 booking exists, and seat VIP-1 is booked to that reference
        assertEquals(1, bookingRepository.count());
        Seat seatInDb = seatRepository.findByEventIdAndSeatNumber(event.getId(), contestedSeat).orElseThrow();
        assertEquals(SeatStatus.BOOKED, seatInDb.getStatus());
        assertEquals(successfulBookings.get(0).getBookingRef(), seatInDb.getBookingId());
    }

    @Test
    @DisplayName("Concurrent Bookings for DIFFERENT seats should both succeed without contention")
    void testConcurrentBookingDifferentSeats() throws InterruptedException {
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<BookingResponseDto> successes = Collections.synchronizedList(new ArrayList<>());
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());

        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                CreateBookingRequest req = new CreateBookingRequest(event.getId(), List.of("VIP-2"), "KEY-DIFF-A", "MOCK_CARD");
                successes.add(bookingService.createBooking(req, userA.getId()));
            } catch (Throwable t) {
                errors.add(t);
            }
        });

        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                CreateBookingRequest req = new CreateBookingRequest(event.getId(), List.of("VIP-3"), "KEY-DIFF-B", "MOCK_CARD");
                successes.add(bookingService.createBooking(req, userB.getId()));
            } catch (Throwable t) {
                errors.add(t);
            }
        });

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));

        assertEquals(2, successes.size(), "Both concurrent bookings for distinct seats must succeed");
        assertEquals(0, errors.size());
        assertEquals(2, bookingRepository.count());
    }

    @Test
    @DisplayName("Concurrent Seat Hold: Exactly one user can hold a seat at a time")
    void testConcurrentSeatHold() throws InterruptedException {
        String seatNumber = "GEN-1";
        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<String> holdSuccesses = Collections.synchronizedList(new ArrayList<>());
        List<Throwable> holdFails = Collections.synchronizedList(new ArrayList<>());

        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                seatService.holdSeats(event.getId(), List.of(seatNumber), userA.getId());
                holdSuccesses.add("userA");
            } catch (Throwable t) {
                holdFails.add(t);
            }
        });

        executor.submit(() -> {
            try {
                readyLatch.countDown();
                startLatch.await();
                seatService.holdSeats(event.getId(), List.of(seatNumber), userB.getId());
                holdSuccesses.add("userB");
            } catch (Throwable t) {
                holdFails.add(t);
            }
        });

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown();

        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS));

        assertEquals(1, holdSuccesses.size(), "Only one user may acquire the hold");
        assertEquals(1, holdFails.size());
    }
}
