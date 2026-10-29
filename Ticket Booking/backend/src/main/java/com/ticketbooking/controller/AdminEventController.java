package com.ticketbooking.controller;

import com.ticketbooking.dto.CreateEventRequest;
import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.dto.UpdateEventRequest;
import com.ticketbooking.model.EventStatus;
import com.ticketbooking.service.EventService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/events")
@PreAuthorize("hasRole('ADMIN')")
public class AdminEventController {

    private final EventService eventService;

    public AdminEventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping
    public ResponseEntity<Page<EventResponseDto>> getAllEventsAdmin(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) EventStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EventResponseDto> results = eventService.searchEvents(
                search, category, null, null, null, null, null, status, pageable);
        return ResponseEntity.ok(results);
    }

    @PostMapping
    public ResponseEntity<EventResponseDto> createEvent(@Valid @RequestBody CreateEventRequest request) {
        return new ResponseEntity<>(eventService.createEvent(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventResponseDto> updateEvent(
            @PathVariable String id,
            @Valid @RequestBody UpdateEventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<EventResponseDto> publishEvent(@PathVariable String id) {
        return ResponseEntity.ok(eventService.publishEvent(id));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<EventResponseDto> cancelEvent(@PathVariable String id) {
        return ResponseEntity.ok(eventService.cancelEvent(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEvent(@PathVariable String id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(Map.of("message", "Event and its unbooked seats deleted successfully."));
    }
}

