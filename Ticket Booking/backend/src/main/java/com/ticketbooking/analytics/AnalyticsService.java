package com.ticketbooking.analytics;

import com.ticketbooking.dto.DailySalesDto;
import com.ticketbooking.dto.DashboardOverviewDto;
import com.ticketbooking.dto.EventSalesDto;
import com.ticketbooking.dto.RevenueByCategoryDto;
import com.ticketbooking.model.*;
import com.ticketbooking.repository.BookingRepository;
import com.ticketbooking.repository.EventRepository;
import com.ticketbooking.repository.SeatRepository;
import org.bson.Document;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

@Service
public class AnalyticsService {

    private final MongoTemplate mongoTemplate;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final SeatRepository seatRepository;

    public AnalyticsService(MongoTemplate mongoTemplate,
                            EventRepository eventRepository,
                            BookingRepository bookingRepository,
                            SeatRepository seatRepository) {
        this.mongoTemplate = mongoTemplate;
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
        this.seatRepository = seatRepository;
    }

    /**
     * Dashboard Overview KPIs using real MongoDB Aggregation pipelines.
     */
    public DashboardOverviewDto getDashboardOverview() {
        DashboardOverviewDto dto = new DashboardOverviewDto();

        long totalEvents = eventRepository.count();
        long totalBookings = bookingRepository.count();
        long confirmedBookings = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
        long cancelledBookings = bookingRepository.countByStatus(BookingStatus.CANCELLED);

        dto.setTotalEvents(totalEvents);
        dto.setTotalBookings(totalBookings);
        dto.setConfirmedBookings(confirmedBookings);
        dto.setCancelledBookings(cancelledBookings);

        double cancelRate = totalBookings > 0 ? ((double) cancelledBookings / totalBookings) * 100.0 : 0.0;
        dto.setCancellationRate(Math.round(cancelRate * 10.0) / 10.0);

        // Aggregation to calculate total confirmed revenue and total confirmed tickets
        Aggregation agg = newAggregation(
                match(Criteria.where("status").is(BookingStatus.CONFIRMED.name())),
                project("totalAmount")
                        .and(ArrayOperators.Size.lengthOfArray("seatNumbers")).as("ticketCount"),
                group()
                        .sum("totalAmount").as("totalRevenue")
                        .sum("ticketCount").as("totalTickets")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(agg, "bookings", Document.class);
        Document uniqueDoc = results.getUniqueMappedResult();

        if (uniqueDoc != null) {
            Object revObj = uniqueDoc.get("totalRevenue");
            BigDecimal revenue = parseBigDecimal(revObj);
            dto.setTotalRevenue(revenue);

            Object tktObj = uniqueDoc.get("totalTickets");
            long tickets = tktObj instanceof Number ? ((Number) tktObj).longValue() : 0L;
            dto.setConfirmedTickets(tickets);
        } else {
            dto.setTotalRevenue(BigDecimal.ZERO);
            dto.setConfirmedTickets(0L);
        }

        // Seats inventory overview
        long availableSeats = seatRepository.countByEventIdAndStatus(null, SeatStatus.AVAILABLE); // or count from all
        long totalSeatsCount = seatRepository.count();
        long heldSeats = mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(Criteria.where("status").is(SeatStatus.HELD.name())), Seat.class);
        long bookedSeats = mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(Criteria.where("status").is(SeatStatus.BOOKED.name())), Seat.class);
        long available = mongoTemplate.count(new org.springframework.data.mongodb.core.query.Query(Criteria.where("status").is(SeatStatus.AVAILABLE.name())), Seat.class);

        dto.setTotalSeats(totalSeatsCount);
        dto.setAvailableSeats(available);
        dto.setHeldSeats(heldSeats);
        dto.setBookedSeats(bookedSeats);

        return dto;
    }

    /**
     * Event-wise sales & revenue using $match, $project, $group, $sort aggregation stages.
     */
    public List<EventSalesDto> getEventWiseSales() {
        Aggregation agg = newAggregation(
                match(Criteria.where("status").is(BookingStatus.CONFIRMED.name())),
                project("eventId", "totalAmount")
                        .and(ArrayOperators.Size.lengthOfArray("seatNumbers")).as("ticketCount"),
                group("eventId")
                        .count().as("confirmedBookings")
                        .sum("ticketCount").as("ticketsSold")
                        .sum("totalAmount").as("revenue"),
                sort(Sort.Direction.DESC, "revenue"),
                limit(20)
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(agg, "bookings", Document.class);
        List<Document> docs = results.getMappedResults();

        // Fetch all relevant events in batch
        List<String> eventIds = docs.stream().map(d -> d.getString("_id")).toList();
        Map<String, Event> eventMap = eventRepository.findAllById(eventIds).stream()
                .collect(Collectors.toMap(Event::getId, e -> e));

        List<EventSalesDto> list = new ArrayList<>();
        for (Document d : docs) {
            String eventId = d.getString("_id");
            Event event = eventMap.get(eventId);
            String title = event != null ? event.getTitle() : "Event #" + eventId;
            String category = event != null ? event.getCategory() : "GENERAL";
            int capacity = 0;
            if (event != null && event.getTicketCategories() != null) {
                for (TicketCategory tc : event.getTicketCategories()) {
                    capacity += tc.getTotalSeats();
                }
            }

            long bookingsCount = d.get("confirmedBookings", Number.class).longValue();
            long ticketsSold = d.get("ticketsSold", Number.class).longValue();
            BigDecimal revenue = parseBigDecimal(d.get("revenue"));
            double occupancy = capacity > 0 ? Math.min(100.0, Math.round(((double) ticketsSold / capacity) * 1000.0) / 10.0) : 0.0;

            list.add(new EventSalesDto(eventId, title, category, bookingsCount, ticketsSold, revenue, capacity, occupancy));
        }

        return list;
    }

    /**
     * Revenue by Category using $match, $group by eventCategory, $sort aggregation stages.
     */
    public List<RevenueByCategoryDto> getRevenueByCategory() {
        Aggregation agg = newAggregation(
                match(Criteria.where("status").is(BookingStatus.CONFIRMED.name())),
                group("eventCategory")
                        .sum(ArrayOperators.Size.lengthOfArray("seatNumbers")).as("ticketsSold")
                        .sum("totalAmount").as("revenue"),
                sort(Sort.Direction.DESC, "revenue")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(agg, "bookings", Document.class);
        List<RevenueByCategoryDto> list = new ArrayList<>();

        for (Document doc : results.getMappedResults()) {
            String cat = doc.getString("_id");
            long tickets = doc.get("ticketsSold", Number.class).longValue();
            BigDecimal rev = parseBigDecimal(doc.get("revenue"));
            list.add(new RevenueByCategoryDto(cat != null ? cat : "GENERAL", tickets, rev));
        }

        return list;
    }

    /**
     * Daily sales trend using $match, $project with $dateToString, $group, $sort.
     */
    public List<DailySalesDto> getDailySalesTrend() {
        Aggregation agg = newAggregation(
                match(Criteria.where("status").is(BookingStatus.CONFIRMED.name())),
                project("totalAmount")
                        .and(DateOperators.DateToString.dateOf("bookedAt").toString("%Y-%m-%d")).as("day")
                        .and(ArrayOperators.Size.lengthOfArray("seatNumbers")).as("ticketCount"),
                group("day")
                        .count().as("bookingsCount")
                        .sum("ticketCount").as("ticketsCount")
                        .sum("totalAmount").as("revenue"),
                sort(Sort.Direction.ASC, "_id")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(agg, "bookings", Document.class);
        List<DailySalesDto> list = new ArrayList<>();

        for (Document doc : results.getMappedResults()) {
            String day = doc.getString("_id");
            long bookings = doc.get("bookingsCount", Number.class).longValue();
            long tickets = doc.get("ticketsCount", Number.class).longValue();
            BigDecimal rev = parseBigDecimal(doc.get("revenue"));
            list.add(new DailySalesDto(day != null ? day : "N/A", bookings, tickets, rev));
        }

        return list;
    }

    private BigDecimal parseBigDecimal(Object obj) {
        if (obj == null) return BigDecimal.ZERO;
        if (obj instanceof org.bson.types.Decimal128 d128) {
            return d128.bigDecimalValue();
        }
        if (obj instanceof BigDecimal bd) {
            return bd;
        }
        if (obj instanceof Number num) {
            return BigDecimal.valueOf(num.doubleValue());
        }
        try {
            return new BigDecimal(obj.toString());
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
