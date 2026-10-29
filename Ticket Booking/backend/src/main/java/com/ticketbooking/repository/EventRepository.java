package com.ticketbooking.repository;

import com.ticketbooking.model.Event;
import com.ticketbooking.model.EventStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends MongoRepository<Event, String> {
    Page<Event> findByStatus(EventStatus status, Pageable pageable);
    List<Event> findByStatusAndEventDateGreaterThanEqual(EventStatus status, LocalDate date);
    List<Event> findByCategory(String category);
}

