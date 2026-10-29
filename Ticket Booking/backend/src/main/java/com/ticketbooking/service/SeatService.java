package com.ticketbooking.service;

import com.mongodb.client.result.UpdateResult;
import com.ticketbooking.dto.HoldResponse;
import com.ticketbooking.dto.SeatDto;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.exception.SeatConflictException;
import com.ticketbooking.model.Event;
import com.ticketbooking.model.EventStatus;
import com.ticketbooking.model.Seat;
import com.ticketbooking.model.SeatStatus;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SeatService {

    private static final Logger log = LoggerFactory.getLogger(SeatService.class);

    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final MongoTemplate mongoTemplate;

    @Value("${app.hold.duration-minutes:10}")
    private int holdDurationMinutes;

    public SeatService(SeatRepository seatRepository,
                       EventRepository eventRepository,
                       MongoTemplate mongoTemplate) {
        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public List<SeatDto> getSeatsForEvent(String eventId, String currentUserId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        List<Seat> seats = seatRepository.findByEventIdOrderBySeatNumberAsc(eventId);
        Instant now = Instant.now();

        return seats.stream().map(seat -> {
            SeatStatus effectiveStatus = seat.getStatus();
            boolean isHeldByMe = currentUserId != null && currentUserId.equals(seat.getHeldBy());

            // If hold has expired, consider it available in read projections
            if (seat.getStatus() == SeatStatus.HELD && seat.getHoldExpiresAt() != null && seat.getHoldExpiresAt().isBefore(now)) {
                effectiveStatus = SeatStatus.AVAILABLE;
                isHeldByMe = false;
            }

            return new SeatDto(
                    seat.getId(),
                    seat.getEventId(),
                    seat.getSeatNumber(),
                    seat.getCategoryCode(),
                    seat.getPrice(),
                    effectiveStatus,
                    isHeldByMe,
                    effectiveStatus == SeatStatus.HELD ? seat.getHoldExpiresAt() : null
            );
        }).toList();
    }

    /**
     * Atomically holds the requested seats for the user.
     * Prevents race conditions using conditional atomic findAndModify operations.
     */
    public HoldResponse holdSeats(String eventId, List<String> seatNumbers, String userId) {
        if (seatNumbers == null || seatNumbers.isEmpty()) {
            throw new BadRequestException("At least one seat number is required.");
        }

        // Validate duplicates in the request itself
        Set<String> uniqueSeats = new HashSet<>(seatNumbers);
        if (uniqueSeats.size() != seatNumbers.size()) {
            throw new BadRequestException("Duplicate seat numbers in reservation request are not allowed.");
        }

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + eventId));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Event is not currently open for bookings (status: " + event.getStatus() + ").");
        }

        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofMinutes(holdDurationMinutes));
        List<String> successfullyHeld = new ArrayList<>();

        for (String seatNumber : seatNumbers) {
            // Atomic conditional update:
            // Matches ONLY if seat belongs to event AND seatNumber AND
            // (status == AVAILABLE OR (status == HELD AND holdExpiresAt < now) OR (status == HELD AND heldBy == userId))
            Query query = new Query();
            query.addCriteria(Criteria.where("eventId").is(eventId)
                    .and("seatNumber").is(seatNumber)
                    .orOperator(
                            Criteria.where("status").is(SeatStatus.AVAILABLE.name()),
                            new Criteria().andOperator(
                                    Criteria.where("status").is(SeatStatus.HELD.name()),
                                    Criteria.where("holdExpiresAt").lt(now)
                            ),
                            new Criteria().andOperator(
                                    Criteria.where("status").is(SeatStatus.HELD.name()),
                                    Criteria.where("heldBy").is(userId)
                            )
                    ));

            Update update = new Update()
                    .set("status", SeatStatus.HELD.name())
                    .set("heldBy", userId)
                    .set("holdExpiresAt", expiresAt)
                    .set("updatedAt", now);

            Seat heldSeat = mongoTemplate.findAndModify(
                    query,
                    update,
                    FindAndModifyOptions.options().returnNew(true),
                    Seat.class
            );

            if (heldSeat != null) {
                successfullyHeld.add(seatNumber);
            } else {
                // Conflict: Another user has already reserved or booked this seat
                // Compensating action: release any seats acquired earlier in this batch
                releaseHoldInternal(eventId, successfullyHeld, userId);
                throw new SeatConflictException("Seat " + seatNumber + " is currently held or already booked by another user. Please choose another seat.");
            }
        }

        long remainingSecs = Duration.between(now, expiresAt).getSeconds();
        return new HoldResponse(
                eventId,
                successfullyHeld,
                expiresAt,
                remainingSecs,
                "Seats successfully reserved for " + holdDurationMinutes + " minutes."
        );
    }

    public void releaseHold(String eventId, List<String> seatNumbers, String userId) {
        releaseHoldInternal(eventId, seatNumbers, userId);
    }

    private void releaseHoldInternal(String eventId, List<String> seatNumbers, String userId) {
        if (seatNumbers == null || seatNumbers.isEmpty()) return;

        Query query = new Query();
        query.addCriteria(Criteria.where("eventId").is(eventId)
                .and("seatNumber").in(seatNumbers)
                .and("status").is(SeatStatus.HELD.name())
                .and("heldBy").is(userId));

        Update update = new Update()
                .set("status", SeatStatus.AVAILABLE.name())
                .unset("heldBy")
                .unset("holdExpiresAt")
                .set("updatedAt", Instant.now());

        mongoTemplate.updateMulti(query, update, Seat.class);
    }

    /**
     * Periodic background cleanup job:
     * Cleans up expired holds where holdExpiresAt < now.
     */
    @Scheduled(fixedRate = 30000)
    public void cleanupExpiredHolds() {
        Instant now = Instant.now();
        Query query = new Query();
        query.addCriteria(Criteria.where("status").is(SeatStatus.HELD.name())
                .and("holdExpiresAt").lt(now));

        Update update = new Update()
                .set("status", SeatStatus.AVAILABLE.name())
                .unset("heldBy")
                .unset("holdExpiresAt")
                .set("updatedAt", now);

        UpdateResult result = mongoTemplate.updateMulti(query, update, Seat.class);
        if (result.getModifiedCount() > 0) {
            log.info("Expired holds cleanup: Released {} seats back to AVAILABLE", result.getModifiedCount());
        }
    }
}

