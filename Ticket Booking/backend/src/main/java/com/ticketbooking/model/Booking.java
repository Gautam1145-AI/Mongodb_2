package com.ticketbooking.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "bookings")
@CompoundIndexes({
    @CompoundIndex(name = "userId_bookedAt_idx", def = "{'userId': 1, 'bookedAt': -1}"),
    @CompoundIndex(name = "eventId_status_idx", def = "{'eventId': 1, 'status': 1}")
})
public class Booking {

    @Id
    private String id;

    @Indexed(unique = true)
    private String bookingRef;

    private String userId;

    private String userEmail;

    private String userName;

    private String eventId;

    private String eventTitle;

    private String eventCategory;

    private List<String> seatNumbers = new ArrayList<>();

    private BookingStatus status = BookingStatus.PENDING;

    @org.springframework.data.mongodb.core.mapping.Field(targetType = org.springframework.data.mongodb.core.mapping.FieldType.DECIMAL128)
    private BigDecimal totalAmount;

    private PaymentStatus paymentStatus = PaymentStatus.NOT_REQUIRED;

    @Indexed(unique = true, sparse = true)
    private String idempotencyKey;

    private Instant bookedAt;

    private Instant cancelledAt;

    @CreatedDate
    private Instant createdAt = Instant.now();

    @LastModifiedDate
    private Instant updatedAt = Instant.now();

    public Booking() {
    }

    public Booking(String id, String bookingRef, String userId, String userEmail, String userName,
                   String eventId, String eventTitle, List<String> seatNumbers,
                   BookingStatus status, BigDecimal totalAmount, PaymentStatus paymentStatus,
                   String idempotencyKey, Instant bookedAt) {
        this.id = id;
        this.bookingRef = bookingRef;
        this.userId = userId;
        this.userEmail = userEmail;
        this.userName = userName;
        this.eventId = eventId;
        this.eventTitle = eventTitle;
        this.seatNumbers = seatNumbers != null ? seatNumbers : new ArrayList<>();
        this.status = status != null ? status : BookingStatus.PENDING;
        this.totalAmount = totalAmount;
        this.paymentStatus = paymentStatus != null ? paymentStatus : PaymentStatus.NOT_REQUIRED;
        this.idempotencyKey = idempotencyKey;
        this.bookedAt = bookedAt != null ? bookedAt : Instant.now();
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getBookingRef() {
        return bookingRef;
    }

    public void setBookingRef(String bookingRef) {
        this.bookingRef = bookingRef;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventTitle() {
        return eventTitle;
    }

    public void setEventTitle(String eventTitle) {
        this.eventTitle = eventTitle;
    }

    public String getEventCategory() {
        return eventCategory;
    }

    public void setEventCategory(String eventCategory) {
        this.eventCategory = eventCategory;
    }

    public List<String> getSeatNumbers() {
        return seatNumbers;
    }

    public void setSeatNumbers(List<String> seatNumbers) {
        this.seatNumbers = seatNumbers;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getIdempotencyKey() {
        return idempotencyKey;
    }

    public void setIdempotencyKey(String idempotencyKey) {
        this.idempotencyKey = idempotencyKey;
    }

    public Instant getBookedAt() {
        return bookedAt;
    }

    public void setBookedAt(Instant bookedAt) {
        this.bookedAt = bookedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
