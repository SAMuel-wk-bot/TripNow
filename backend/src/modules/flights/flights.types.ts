import type { FlightSearchInput } from './flights.schema';

export interface FlightSegment {
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  carrier: string;
  flightNumber: string;
  duration: string;
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FlightOffer {
  id: string;
  provider: string;
  totalPrice: number;
  currency: string;
  airline: string;
  itineraries: FlightItinerary[];
}

export interface FlightProvider {
  name: string;
  search(input: FlightSearchInput): Promise<FlightOffer[]>;
}
