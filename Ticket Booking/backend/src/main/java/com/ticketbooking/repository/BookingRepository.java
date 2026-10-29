package com.ticketbooking.repository;

import com.ticketbooking.model.Booking;
import com.ticketbooking.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    Optional<Booking> findByBookingRef(String bookingRef);
    Optional<Booking> findByIdempotencyKey(String idempotencyKey);
    Page<Booking> findByUserIdOrderByBookedAtDesc(String userId, Pageable pageable);
    List<Booking> findByUserIdOrderByBookedAtDesc(String userId);
    List<Booking> findByEventId(String eventId);
    long countByStatus(BookingStatus status);
}

