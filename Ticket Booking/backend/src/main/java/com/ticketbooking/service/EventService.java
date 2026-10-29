package com.ticketbooking.service;

import com.ticketbooking.dto.CreateEventRequest;
import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.dto.UpdateEventRequest;
import com.ticketbooking.exception.BadRequestException;
import com.ticketbooking.exception.ResourceNotFoundException;
import com.ticketbooking.model.*;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;
    private final MongoTemplate mongoTemplate;

    public EventService(EventRepository eventRepository,
                        SeatRepository seatRepository,
                        BookingRepository bookingRepository,
                        MongoTemplate mongoTemplate) {
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public Page<EventResponseDto> searchEvents(String search,
                                               String category,
                                               String venue,
                                               LocalDate fromDate,
                                               LocalDate toDate,
                                               BigDecimal minPrice,
                                               BigDecimal maxPrice,
                                               EventStatus status,
                                               Pageable pageable) {
        Query query = new Query();

        // Status filter: defaults to PUBLISHED for users if not specified
        if (status != null) {
            query.addCriteria(Criteria.where("status").is(status.name()));
        } else {
            query.addCriteria(Criteria.where("status").is(EventStatus.PUBLISHED.name()));
        }

        // Search in title, description, or location using $or regex
        if (StringUtils.hasText(search)) {
            String regex = ".*" + search.trim() + ".*";
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("title").regex(regex, "i"),
                    Criteria.where("description").regex(regex, "i"),
                    Criteria.where("location").regex(regex, "i"),
                    Criteria.where("venue").regex(regex, "i")
            ));
        }

        // Category filter ($eq)
        if (StringUtils.hasText(category) && !"ALL".equalsIgnoreCase(category)) {
            query.addCriteria(Criteria.where("category").is(category.toUpperCase()));
        }

        // Venue filter ($eq or regex)
        if (StringUtils.hasText(venue)) {
            query.addCriteria(Criteria.where("venue").regex(".*" + venue.trim() + ".*", "i"));
        }

        // Date range filter ($gte, $lte)
        if (fromDate != null && toDate != null) {
            query.addCriteria(Criteria.where("eventDate").gte(fromDate).lte(toDate));
        } else if (fromDate != null) {
            query.addCriteria(Criteria.where("eventDate").gte(fromDate));
        } else if (toDate != null) {
            query.addCriteria(Criteria.where("eventDate").lte(toDate));
        }

        // Count total matching documents
        long total = mongoTemplate.count(query, Event.class);

        // Apply pagination and sorting
        query.with(pageable);
        List<Event> events = mongoTemplate.find(query, Event.class);

        List<EventResponseDto> dtoList = events.stream()
                .map(this::toResponseDto)
                .toList();

        return new PageImpl<>(dtoList, pageable, total);
    }

    public EventResponseDto getEventById(String id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));
        return toResponseDto(event);
    }

    public Event getEventEntityById(String id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with ID: " + id));
    }

    @Transactional
    public EventResponseDto createEvent(CreateEventRequest req) {
        Event event = new Event();
        event.setTitle(req.getTitle().trim());
        event.setDescription(req.getDescription().trim());
        event.setCategory(req.getCategory().trim().toUpperCase());
        event.setVenue(req.getVenue().trim());
        event.setLocation(req.getLocation().trim());
        event.setEventDate(req.getEventDate());
        event.setStartTime(req.getStartTime().trim());
        event.setEndTime(StringUtils.hasText(req.getEndTime()) ? req.getEndTime().trim() : null);
        event.setStatus(EventStatus.PUBLISHED); // Default to PUBLISHED for discovery
        event.setTicketCategories(req.getTicketCategories());
        event.setBannerUrl(req.getBannerUrl());
        event.setCreatedAt(Instant.now());
        event.setUpdatedAt(Instant.now());

        Event savedEvent = eventRepository.save(event);

        // Auto-generate seats for this event based on ticketCategories
        generateSeatsForEvent(savedEvent);

        return toResponseDto(savedEvent);
    }

    @Transactional
    public EventResponseDto updateEvent(String id, UpdateEventRequest req) {
        Event event = getEventEntityById(id);

        if (StringUtils.hasText(req.getTitle())) event.setTitle(req.getTitle().trim());
        if (StringUtils.hasText(req.getDescription())) event.setDescription(req.getDescription().trim());
        if (StringUtils.hasText(req.getCategory())) event.setCategory(req.getCategory().trim().toUpperCase());
        if (StringUtils.hasText(req.getVenue())) event.setVenue(req.getVenue().trim());
        if (StringUtils.hasText(req.getLocation())) event.setLocation(req.getLocation().trim());
        if (req.getEventDate() != null) event.setEventDate(req.getEventDate());
        if (StringUtils.hasText(req.getStartTime())) event.setStartTime(req.getStartTime().trim());
        if (req.getEndTime() != null) event.setEndTime(req.getEndTime().trim());
        if (req.getStatus() != null) event.setStatus(req.getStatus());
        if (StringUtils.hasText(req.getBannerUrl())) event.setBannerUrl(req.getBannerUrl());
        event.setUpdatedAt(Instant.now());

        Event updated = eventRepository.save(event);
        return toResponseDto(updated);
    }

    @Transactional
    public EventResponseDto publishEvent(String id) {
        Event event = getEventEntityById(id);
        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(Instant.now());
        return toResponseDto(eventRepository.save(event));
    }

    @Transactional
    public EventResponseDto cancelEvent(String id) {
        Event event = getEventEntityById(id);
        event.setStatus(EventStatus.CANCELLED);
        event.setUpdatedAt(Instant.now());
        return toResponseDto(eventRepository.save(event));
    }

    @Transactional
    public void deleteEvent(String id) {
        Event event = getEventEntityById(id);
        long bookedCount = seatRepository.countByEventIdAndStatus(id, SeatStatus.BOOKED);
        if (bookedCount > 0) {
            throw new BadRequestException("Cannot delete event with " + bookedCount + " confirmed bookings. Please cancel the event instead.");
        }
        seatRepository.deleteByEventId(id);
        eventRepository.delete(event);
    }

    private void generateSeatsForEvent(Event event) {
        List<Seat> seats = new ArrayList<>();
        if (event.getTicketCategories() == null) return;

        for (TicketCategory category : event.getTicketCategories()) {
            String prefix = category.getCategoryCode().trim().toUpperCase();
            int count = category.getTotalSeats();
            for (int i = 1; i <= count; i++) {
                String seatNumber = prefix + "-" + i;
                Seat seat = new Seat();
                seat.setEventId(event.getId());
                seat.setSeatNumber(seatNumber);
                seat.setCategoryCode(prefix);
                seat.setPrice(category.getPrice());
                seat.setStatus(SeatStatus.AVAILABLE);
                seat.setCreatedAt(Instant.now());
                seat.setUpdatedAt(Instant.now());
                seats.add(seat);
            }
        }
        seatRepository.saveAll(seats);
    }

    public EventResponseDto toResponseDto(Event event) {
        EventResponseDto dto = new EventResponseDto();
        dto.setId(event.getId());
        dto.setTitle(event.getTitle());
        dto.setDescription(event.getDescription());
        dto.setCategory(event.getCategory());
        dto.setVenue(event.getVenue());
        dto.setLocation(event.getLocation());
        dto.setEventDate(event.getEventDate());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setStatus(event.getStatus());
        dto.setTicketCategories(event.getTicketCategories());
        dto.setBannerUrl(event.getBannerUrl());
        dto.setCreatedAt(event.getCreatedAt());

        // Calculate seating statistics
        int totalSeats = 0;
        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;

        if (event.getTicketCategories() != null) {
            for (TicketCategory tc : event.getTicketCategories()) {
                totalSeats += tc.getTotalSeats();
                if (minPrice == null || tc.getPrice().compareTo(minPrice) < 0) {
                    minPrice = tc.getPrice();
                }
                if (maxPrice == null || tc.getPrice().compareTo(maxPrice) > 0) {
                    maxPrice = tc.getPrice();
                }
            }
        }
        dto.setTotalSeats(totalSeats);
        dto.setMinPrice(minPrice != null ? minPrice : BigDecimal.ZERO);
        dto.setMaxPrice(maxPrice != null ? maxPrice : BigDecimal.ZERO);

        long availableSeats = seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.AVAILABLE);
        long heldSeats = seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.HELD);
        long bookedSeats = seatRepository.countByEventIdAndStatus(event.getId(), SeatStatus.BOOKED);

        dto.setAvailableSeats(availableSeats);
        dto.setHeldSeats(heldSeats);
        dto.setBookedSeats(bookedSeats);

        return dto;
    }
}

