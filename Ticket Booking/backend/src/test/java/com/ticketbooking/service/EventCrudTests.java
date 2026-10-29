package com.ticketbooking.service;

import com.ticketbooking.dto.CreateEventRequest;
import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.dto.UpdateEventRequest;
import com.ticketbooking.model.EventStatus;
import com.ticketbooking.model.TicketCategory;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
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
public class EventCrudTests {

    @Autowired
    private EventService eventService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private SeatRepository seatRepository;

    @BeforeEach
    void setUp() {
        seatRepository.deleteAll();
        eventRepository.deleteAll();
    }

    @Test
    @DisplayName("Should successfully create an event and auto-generate seat inventory")
    void testCreateEventAndSeatGeneration() {
        CreateEventRequest req = new CreateEventRequest();
        req.setTitle("Jazz Festival in the Park");
        req.setDescription("An evening of smooth jazz under the stars.");
        req.setCategory("CONCERT");
        req.setVenue("Central Park Bandshell");
        req.setLocation("New York, NY");
        req.setEventDate(LocalDate.now().plusDays(10));
        req.setStartTime("18:00");
        req.setEndTime("21:00");
        req.setTicketCategories(List.of(
                new TicketCategory("VIP", "VIP Front Lawn", BigDecimal.valueOf(120.0), 5),
                new TicketCategory("GEN", "General Admission", BigDecimal.valueOf(45.0), 10)
        ));

        EventResponseDto created = eventService.createEvent(req);

        assertNotNull(created.getId());
        assertEquals("Jazz Festival in the Park", created.getTitle());
        assertEquals(15, created.getTotalSeats());
        assertEquals(15, created.getAvailableSeats());

        // Verify seats in database
        long seatCount = seatRepository.countByEventIdAndStatus(created.getId(), com.ticketbooking.model.SeatStatus.AVAILABLE);
        assertEquals(15, seatCount);
    }

    @Test
    @DisplayName("Should retrieve event by ID")
    void testGetEventById() {
        CreateEventRequest req = new CreateEventRequest();
        req.setTitle("Comedy Night Showcase");
        req.setDescription("Hilarious performances.");
        req.setCategory("COMEDY");
        req.setVenue("Laugh Factory");
        req.setLocation("Chicago, IL");
        req.setEventDate(LocalDate.now().plusDays(5));
        req.setStartTime("20:00");
        req.setTicketCategories(List.of(
                new TicketCategory("STD", "Standard Seating", BigDecimal.valueOf(35.0), 8)
        ));

        EventResponseDto created = eventService.createEvent(req);
        EventResponseDto retrieved = eventService.getEventById(created.getId());

        assertNotNull(retrieved);
        assertEquals(created.getId(), retrieved.getId());
        assertEquals("Comedy Night Showcase", retrieved.getTitle());
    }

    @Test
    @DisplayName("Should update event details and publish/cancel status")
    void testUpdateAndStatusTransitions() {
        CreateEventRequest req = new CreateEventRequest();
        req.setTitle("Original Title");
        req.setDescription("Description");
        req.setCategory("THEATER");
        req.setVenue("Broadway Theatre");
        req.setLocation("NYC");
        req.setEventDate(LocalDate.now().plusDays(12));
        req.setStartTime("19:00");
        req.setTicketCategories(List.of(
                new TicketCategory("VIP", "VIP", BigDecimal.valueOf(100.0), 4)
        ));

        EventResponseDto created = eventService.createEvent(req);

        UpdateEventRequest updateReq = new UpdateEventRequest();
        updateReq.setTitle("Updated Title");
        EventResponseDto updated = eventService.updateEvent(created.getId(), updateReq);
        assertEquals("Updated Title", updated.getTitle());

        EventResponseDto cancelled = eventService.cancelEvent(created.getId());
        assertEquals(EventStatus.CANCELLED, cancelled.getStatus());
    }
}

