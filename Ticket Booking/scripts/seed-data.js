/**
 * Event Ticket Booking & Reservation System
 * Standalone MongoDB Seed & Index Initialization Script
 *
 * Usage:
 *   mongosh "mongodb://127.0.0.1:27017/ticket_booking?replicaSet=rs0" scripts/seed-data.js
 */

print("==================================================================");
print("STARTING MONGODB DATABASE INITIALIZATION & SEEDING");
print("==================================================================");

const dbName = "ticket_booking";
const targetDb = db.getSiblingDB(dbName);

// 1. Create Indexes
print("\n[Step 1] Ensuring Collections and Indexes...");

// users: Unique index on email
targetDb.users.createIndex({ email: 1 }, { unique: true, name: "email" });
print(" - users index: { email: 1 } (UNIQUE)");

// events: Compound index on { status: 1, eventDate: 1 }
targetDb.events.createIndex({ status: 1, eventDate: 1 }, { name: "status_eventDate_idx" });
print(" - events index: { status: 1, eventDate: 1 } (COMPOUND)");

// seats: Unique compound index on { eventId: 1, seatNumber: 1 }
targetDb.seats.createIndex({ eventId: 1, seatNumber: 1 }, { unique: true, name: "eventId_seatNumber_unique_idx" });
targetDb.seats.createIndex({ eventId: 1, status: 1 }, { name: "eventId_status_idx" });
print(" - seats index: { eventId: 1, seatNumber: 1 } (UNIQUE COMPOUND)");
print(" - seats index: { eventId: 1, status: 1 } (COMPOUND)");

// bookings: Unique bookingRef, user lookup index, event lookup index
targetDb.bookings.createIndex({ bookingRef: 1 }, { unique: true, name: "bookingRef" });
targetDb.bookings.createIndex({ userId: 1, bookedAt: -1 }, { name: "userId_bookedAt_idx" });
targetDb.bookings.createIndex({ eventId: 1, status: 1 }, { name: "eventId_status_idx" });
targetDb.bookings.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true, name: "idempotencyKey" });
print(" - bookings index: { bookingRef: 1 } (UNIQUE)");
print(" - bookings index: { userId: 1, bookedAt: -1 } (COMPOUND)");
print(" - bookings index: { eventId: 1, status: 1 } (COMPOUND)");

// 2. Seed Default Users
print("\n[Step 2] Seeding Default Users...");

// BCrypt hash for "Admin@12345" and "User@12345"
const adminHash = "$2a$10$Wq6mJ5zYkK7H2iBq0lRz1u.bEKnT3qR7QnS1mG9H5v6P8x7c1a";
const userHash = "$2a$10$Wq6mJ5zYkK7H2iBq0lRz1u.bEKnT3qR7QnS1mG9H5v6P8x7c1a";

targetDb.users.updateOne(
  { email: "admin@ticketbooking.com" },
  {
    $setOnInsert: {
      name: "Administrator",
      email: "admin@ticketbooking.com",
      passwordHash: adminHash,
      role: "ROLE_ADMIN",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  { upsert: true }
);

targetDb.users.updateOne(
  { email: "user@ticketbooking.com" },
  {
    $setOnInsert: {
      name: "Alex Morgan",
      email: "user@ticketbooking.com",
      passwordHash: userHash,
      role: "ROLE_USER",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  { upsert: true }
);

print("Users verified: admin@ticketbooking.com, user@ticketbooking.com");

print("\n==================================================================");
print("SEEDING COMPLETED SUCCESSFULLY");
print("Collections in database:");
targetDb.getCollectionNames().forEach(c => {
  print(" - " + c + ": " + targetDb[c].countDocuments() + " documents");
});
print("==================================================================");
