package com.ticketbooking.service;

import com.ticketbooking.dto.BookingResponseDto;
import com.ticketbooking.dto.CreateBookingRequest;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ForbiddenException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.exception.SeatConflictException;
import com.ticketbooking.model.*;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
public class BookingService {

    private static final Logger log = LoggerFactory.getLogger(BookingService.class);

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    @Value("${app.cancellation.cutoff-hours-before-event:2}")
    private int cancellationCutoffHours;

    public BookingService(BookingRepository bookingRepository,
                          EventRepository eventRepository,
                          SeatRepository seatRepository,
                          UserRepository userRepository,
                          MongoTemplate mongoTemplate) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.userRepository = userRepository;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Executes atomic, transactional booking workflow with concurrent race condition prevention.
     */
    @Transactional
    public BookingResponseDto createBooking(CreateBookingRequest req, String userId) {
        // Step 1: Idempotency check to prevent duplicate charges/bookings on client retry
        if (StringUtils.hasText(req.getIdempotencyKey())) {
            Optional<Booking> existing = bookingRepository.findByIdempotencyKey(req.getIdempotencyKey().trim());
            if (existing.isPresent()) {
                log.info("Idempotent request received for key: {}", req.getIdempotencyKey());
                return toResponseDto(existing.get());
            }
        }

        // Step 2: Validate seat numbers
        List<String> requestedSeats = req.getSeatNumbers();
        if (requestedSeats == null || requestedSeats.isEmpty()) {
            throw new BadRequestException("At least one seat must be selected.");
        }
        Set<String> uniqueSeats = new HashSet<>(requestedSeats);
        if (uniqueSeats.size() != requestedSeats.size()) {
            throw new BadRequestException("Duplicate seat numbers in booking request are not allowed.");
        }

        // Step 3: Validate event eligibility
        Event event = eventRepository.findById(req.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + req.getEventId()));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Cannot book seats for an event that is not PUBLISHED (current status: " + event.getStatus() + ").");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Generate preliminary booking reference
        String bookingRef = "BK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Instant now = Instant.now();
        BigDecimal totalAmount = BigDecimal.ZERO;

        // Step 4: Atomically acquire each seat using conditional atomic updates inside the transaction session
        List<Seat> acquiredSeats = new ArrayList<>();
        for (String seatNumber : requestedSeats) {
            Query query = new Query();
            query.addCriteria(Criteria.where("eventId").is(event.getId())
                    .and("seatNumber").is(seatNumber)
                    .orOperator(
                            // Valid hold by current user
                            new Criteria().andOperator(
                                    Criteria.where("status").is(SeatStatus.HELD.name()),
                                    Criteria.where("heldBy").is(userId),
                                    Criteria.where("holdExpiresAt").gt(now)
                            ),
                            // Or available seat
                            Criteria.where("status").is(SeatStatus.AVAILABLE.name())
                    ));

            Update update = new Update()
                    .set("status", SeatStatus.BOOKED.name())
                    .set("bookingId", bookingRef)
                    .unset("heldBy")
                    .unset("holdExpiresAt")
                    .set("updatedAt", now);

            Seat bookedSeat = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    Seat.class
            );

            if (bookedSeat == null) {
                // If any single seat fails, throw exception to trigger Spring Transaction Rollback!
                throw new SeatConflictException("Failed to confirm booking: Seat " + seatNumber +
                        " is no longer available or your hold has expired. Transaction rolled back.");
            }

            acquiredSeats.add(bookedSeat);
            totalAmount = totalAmount.add(bookedSeat.getPrice());
        }

        // Step 5: Create and save Booking document
        Booking booking = new Booking();
        booking.setBookingRef(bookingRef);
        booking.setUserId(user.getId());
        booking.setUserEmail(user.getEmail());
        booking.setUserName(user.getName());
        booking.setEventId(event.getId());
        booking.setEventTitle(event.getTitle());
        booking.setEventCategory(event.getCategory());
        booking.setSeatNumbers(requestedSeats);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setTotalAmount(totalAmount);
        booking.setPaymentStatus(PaymentStatus.MOCK_PAID);
        booking.setIdempotencyKey(StringUtils.hasText(req.getIdempotencyKey()) ? req.getIdempotencyKey().trim() : null);
        booking.setBookedAt(now);
        booking.setCreatedAt(now);
        booking.setUpdatedAt(now);

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking {} successfully created for user {} with {} seats. Total: ${}",
                bookingRef, user.getEmail(), requestedSeats.size(), totalAmount);

        return toResponseDto(savedBooking, event);
    }

    public Page<BookingResponseDto> getMyBookings(String userId, Pageable pageable) {
        Page<Booking> bookings = bookingRepository.findByUserIdOrderByBookedAtDesc(userId, pageable);
        List<BookingResponseDto> dtos = bookings.stream().map(this::toResponseDto).toList();
        return new PageImpl<>(dtos, pageable, bookings.getTotalElements());
    }

    public List<BookingResponseDto> getMyBookingsList(String userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByBookedAtDesc(userId);
        return bookings.stream().map(this::toResponseDto).toList();
    }

    public BookingResponseDto getBookingByRef(String bookingRef, String currentUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + bookingRef));

        if (!isAdmin && !booking.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to view this booking.");
        }

        return toResponseDto(booking);
    }

    /**
     * Cancels an eligible booking and releases all associated seats consistently in a transaction.
     */
    @Transactional
    public BookingResponseDto cancelBooking(String bookingRef, String currentUserId, boolean isAdmin) {
        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + bookingRef));

        // Ownership or Admin check
        if (!isAdmin && !booking.getUserId().equals(currentUserId)) {
            throw new ForbiddenException("You are not authorized to cancel this booking.");
        }

        // Check current status
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking " + bookingRef + " has already been cancelled.");
        }

        if (booking.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Only CONFIRMED bookings can be cancelled.");
        }

        // Validate event cancellation policy cutoff
        Event event = eventRepository.findById(booking.getEventId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated event not found for booking: " + bookingRef));

        if (event.getEventDate() != null) {
            LocalTime startTime = LocalTime.of(18, 0); // default
            if (StringUtils.hasText(event.getStartTime())) {
                try {
                    startTime = LocalTime.parse(event.getStartTime());
                } catch (Exception ignored) {}
            }
            LocalDateTime eventDateTime = LocalDateTime.of(event.getEventDate(), startTime);
            LocalDateTime cutoffTime = eventDateTime.minusHours(cancellationCutoffHours);

            if (LocalDateTime.now().isAfter(cutoffTime) && !isAdmin) {
                throw new BadRequestException("Cancellation window closed. Bookings cannot be cancelled within "
                        + cancellationCutoffHours + " hours of the event start time.");
            }
        }

        Instant now = Instant.now();

        // Release seats belonging to this booking
        Query seatQuery = new Query();
        seatQuery.addCriteria(Criteria.where("eventId").is(booking.getEventId())
                .and("seatNumber").in(booking.getSeatNumbers())
                .and("bookingId").is(bookingRef));

        Update seatUpdate = new Update()
                .set("status", SeatStatus.AVAILABLE.name())
                .unset("bookingId")
                .unset("heldBy")
                .unset("holdExpiresAt")
                .set("updatedAt", now);

        mongoTemplate.updateMulti(seatQuery, seatUpdate, Seat.class);

        // Update booking document
        booking.setStatus(BookingStatus.CANCELLED);
        booking.setPaymentStatus(PaymentStatus.REFUNDED);
        booking.setCancelledAt(now);
        booking.setUpdatedAt(now);

        Booking updated = bookingRepository.save(booking);
        log.info("Booking {} successfully cancelled. Seats released back to AVAILABLE.", bookingRef);

        return toResponseDto(updated, event);
    }

    public Page<BookingResponseDto> getAllBookingsAdmin(Pageable pageable) {
        Page<Booking> bookings = bookingRepository.findAll(pageable);
        List<BookingResponseDto> dtos = bookings.stream().map(this::toResponseDto).toList();
        return new PageImpl<>(dtos, pageable, bookings.getTotalElements());
    }

    private BookingResponseDto toResponseDto(Booking booking) {
        Event event = eventRepository.findById(booking.getEventId()).orElse(null);
        return toResponseDto(booking, event);
    }

    private BookingResponseDto toResponseDto(Booking booking, Event event) {
        BookingResponseDto dto = new BookingResponseDto();
        dto.setId(booking.getId());
        dto.setBookingRef(booking.getBookingRef());
        dto.setUserId(booking.getUserId());
        dto.setUserEmail(booking.getUserEmail());
        dto.setUserName(booking.getUserName());
        dto.setEventId(booking.getEventId());
        dto.setEventTitle(booking.getEventTitle());
        dto.setSeatNumbers(booking.getSeatNumbers());
        dto.setStatus(booking.getStatus());
        dto.setTotalAmount(booking.getTotalAmount());
        dto.setPaymentStatus(booking.getPaymentStatus());
        dto.setBookedAt(booking.getBookedAt());
        dto.setCancelledAt(booking.getCancelledAt());

        if (event != null) {
            dto.setEventDate(event.getEventDate());
            dto.setEventVenue(event.getVenue());
            dto.setEventLocation(event.getLocation());
        }

        return dto;
    }
}
