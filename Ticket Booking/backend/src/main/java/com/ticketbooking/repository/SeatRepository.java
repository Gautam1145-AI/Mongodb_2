package com.ticketbooking.repository;

import com.ticketbooking.model.Seat;
import com.ticketbooking.model.SeatStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends MongoRepository<Seat, String> {
    List<Seat> findByEventIdOrderBySeatNumberAsc(String eventId);
    Optional<Seat> findByEventIdAndSeatNumber(String eventId, String seatNumber);
    List<Seat> findByEventIdAndSeatNumberIn(String eventId, List<String> seatNumbers);
    long countByEventIdAndStatus(String eventId, SeatStatus status);
    List<Seat> findByStatusAndHoldExpiresAtBefore(SeatStatus status, Instant now);
    void deleteByEventId(String eventId);
}

