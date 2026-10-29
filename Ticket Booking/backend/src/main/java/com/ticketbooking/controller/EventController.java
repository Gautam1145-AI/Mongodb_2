package com.ticketbooking.controller;

import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.dto.HoldRequest;
import com.ticketbooking.dto.HoldResponse;
import com.ticketbooking.dto.SeatDto;
import com.ticketbooking.model.EventStatus;
import com.ticketbooking.security.UserPrincipal;
import com.ticketbooking.service.EventService;
import com.ticketbooking.service.SeatService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final SeatService seatService;

    public EventController(EventService eventService, SeatService seatService) {
        this.eventService = eventService;
        this.seatService = seatService;
    }

    @GetMapping
    public ResponseEntity<Page<EventResponseDto>> searchEvents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String venue,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "eventDate") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<EventResponseDto> results = eventService.searchEvents(
                search, category, venue, fromDate, toDate, minPrice, maxPrice, EventStatus.PUBLISHED, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponseDto> getEventById(@PathVariable String id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @GetMapping("/{eventId}/seats")
    public ResponseEntity<List<SeatDto>> getEventSeats(
            @PathVariable String eventId,
            @AuthenticationPrincipal UserPrincipal principal) {
        String currentUserId = principal != null ? principal.getId() : null;
        return ResponseEntity.ok(seatService.getSeatsForEvent(eventId, currentUserId));
    }

    @PostMapping("/{eventId}/holds")
    public ResponseEntity<HoldResponse> holdSeats(
            @PathVariable String eventId,
            @Valid @RequestBody HoldRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        HoldResponse response = seatService.holdSeats(eventId, request.getSeatNumbers(), principal.getId());
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{eventId}/holds")
    public ResponseEntity<Map<String, String>> releaseHold(
            @PathVariable String eventId,
            @RequestBody HoldRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        seatService.releaseHold(eventId, request.getSeatNumbers(), principal.getId());
        return ResponseEntity.ok(Map.of("message", "Holds released successfully."));
    }
}

