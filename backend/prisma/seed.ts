import {
  AttractionCategory,
  BookingStatus,
  BookingType,
  CabinClass,
  CarCategory,
  FlightStatus,
  FuelType,
  ItineraryItemType,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  RoomType,
  Transmission,
  TripStatus,
  UserRole,
  VehicleType,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.info('🌱 Seeding TripNow database...');

  // ----------------------------------------------------------
  // Users
  // ----------------------------------------------------------
  const passwordHash = await bcrypt.hash('Tripnow123!', 10);

  const [admin, agent, alice, bob] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@tripnow.local' },
      update: {},
      create: {
        email: 'admin@tripnow.local',
        passwordHash,
        firstName: 'Admin',
        lastName: 'TripNow',
        role: UserRole.ADMIN,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'agent@tripnow.local' },
      update: {},
      create: {
        email: 'agent@tripnow.local',
        passwordHash,
        firstName: 'Marina',
        lastName: 'Castro',
        role: UserRole.AGENT,
        emailVerified: true,
        agentProfile: {
          create: {
            licenseNumber: 'AG-2024-0001',
            agencyName: 'TripNow Agency',
            bio: 'Especialista en viajes culturales por Europa.',
            commissionRate: 0.12,
            yearsExperience: 8,
            languages: ['es', 'en', 'fr'],
            specialties: ['Europa', 'gastronomía', 'arte'],
          },
        },
      },
    }),
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        passwordHash,
        firstName: 'Alice',
        lastName: 'Smith',
        role: UserRole.USER,
        emailVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        passwordHash,
        firstName: 'Bob',
        lastName: 'Jones',
        role: UserRole.USER,
        emailVerified: true,
      },
    }),
  ]);

  // ----------------------------------------------------------
  // Airports & Airlines
  // ----------------------------------------------------------
  const airports = await Promise.all(
    [
      { code: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'ES', latitude: 40.4983, longitude: -3.5676, timezone: 'Europe/Madrid' },
      { code: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'ES', latitude: 41.2974, longitude: 2.0833, timezone: 'Europe/Madrid' },
      { code: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'FR', latitude: 49.0097, longitude: 2.5479, timezone: 'Europe/Paris' },
      { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'GB', latitude: 51.4700, longitude: -0.4543, timezone: 'Europe/London' },
      { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US', latitude: 40.6413, longitude: -73.7781, timezone: 'America/New_York' },
    ].map((a) =>
      prisma.airport.upsert({ where: { code: a.code }, update: {}, create: a }),
    ),
  );
  const [mad, bcn, cdg, lhr, jfk] = airports;

  const airlines = await Promise.all(
    [
      { code: 'IB', name: 'Iberia', country: 'ES' },
      { code: 'VY', name: 'Vueling', country: 'ES' },
      { code: 'AF', name: 'Air France', country: 'FR' },
      { code: 'BA', name: 'British Airways', country: 'GB' },
    ].map((a) =>
      prisma.airline.upsert({ where: { code: a.code }, update: {}, create: a }),
    ),
  );
  const [iberia, vueling, airFrance, britishAirways] = airlines;

  // ----------------------------------------------------------
  // Flights (and one with a stop)
  // ----------------------------------------------------------
  const dep1 = new Date('2026-07-10T08:00:00Z');
  const arr1 = new Date('2026-07-10T09:30:00Z');
  const dep2 = new Date('2026-07-12T18:30:00Z');
  const arr2 = new Date('2026-07-12T20:15:00Z');
  const dep3 = new Date('2026-07-15T10:00:00Z');
  const arr3 = new Date('2026-07-15T15:30:00Z'); // with 1 stop in CDG

  const flightDirect = await prisma.flight.upsert({
    where: {
      airlineId_flightNumber_departureTime: {
        airlineId: iberia.id,
        flightNumber: 'IB3104',
        departureTime: dep1,
      },
    },
    update: {},
    create: {
      flightNumber: 'IB3104',
      airlineId: iberia.id,
      originAirportId: mad.id,
      destinationAirportId: bcn.id,
      departureTime: dep1,
      arrivalTime: arr1,
      durationMinutes: 90,
      basePriceCents: 8900,
      totalSeats: 180,
      availableSeats: 42,
      cabinClass: CabinClass.ECONOMY,
      status: FlightStatus.SCHEDULED,
    },
  });

  const flightReturn = await prisma.flight.upsert({
    where: {
      airlineId_flightNumber_departureTime: {
        airlineId: vueling.id,
        flightNumber: 'VY1009',
        departureTime: dep2,
      },
    },
    update: {},
    create: {
      flightNumber: 'VY1009',
      airlineId: vueling.id,
      originAirportId: bcn.id,
      destinationAirportId: mad.id,
      departureTime: dep2,
      arrivalTime: arr2,
      durationMinutes: 105,
      basePriceCents: 6500,
      totalSeats: 186,
      availableSeats: 53,
      cabinClass: CabinClass.ECONOMY,
      status: FlightStatus.SCHEDULED,
    },
  });

  const flightWithStop = await prisma.flight.upsert({
    where: {
      airlineId_flightNumber_departureTime: {
        airlineId: airFrance.id,
        flightNumber: 'AF1234',
        departureTime: dep3,
      },
    },
    update: {},
    create: {
      flightNumber: 'AF1234',
      airlineId: airFrance.id,
      originAirportId: mad.id,
      destinationAirportId: lhr.id,
      departureTime: dep3,
      arrivalTime: arr3,
      durationMinutes: 330,
      basePriceCents: 21500,
      totalSeats: 220,
      availableSeats: 88,
      cabinClass: CabinClass.ECONOMY,
      status: FlightStatus.SCHEDULED,
      stops: {
        create: [
          {
            airportId: cdg.id,
            arrivalTime: new Date('2026-07-15T12:00:00Z'),
            departureTime: new Date('2026-07-15T13:30:00Z'),
            stopOrder: 1,
            durationMinutes: 90,
          },
        ],
      },
    },
  });

  // ----------------------------------------------------------
  // Hotels & rooms & availability
  // ----------------------------------------------------------
  const hotel = await prisma.hotel.create({
    data: {
      name: 'Hotel Mirador Madrid',
      description: 'Hotel boutique en el centro de Madrid con vistas a Gran Vía.',
      city: 'Madrid',
      country: 'ES',
      address: 'Gran Vía 42, 28013 Madrid',
      latitude: 40.4204,
      longitude: -3.7058,
      starRating: 4,
      amenities: ['wifi', 'breakfast', 'gym', 'rooftop', 'air_conditioning'],
      checkInTime: '15:00',
      checkOutTime: '11:00',
      phone: '+34 91 000 0000',
      email: 'info@miradormadrid.example',
      websiteUrl: 'https://miradormadrid.example',
      imageUrls: ['https://example.com/hotel1.jpg'],
      averageRating: 4.6,
      reviewCount: 312,
      rooms: {
        create: [
          {
            type: RoomType.DOUBLE,
            name: 'Habitación Doble Estándar',
            description: 'Cama de matrimonio, baño privado, vistas interiores.',
            maxOccupancy: 2,
            bedConfiguration: '1 king',
            pricePerNightCents: 12500,
            totalRooms: 20,
            amenities: ['tv', 'wifi', 'safe'],
          },
          {
            type: RoomType.SUITE,
            name: 'Suite Gran Vía',
            description: 'Suite con balcón y vistas a Gran Vía.',
            maxOccupancy: 3,
            bedConfiguration: '1 king + 1 sofa bed',
            pricePerNightCents: 24500,
            totalRooms: 5,
            amenities: ['tv', 'wifi', 'safe', 'minibar', 'balcony'],
          },
        ],
      },
    },
    include: { rooms: true },
  });

  // Generate availability for the next 30 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const room of hotel.rooms) {
    const availability = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      return {
        roomId: room.id,
        date,
        availableCount: Math.max(1, room.totalRooms - (i % 5)),
        priceCents: room.pricePerNightCents + (i % 7 === 0 ? 2000 : 0),
      };
    });
    await prisma.hotelRoomAvailability.createMany({
      data: availability,
      skipDuplicates: true,
    });
  }

  // ----------------------------------------------------------
  // Cars
  // ----------------------------------------------------------
  const [avis, hertz] = await Promise.all([
    prisma.carRentalCompany.upsert({
      where: { name: 'Avis' },
      update: {},
      create: { name: 'Avis', rating: 4.2 },
    }),
    prisma.carRentalCompany.upsert({
      where: { name: 'Hertz' },
      update: {},
      create: { name: 'Hertz', rating: 4.1 },
    }),
  ]);

  const madLocation = await prisma.carRentalLocation.create({
    data: {
      name: 'Madrid Barajas T1',
      city: 'Madrid',
      country: 'ES',
      address: 'Aeropuerto Barajas T1',
      latitude: 40.4719,
      longitude: -3.5626,
      phone: '+34 91 393 7222',
    },
  });

  const bcnLocation = await prisma.carRentalLocation.create({
    data: {
      name: 'Barcelona El Prat T1',
      city: 'Barcelona',
      country: 'ES',
      address: 'Aeropuerto El Prat T1',
      latitude: 41.2911,
      longitude: 2.0750,
    },
  });

  await prisma.carRental.createMany({
    data: [
      {
        companyId: avis.id,
        locationId: madLocation.id,
        vehicleType: VehicleType.CAR,
        category: CarCategory.ECONOMY,
        make: 'Toyota',
        model: 'Yaris',
        year: 2024,
        transmission: Transmission.MANUAL,
        fuelType: FuelType.GASOLINE,
        seats: 5,
        doors: 5,
        pricePerDayCents: 3500,
        totalUnits: 8,
        features: ['bluetooth', 'usb'],
      },
      {
        companyId: hertz.id,
        locationId: madLocation.id,
        vehicleType: VehicleType.SUV,
        category: CarCategory.SUV,
        make: 'Toyota',
        model: 'RAV4',
        year: 2024,
        transmission: Transmission.AUTOMATIC,
        fuelType: FuelType.HYBRID,
        seats: 5,
        doors: 5,
        pricePerDayCents: 7800,
        totalUnits: 4,
        features: ['bluetooth', 'gps', 'cruise_control'],
      },
      {
        companyId: avis.id,
        locationId: bcnLocation.id,
        vehicleType: VehicleType.CAR,
        category: CarCategory.PREMIUM,
        make: 'BMW',
        model: 'Serie 3',
        year: 2024,
        transmission: Transmission.AUTOMATIC,
        fuelType: FuelType.DIESEL,
        seats: 5,
        doors: 4,
        pricePerDayCents: 11500,
        totalUnits: 3,
        features: ['leather', 'gps', 'parking_sensors'],
      },
    ],
  });

  // ----------------------------------------------------------
  // Attractions
  // ----------------------------------------------------------
  const prado = await prisma.attraction.create({
    data: {
      name: 'Museo del Prado',
      description: 'Una de las pinacotecas más importantes del mundo.',
      city: 'Madrid',
      country: 'ES',
      address: 'Calle de Ruiz de Alarcón 23, 28014 Madrid',
      latitude: 40.4138,
      longitude: -3.6921,
      category: AttractionCategory.MUSEUM,
      subcategories: ['art', 'classical'],
      rating: 4.8,
      reviewCount: 78420,
      priceCents: 1500,
      childPriceCents: 0,
      durationMinutes: 180,
      websiteUrl: 'https://www.museodelprado.es',
      openingHours: {
        create: [
          { dayOfWeek: 1, opensAt: '10:00', closesAt: '20:00' },
          { dayOfWeek: 2, opensAt: '10:00', closesAt: '20:00' },
          { dayOfWeek: 3, opensAt: '10:00', closesAt: '20:00' },
          { dayOfWeek: 4, opensAt: '10:00', closesAt: '20:00' },
          { dayOfWeek: 5, opensAt: '10:00', closesAt: '20:00' },
          { dayOfWeek: 6, opensAt: '10:00', closesAt: '20:00' },
          { dayOfWeek: 0, opensAt: '10:00', closesAt: '19:00' },
        ],
      },
    },
  });

  await prisma.attraction.create({
    data: {
      name: 'Parque del Retiro',
      description: 'Histórico parque urbano en el centro de Madrid.',
      city: 'Madrid',
      country: 'ES',
      latitude: 40.4153,
      longitude: -3.6844,
      category: AttractionCategory.PARK,
      rating: 4.7,
      reviewCount: 145000,
      priceCents: 0,
      durationMinutes: 120,
      openingHours: {
        create: Array.from({ length: 7 }, (_, day) => ({
          dayOfWeek: day,
          opensAt: '06:00',
          closesAt: '24:00',
        })),
      },
    },
  });

  await prisma.attraction.create({
    data: {
      name: 'Sagrada Família',
      description: 'Basílica modernista diseñada por Antoni Gaudí.',
      city: 'Barcelona',
      country: 'ES',
      latitude: 41.4036,
      longitude: 2.1744,
      category: AttractionCategory.RELIGIOUS_SITE,
      rating: 4.9,
      reviewCount: 210345,
      priceCents: 2600,
      childPriceCents: 0,
      durationMinutes: 120,
      websiteUrl: 'https://sagradafamilia.org',
      openingHours: {
        create: Array.from({ length: 7 }, (_, day) => ({
          dayOfWeek: day,
          opensAt: '09:00',
          closesAt: '20:00',
        })),
      },
    },
  });

  // ----------------------------------------------------------
  // Trip + itinerary + booking + payment (full e2e example)
  // ----------------------------------------------------------
  const trip = await prisma.trip.create({
    data: {
      userId: alice.id,
      agentId: agent.id,
      title: 'Fin de semana cultural en Madrid',
      destination: 'Madrid, ES',
      startDate: new Date('2026-07-10'),
      endDate: new Date('2026-07-12'),
      budgetCents: 80000,
      currency: 'EUR',
      travelersCount: 2,
      status: TripStatus.PLANNED,
      notes: 'Cumpleaños de Alice',
      itineraryItems: {
        create: [
          {
            type: ItineraryItemType.FLIGHT,
            title: 'Vuelo MAD → BCN (IB3104)',
            startsAt: new Date('2026-07-10T08:00:00Z'),
            endsAt: new Date('2026-07-10T09:30:00Z'),
            location: 'MAD',
            costCents: 8900,
            currency: 'EUR',
            orderIndex: 0,
          },
          {
            type: ItineraryItemType.ATTRACTION,
            title: 'Visita al Museo del Prado',
            attractionId: prado.id,
            startsAt: new Date('2026-07-10T11:00:00Z'),
            endsAt: new Date('2026-07-10T14:00:00Z'),
            location: 'Madrid',
            costCents: 1500,
            currency: 'EUR',
            orderIndex: 1,
          },
        ],
      },
    },
  });

  const booking = await prisma.booking.create({
    data: {
      bookingNumber: 'TN-2026-000001',
      userId: alice.id,
      tripId: trip.id,
      type: BookingType.FLIGHT,
      status: BookingStatus.CONFIRMED,
      totalCents: 17800,
      currency: 'EUR',
      confirmedAt: new Date(),
      flightBooking: {
        create: {
          flightId: flightDirect.id,
          passengerCount: 2,
          cabinClass: CabinClass.ECONOMY,
          pnr: 'XYZ123',
        },
      },
    },
  });

  await prisma.payment.create({
    data: {
      paymentNumber: 'PMT-2026-000001',
      userId: alice.id,
      bookingId: booking.id,
      amountCents: 17800,
      currency: 'EUR',
      method: PaymentMethod.CARD,
      status: PaymentStatus.SUCCEEDED,
      provider: 'stripe',
      providerIntentId: 'pi_test_seed_000001',
      paidAt: new Date(),
    },
  });

  console.info(`
✅ Seed completado.
  Usuarios:
    - admin@tripnow.local / Tripnow123!  (ADMIN)
    - agent@tripnow.local / Tripnow123!  (AGENT)
    - alice@example.com  / Tripnow123!  (USER)
    - bob@example.com    / Tripnow123!  (USER)
  Datos:
    - ${airports.length} aeropuertos, ${airlines.length} aerolíneas, 3 vuelos (1 con escala)
    - 1 hotel con ${hotel.rooms.length} tipos de habitación y 30 días de disponibilidad
    - 2 empresas de alquiler, 2 ubicaciones, 3 coches
    - 3 atracciones con horarios semanales
    - 1 trip con itinerario + reserva confirmada + pago exitoso
`);
  void bob;
  void flightReturn;
  void flightWithStop;
  void admin;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
