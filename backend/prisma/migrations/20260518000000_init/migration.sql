-- TripNow initial schema migration
-- Generated to mirror prisma/schema.prisma

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'AGENT');
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');
CREATE TYPE "FlightStatus" AS ENUM ('SCHEDULED', 'BOARDING', 'IN_AIR', 'LANDED', 'DELAYED', 'CANCELLED');
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'TWIN', 'TRIPLE', 'SUITE', 'FAMILY', 'DELUXE', 'STUDIO');
CREATE TYPE "VehicleType" AS ENUM ('CAR', 'SUV', 'VAN', 'TRUCK', 'MOTORCYCLE');
CREATE TYPE "CarCategory" AS ENUM ('ECONOMY', 'COMPACT', 'MIDSIZE', 'FULLSIZE', 'PREMIUM', 'LUXURY', 'SUV', 'VAN', 'CONVERTIBLE');
CREATE TYPE "Transmission" AS ENUM ('AUTOMATIC', 'MANUAL');
CREATE TYPE "FuelType" AS ENUM ('GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC');
CREATE TYPE "AttractionCategory" AS ENUM (
  'MUSEUM', 'PARK', 'MONUMENT', 'THEME_PARK', 'HISTORICAL_SITE',
  'NATURE', 'BEACH', 'TOUR', 'RESTAURANT', 'NIGHTLIFE',
  'SHOPPING', 'ENTERTAINMENT', 'RELIGIOUS_SITE', 'OTHER'
);
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ItineraryItemType" AS ENUM (
  'FLIGHT', 'CAR_RENTAL', 'ACCOMMODATION', 'ATTRACTION',
  'RESTAURANT', 'ACTIVITY', 'TRANSFER', 'CUSTOM'
);
CREATE TYPE "BookingType" AS ENUM ('FLIGHT', 'CAR_RENTAL', 'ATTRACTION', 'ACCOMMODATION');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REFUNDED');
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'PAYPAL', 'BANK_TRANSFER', 'WALLET', 'CRYPTO', 'CASH');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');
CREATE TYPE "AiAgentType" AS ENUM ('TRIP_PLANNER', 'FLIGHT_HUNTER', 'LOCAL_GUIDE', 'BUDGET_ADVISOR');
CREATE TYPE "AiMessageRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM', 'TOOL');

-- ============================================================
-- Users
-- ============================================================
CREATE TABLE "users" (
  "id"            TEXT PRIMARY KEY,
  "email"         TEXT NOT NULL UNIQUE,
  "passwordHash"  TEXT NOT NULL,
  "firstName"     TEXT NOT NULL,
  "lastName"      TEXT NOT NULL,
  "phone"         TEXT,
  "avatarUrl"     TEXT,
  "role"          "UserRole" NOT NULL DEFAULT 'USER',
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "lastLoginAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL
);
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_email_idx" ON "users"("email");

CREATE TABLE "agent_profiles" (
  "id"              TEXT PRIMARY KEY,
  "userId"          TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "licenseNumber"   TEXT UNIQUE,
  "agencyName"      TEXT,
  "bio"             TEXT,
  "commissionRate"  DOUBLE PRECISION NOT NULL DEFAULT 0.10,
  "yearsExperience" INTEGER,
  "languages"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "specialties"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rating"          DOUBLE PRECISION,
  "reviewCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);

CREATE TABLE "refresh_tokens" (
  "id"        TEXT PRIMARY KEY,
  "token"     TEXT NOT NULL UNIQUE,
  "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revoked"   BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- ============================================================
-- Geography & Airlines
-- ============================================================
CREATE TABLE "airports" (
  "id"        TEXT PRIMARY KEY,
  "code"      TEXT NOT NULL UNIQUE,
  "icao"      TEXT UNIQUE,
  "name"      TEXT NOT NULL,
  "city"      TEXT NOT NULL,
  "country"   TEXT NOT NULL,
  "latitude"  DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "timezone"  TEXT
);
CREATE INDEX "airports_city_idx" ON "airports"("city");
CREATE INDEX "airports_country_idx" ON "airports"("country");

CREATE TABLE "airlines" (
  "id"      TEXT PRIMARY KEY,
  "code"    TEXT NOT NULL UNIQUE,
  "icao"    TEXT UNIQUE,
  "name"    TEXT NOT NULL,
  "country" TEXT,
  "logoUrl" TEXT
);

-- ============================================================
-- Flights
-- ============================================================
CREATE TABLE "flights" (
  "id"                    TEXT PRIMARY KEY,
  "flightNumber"          TEXT NOT NULL,
  "airlineId"             TEXT NOT NULL REFERENCES "airlines"("id"),
  "originAirportId"       TEXT NOT NULL REFERENCES "airports"("id"),
  "destinationAirportId"  TEXT NOT NULL REFERENCES "airports"("id"),
  "departureTime"         TIMESTAMP(3) NOT NULL,
  "arrivalTime"           TIMESTAMP(3) NOT NULL,
  "durationMinutes"       INTEGER NOT NULL,
  "basePriceCents"        INTEGER NOT NULL,
  "currency"              TEXT NOT NULL DEFAULT 'USD',
  "cabinClass"            "CabinClass" NOT NULL DEFAULT 'ECONOMY',
  "totalSeats"            INTEGER NOT NULL,
  "availableSeats"        INTEGER NOT NULL,
  "status"                "FlightStatus" NOT NULL DEFAULT 'SCHEDULED',
  "baggageAllowance"      JSONB,
  "externalRef"           TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "flights_airline_number_dep_key"
  ON "flights"("airlineId", "flightNumber", "departureTime");
CREATE INDEX "flights_airlineId_idx" ON "flights"("airlineId");
CREATE INDEX "flights_origin_dest_idx"
  ON "flights"("originAirportId", "destinationAirportId");
CREATE INDEX "flights_departureTime_idx" ON "flights"("departureTime");
CREATE INDEX "flights_status_idx" ON "flights"("status");

CREATE TABLE "flight_stops" (
  "id"              TEXT PRIMARY KEY,
  "flightId"        TEXT NOT NULL REFERENCES "flights"("id") ON DELETE CASCADE,
  "airportId"       TEXT NOT NULL REFERENCES "airports"("id"),
  "arrivalTime"     TIMESTAMP(3) NOT NULL,
  "departureTime"   TIMESTAMP(3) NOT NULL,
  "stopOrder"       INTEGER NOT NULL,
  "durationMinutes" INTEGER NOT NULL
);
CREATE INDEX "flight_stops_flightId_idx" ON "flight_stops"("flightId");
CREATE UNIQUE INDEX "flight_stops_flight_order_key" ON "flight_stops"("flightId", "stopOrder");

-- ============================================================
-- Hotels
-- ============================================================
CREATE TABLE "hotels" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "description"   TEXT,
  "city"          TEXT NOT NULL,
  "country"       TEXT NOT NULL,
  "address"       TEXT NOT NULL,
  "latitude"      DOUBLE PRECISION NOT NULL,
  "longitude"     DOUBLE PRECISION NOT NULL,
  "starRating"    INTEGER,
  "amenities"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "checkInTime"   TEXT,
  "checkOutTime"  TEXT,
  "phone"         TEXT,
  "email"         TEXT,
  "websiteUrl"    TEXT,
  "imageUrls"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "policies"      JSONB,
  "averageRating" DOUBLE PRECISION,
  "reviewCount"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL
);
CREATE INDEX "hotels_city_country_idx" ON "hotels"("city", "country");
CREATE INDEX "hotels_starRating_idx" ON "hotels"("starRating");

CREATE TABLE "hotel_rooms" (
  "id"                 TEXT PRIMARY KEY,
  "hotelId"            TEXT NOT NULL REFERENCES "hotels"("id") ON DELETE CASCADE,
  "type"               "RoomType" NOT NULL,
  "name"               TEXT NOT NULL,
  "description"        TEXT,
  "maxOccupancy"       INTEGER NOT NULL,
  "bedConfiguration"   TEXT,
  "pricePerNightCents" INTEGER NOT NULL,
  "currency"           TEXT NOT NULL DEFAULT 'USD',
  "totalRooms"         INTEGER NOT NULL DEFAULT 1,
  "amenities"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "imageUrls"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
);
CREATE INDEX "hotel_rooms_hotelId_idx" ON "hotel_rooms"("hotelId");

CREATE TABLE "hotel_room_availability" (
  "id"             TEXT PRIMARY KEY,
  "roomId"         TEXT NOT NULL REFERENCES "hotel_rooms"("id") ON DELETE CASCADE,
  "date"           DATE NOT NULL,
  "availableCount" INTEGER NOT NULL,
  "priceCents"     INTEGER NOT NULL
);
CREATE UNIQUE INDEX "hotel_room_availability_room_date_key"
  ON "hotel_room_availability"("roomId", "date");
CREATE INDEX "hotel_room_availability_date_idx" ON "hotel_room_availability"("date");

-- ============================================================
-- Cars
-- ============================================================
CREATE TABLE "car_rental_companies" (
  "id"         TEXT PRIMARY KEY,
  "name"       TEXT NOT NULL UNIQUE,
  "logoUrl"    TEXT,
  "websiteUrl" TEXT,
  "rating"     DOUBLE PRECISION
);

CREATE TABLE "car_rental_locations" (
  "id"           TEXT PRIMARY KEY,
  "name"         TEXT NOT NULL,
  "city"         TEXT NOT NULL,
  "country"      TEXT NOT NULL,
  "address"      TEXT,
  "latitude"     DOUBLE PRECISION,
  "longitude"    DOUBLE PRECISION,
  "phone"        TEXT,
  "openingHours" JSONB
);
CREATE INDEX "car_rental_locations_city_country_idx"
  ON "car_rental_locations"("city", "country");

CREATE TABLE "car_rentals" (
  "id"               TEXT PRIMARY KEY,
  "companyId"        TEXT NOT NULL REFERENCES "car_rental_companies"("id") ON DELETE CASCADE,
  "locationId"       TEXT NOT NULL REFERENCES "car_rental_locations"("id"),
  "vehicleType"      "VehicleType" NOT NULL,
  "category"         "CarCategory" NOT NULL,
  "make"             TEXT NOT NULL,
  "model"            TEXT NOT NULL,
  "year"             INTEGER,
  "transmission"     "Transmission" NOT NULL DEFAULT 'AUTOMATIC',
  "fuelType"         "FuelType" NOT NULL DEFAULT 'GASOLINE',
  "seats"            INTEGER NOT NULL,
  "doors"            INTEGER NOT NULL,
  "airConditioned"   BOOLEAN NOT NULL DEFAULT true,
  "pricePerDayCents" INTEGER NOT NULL,
  "currency"         TEXT NOT NULL DEFAULT 'USD',
  "totalUnits"       INTEGER NOT NULL DEFAULT 1,
  "available"        BOOLEAN NOT NULL DEFAULT true,
  "imageUrl"         TEXT,
  "features"         TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL
);
CREATE INDEX "car_rentals_companyId_idx" ON "car_rentals"("companyId");
CREATE INDEX "car_rentals_locationId_idx" ON "car_rentals"("locationId");
CREATE INDEX "car_rentals_category_idx" ON "car_rentals"("category");

-- ============================================================
-- Attractions
-- ============================================================
CREATE TABLE "attractions" (
  "id"              TEXT PRIMARY KEY,
  "externalId"      TEXT UNIQUE,
  "source"          TEXT,
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "city"            TEXT NOT NULL,
  "country"         TEXT NOT NULL,
  "address"         TEXT,
  "latitude"        DOUBLE PRECISION NOT NULL,
  "longitude"       DOUBLE PRECISION NOT NULL,
  "category"        "AttractionCategory" NOT NULL,
  "subcategories"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rating"          DOUBLE PRECISION,
  "reviewCount"     INTEGER NOT NULL DEFAULT 0,
  "priceCents"      INTEGER,
  "childPriceCents" INTEGER,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "durationMinutes" INTEGER,
  "imageUrls"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "websiteUrl"      TEXT,
  "phone"           TEXT,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL
);
CREATE INDEX "attractions_city_country_idx" ON "attractions"("city", "country");
CREATE INDEX "attractions_category_idx" ON "attractions"("category");
CREATE INDEX "attractions_rating_idx" ON "attractions"("rating");

CREATE TABLE "attraction_opening_hours" (
  "id"           TEXT PRIMARY KEY,
  "attractionId" TEXT NOT NULL REFERENCES "attractions"("id") ON DELETE CASCADE,
  "dayOfWeek"    INTEGER NOT NULL,
  "opensAt"      TEXT,
  "closesAt"     TEXT,
  "closed"       BOOLEAN NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX "attraction_opening_hours_attr_day_key"
  ON "attraction_opening_hours"("attractionId", "dayOfWeek");

-- ============================================================
-- Trips & itinerary
-- ============================================================
CREATE TABLE "trips" (
  "id"             TEXT PRIMARY KEY,
  "userId"         TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "agentId"        TEXT REFERENCES "users"("id") ON DELETE SET NULL,
  "title"          TEXT NOT NULL,
  "destination"    TEXT NOT NULL,
  "startDate"      TIMESTAMP(3) NOT NULL,
  "endDate"        TIMESTAMP(3) NOT NULL,
  "budgetCents"    INTEGER,
  "spentCents"     INTEGER NOT NULL DEFAULT 0,
  "currency"       TEXT NOT NULL DEFAULT 'USD',
  "travelersCount" INTEGER NOT NULL DEFAULT 1,
  "status"         "TripStatus" NOT NULL DEFAULT 'DRAFT',
  "notes"          TEXT,
  "isPublic"       BOOLEAN NOT NULL DEFAULT false,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL
);
CREATE INDEX "trips_userId_idx" ON "trips"("userId");
CREATE INDEX "trips_agentId_idx" ON "trips"("agentId");
CREATE INDEX "trips_status_idx" ON "trips"("status");
CREATE INDEX "trips_dates_idx" ON "trips"("startDate", "endDate");

CREATE TABLE "itinerary_items" (
  "id"           TEXT PRIMARY KEY,
  "tripId"       TEXT NOT NULL REFERENCES "trips"("id") ON DELETE CASCADE,
  "attractionId" TEXT REFERENCES "attractions"("id") ON DELETE SET NULL,
  "type"         "ItineraryItemType" NOT NULL,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "startsAt"     TIMESTAMP(3) NOT NULL,
  "endsAt"       TIMESTAMP(3),
  "location"     TEXT,
  "latitude"     DOUBLE PRECISION,
  "longitude"    DOUBLE PRECISION,
  "costCents"    INTEGER,
  "currency"     TEXT NOT NULL DEFAULT 'USD',
  "metadata"     JSONB,
  "orderIndex"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL
);
CREATE INDEX "itinerary_items_tripId_idx" ON "itinerary_items"("tripId");
CREATE INDEX "itinerary_items_attractionId_idx" ON "itinerary_items"("attractionId");
CREATE INDEX "itinerary_items_startsAt_idx" ON "itinerary_items"("startsAt");

-- ============================================================
-- Bookings
-- ============================================================
CREATE TABLE "bookings" (
  "id"            TEXT PRIMARY KEY,
  "bookingNumber" TEXT NOT NULL UNIQUE,
  "userId"        TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tripId"        TEXT REFERENCES "trips"("id") ON DELETE SET NULL,
  "type"          "BookingType" NOT NULL,
  "status"        "BookingStatus" NOT NULL DEFAULT 'PENDING',
  "totalCents"    INTEGER NOT NULL,
  "currency"      TEXT NOT NULL DEFAULT 'USD',
  "notes"         TEXT,
  "confirmedAt"   TIMESTAMP(3),
  "cancelledAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL
);
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");
CREATE INDEX "bookings_tripId_idx" ON "bookings"("tripId");
CREATE INDEX "bookings_type_idx" ON "bookings"("type");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

CREATE TABLE "flight_bookings" (
  "id"              TEXT PRIMARY KEY,
  "bookingId"       TEXT NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
  "flightId"        TEXT NOT NULL REFERENCES "flights"("id"),
  "passengerCount"  INTEGER NOT NULL,
  "cabinClass"      "CabinClass" NOT NULL,
  "pnr"             TEXT,
  "seatAssignments" JSONB,
  "passengerInfo"   JSONB
);
CREATE INDEX "flight_bookings_flightId_idx" ON "flight_bookings"("flightId");

CREATE TABLE "hotel_bookings" (
  "id"              TEXT PRIMARY KEY,
  "bookingId"       TEXT NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
  "hotelId"         TEXT NOT NULL REFERENCES "hotels"("id"),
  "roomId"          TEXT NOT NULL REFERENCES "hotel_rooms"("id"),
  "checkInDate"     DATE NOT NULL,
  "checkOutDate"    DATE NOT NULL,
  "guestCount"      INTEGER NOT NULL,
  "roomCount"       INTEGER NOT NULL DEFAULT 1,
  "guestNames"      JSONB,
  "specialRequests" TEXT
);
CREATE INDEX "hotel_bookings_hotelId_idx" ON "hotel_bookings"("hotelId");
CREATE INDEX "hotel_bookings_roomId_idx" ON "hotel_bookings"("roomId");
CREATE INDEX "hotel_bookings_dates_idx" ON "hotel_bookings"("checkInDate", "checkOutDate");

CREATE TABLE "car_bookings" (
  "id"                TEXT PRIMARY KEY,
  "bookingId"         TEXT NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
  "carRentalId"       TEXT NOT NULL REFERENCES "car_rentals"("id"),
  "pickupLocationId"  TEXT REFERENCES "car_rental_locations"("id"),
  "dropoffLocationId" TEXT REFERENCES "car_rental_locations"("id"),
  "pickupDate"        TIMESTAMP(3) NOT NULL,
  "dropoffDate"       TIMESTAMP(3) NOT NULL,
  "driverAge"         INTEGER NOT NULL,
  "driverInfo"        JSONB,
  "insurance"         JSONB
);
CREATE INDEX "car_bookings_carRentalId_idx" ON "car_bookings"("carRentalId");
CREATE INDEX "car_bookings_dates_idx" ON "car_bookings"("pickupDate", "dropoffDate");

CREATE TABLE "attraction_bookings" (
  "id"            TEXT PRIMARY KEY,
  "bookingId"     TEXT NOT NULL UNIQUE REFERENCES "bookings"("id") ON DELETE CASCADE,
  "attractionId"  TEXT NOT NULL REFERENCES "attractions"("id"),
  "visitDate"     TIMESTAMP(3) NOT NULL,
  "visitTimeSlot" TEXT,
  "adultCount"    INTEGER NOT NULL DEFAULT 1,
  "childCount"    INTEGER NOT NULL DEFAULT 0,
  "ticketType"    TEXT
);
CREATE INDEX "attraction_bookings_attractionId_idx" ON "attraction_bookings"("attractionId");
CREATE INDEX "attraction_bookings_visitDate_idx" ON "attraction_bookings"("visitDate");

-- ============================================================
-- Payments
-- ============================================================
CREATE TABLE "payments" (
  "id"                  TEXT PRIMARY KEY,
  "paymentNumber"       TEXT NOT NULL UNIQUE,
  "userId"              TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "bookingId"           TEXT UNIQUE REFERENCES "bookings"("id") ON DELETE SET NULL,
  "amountCents"         INTEGER NOT NULL,
  "feeCents"            INTEGER NOT NULL DEFAULT 0,
  "refundedAmountCents" INTEGER NOT NULL DEFAULT 0,
  "currency"            TEXT NOT NULL DEFAULT 'USD',
  "method"              "PaymentMethod" NOT NULL,
  "status"              "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "provider"            TEXT NOT NULL DEFAULT 'stripe',
  "providerIntentId"    TEXT UNIQUE,
  "providerCustomerId"  TEXT,
  "providerChargeId"    TEXT,
  "reference"           TEXT,
  "failureReason"       TEXT,
  "paidAt"              TIMESTAMP(3),
  "refundedAt"          TIMESTAMP(3),
  "metadata"            JSONB,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL
);
CREATE INDEX "payments_userId_idx" ON "payments"("userId");
CREATE INDEX "payments_status_idx" ON "payments"("status");
CREATE INDEX "payments_method_idx" ON "payments"("method");

-- ============================================================
-- Reviews
-- ============================================================
CREATE TABLE "reviews" (
  "id"           TEXT PRIMARY KEY,
  "userId"       TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "hotelId"      TEXT REFERENCES "hotels"("id") ON DELETE CASCADE,
  "attractionId" TEXT REFERENCES "attractions"("id") ON DELETE CASCADE,
  "rating"       INTEGER NOT NULL,
  "title"        TEXT,
  "body"         TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL
);
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");
CREATE INDEX "reviews_hotelId_idx" ON "reviews"("hotelId");
CREATE INDEX "reviews_attractionId_idx" ON "reviews"("attractionId");

-- ============================================================
-- AI
-- ============================================================
CREATE TABLE "ai_conversations" (
  "id"        TEXT PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "agentType" "AiAgentType" NOT NULL,
  "title"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ai_conversations_userId_idx" ON "ai_conversations"("userId");

CREATE TABLE "ai_messages" (
  "id"             TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL REFERENCES "ai_conversations"("id") ON DELETE CASCADE,
  "role"           "AiMessageRole" NOT NULL,
  "content"        TEXT NOT NULL,
  "toolCalls"      JSONB,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ai_messages_conversationId_idx" ON "ai_messages"("conversationId");
