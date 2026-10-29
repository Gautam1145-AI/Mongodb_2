package com.ticketbooking.config;

import com.ticketbooking.dto.CreateBookingRequest;
import com.ticketbooking.dto.CreateEventRequest;
import com.ticketbooking.dto.EventResponseDto;
import com.ticketbooking.model.*;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import com.ticketbooking.repository.UserRepository;
import com.ticketbooking.service.BookingService;
import com.ticketbooking.service.EventService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final BookingRepository bookingRepository;
    private final EventService eventService;
    private final BookingService bookingService;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           EventRepository eventRepository,
                           SeatRepository seatRepository,
                           BookingRepository bookingRepository,
                           EventService eventService,
                           BookingService bookingService,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
        this.eventService = eventService;
        this.bookingService = bookingService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedEventsAndBookings();
    }

    private void seedUsers() {
        User admin = userRepository.findByEmail("admin@ticketbooking.com").orElse(new User());
        admin.setName("Administrator");
        admin.setEmail("admin@ticketbooking.com");
        admin.setPasswordHash(passwordEncoder.encode("Admin@12345"));
        admin.setRole(Role.ROLE_ADMIN);
        userRepository.save(admin);
        log.info("Default ADMIN user synchronized: admin@ticketbooking.com / Admin@12345");

        User user = userRepository.findByEmail("user@ticketbooking.com").orElse(new User());
        user.setName("Alex Morgan");
        user.setEmail("user@ticketbooking.com");
        user.setPasswordHash(passwordEncoder.encode("User@12345"));
        user.setRole(Role.ROLE_USER);
        userRepository.save(user);
        log.info("Default USER synchronized: user@ticketbooking.com / User@12345");

        User user2 = userRepository.findByEmail("sarah.connor@example.com").orElse(new User());
        user2.setName("Sarah Connor");
        user2.setEmail("sarah.connor@example.com");
        user2.setPasswordHash(passwordEncoder.encode("User@12345"));
        user2.setRole(Role.ROLE_USER);
        userRepository.save(user2);
        log.info("Second test USER synchronized: sarah.connor@example.com / User@12345");
    }

    private void seedEventsAndBookings() {
        if (eventRepository.count() > 0) {
            log.info("Events already initialized. Total count: {}", eventRepository.count());
            return;
        }

        log.info("Seeding initial events and seat inventory...");

        // Event 1: Coldplay Concert
        CreateEventRequest e1 = new CreateEventRequest();
        e1.setTitle("Coldplay: Music of the Spheres World Tour");
        e1.setDescription("Experience an unforgettable night under the cosmic lights with Coldplay performing their biggest stadium hits and new tracks.");
        e1.setCategory("CONCERT");
        e1.setVenue("Wembley Arena Stadium");
        e1.setLocation("London, UK");
        e1.setEventDate(LocalDate.now().plusDays(14));
        e1.setStartTime("19:30");
        e1.setEndTime("23:00");
        e1.setBannerUrl("https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80");
        e1.setTicketCategories(List.of(
                new TicketCategory("VIP", "VIP Diamond Lounge", BigDecimal.valueOf(250.0), 12),
                new TicketCategory("PREMIUM", "Premium Reserved Seating", BigDecimal.valueOf(140.0), 20),
                new TicketCategory("GENERAL", "General Pitch Standing", BigDecimal.valueOf(75.0), 30)
        ));
        EventResponseDto ev1 = eventService.createEvent(e1);

        // Event 2: Tech Summit
        CreateEventRequest e2 = new CreateEventRequest();
        e2.setTitle("Global AI & Cloud Developer Summit 2026");
        e2.setDescription("The premier gathering of AI researchers, distributed systems architects, and engineering leaders shaping next-gen software.");
        e2.setCategory("CONFERENCE");
        e2.setVenue("Moscone Center West");
        e2.setLocation("San Francisco, CA");
        e2.setEventDate(LocalDate.now().plusDays(25));
        e2.setStartTime("09:00");
        e2.setEndTime("18:00");
        e2.setBannerUrl("https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80");
        e2.setTicketCategories(List.of(
                new TicketCategory("ALL_ACCESS", "All-Access Pass + Workshops", BigDecimal.valueOf(450.0), 15),
                new TicketCategory("STANDARD", "Standard Conference Pass", BigDecimal.valueOf(220.0), 35)
        ));
        EventResponseDto ev2 = eventService.createEvent(e2);

        // Event 3: Broadway Theater
        CreateEventRequest e3 = new CreateEventRequest();
        e3.setTitle("The Phantom of the Opera: West End Revival");
        e3.setDescription("Andrew Lloyd Webber's timeless romantic masterpiece returns with dazzling set design and an extraordinary live orchestral performance.");
        e3.setCategory("THEATER");
        e3.setVenue("His Majesty's Theatre");
        e3.setLocation("London, UK");
        e3.setEventDate(LocalDate.now().plusDays(8));
        e3.setStartTime("19:00");
        e3.setEndTime("21:45");
        e3.setBannerUrl("https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80");
        e3.setTicketCategories(List.of(
                new TicketCategory("ROYAL_BOX", "Royal Box Experience", BigDecimal.valueOf(190.0), 8),
                new TicketCategory("STALLS", "Front Stalls Seating", BigDecimal.valueOf(110.0), 24),
                new TicketCategory("BALCONY", "Grand Balcony", BigDecimal.valueOf(55.0), 30)
        ));
        EventResponseDto ev3 = eventService.createEvent(e3);

        // Event 4: NBA Finals
        CreateEventRequest e4 = new CreateEventRequest();
        e4.setTitle("NBA Championship Finals 2026 - Game 7");
        e4.setDescription("The ultimate basketball showdown for the Larry O'Brien trophy. High stakes, buzzer beaters, and legendary athletic performances.");
        e4.setCategory("SPORTS");
        e4.setVenue("Crypto.com Arena");
        e4.setLocation("Los Angeles, CA");
        e4.setEventDate(LocalDate.now().plusDays(30));
        e4.setStartTime("20:00");
        e4.setEndTime("22:30");
        e4.setBannerUrl("https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80");
        e4.setTicketCategories(List.of(
                new TicketCategory("COURTSIDE", "VIP Courtside Row A", BigDecimal.valueOf(550.0), 6),
                new TicketCategory("LOWER_BOWL", "Lower Bowl Club Level", BigDecimal.valueOf(280.0), 20),
                new TicketCategory("UPPER_TIER", "Upper Tier Fans", BigDecimal.valueOf(95.0), 40)
        ));
        EventResponseDto ev4 = eventService.createEvent(e4);

        // Event 5: Comedy Festival
        CreateEventRequest e5 = new CreateEventRequest();
        e5.setTitle("Laugh Fest Live: All-Star Standup Showcase");
        e5.setDescription("A two-hour laugh riot featuring top headline comedians, live improv, and surprise guest appearances.");
        e5.setCategory("COMEDY");
        e5.setVenue("The Comedy Store Sunset");
        e5.setLocation("West Hollywood, CA");
        e5.setEventDate(LocalDate.now().plusDays(5));
        e5.setStartTime("21:00");
        e5.setEndTime("23:15");
        e5.setBannerUrl("https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80");
        e5.setTicketCategories(List.of(
                new TicketCategory("FRONT_ROW", "Front Row Reserved + Drinks", BigDecimal.valueOf(85.0), 10),
                new TicketCategory("GENERAL", "General Admission", BigDecimal.valueOf(40.0), 30)
        ));
        EventResponseDto ev5 = eventService.createEvent(e5);

        log.info("5 events created with initial seat inventory.");

        // Seed some initial confirmed bookings to populate analytics charts and booking history
        User user = userRepository.findByEmail("user@ticketbooking.com").orElse(null);
        User user2 = userRepository.findByEmail("sarah.connor@example.com").orElse(null);

        if (user != null && ev1 != null) {
            try {
                CreateBookingRequest bkReq = new CreateBookingRequest(
                        ev1.getId(),
                        List.of("VIP-1", "VIP-2"),
                        "IDEMP-SEED-001",
                        "MOCK_CARD"
                );
                bookingService.createBooking(bkReq, user.getId());
                log.info("Initial seed booking created for user@ticketbooking.com on Coldplay");
            } catch (Exception ex) {
                log.warn("Seed booking 1 notice: {}", ex.getMessage());
            }
        }

        if (user2 != null && ev3 != null) {
            try {
                CreateBookingRequest bkReq2 = new CreateBookingRequest(
                        ev3.getId(),
                        List.of("ROYAL_BOX-1", "ROYAL_BOX-2"),
                        "IDEMP-SEED-002",
                        "MOCK_CARD"
                );
                bookingService.createBooking(bkReq2, user2.getId());
                log.info("Initial seed booking created for sarah.connor on Phantom of the Opera");
            } catch (Exception ex) {
                log.warn("Seed booking 2 notice: {}", ex.getMessage());
            }
        }

        if (user != null && ev4 != null) {
            try {
                CreateBookingRequest bkReq3 = new CreateBookingRequest(
                        ev4.getId(),
                        List.of("COURTSIDE-1"),
                        "IDEMP-SEED-003",
                        "MOCK_CARD"
                );
                bookingService.createBooking(bkReq3, user.getId());
                log.info("Initial seed booking created for NBA Finals");
            } catch (Exception ex) {
                log.warn("Seed booking 3 notice: {}", ex.getMessage());
            }
        }
    }
}
