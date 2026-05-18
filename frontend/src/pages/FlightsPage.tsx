import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { api } from '@/lib/api';

interface SearchForm {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
}

interface FlightOffer {
  id: string;
  provider: string;
  totalPrice: number;
  currency: string;
  airline: string;
  itineraries: Array<{
    duration: string;
    segments: Array<{
      origin: string;
      destination: string;
      departureAt: string;
      arrivalAt: string;
      carrier: string;
      flightNumber: string;
    }>;
  }>;
}

export function FlightsPage() {
  const { register, handleSubmit } = useForm<SearchForm>({
    defaultValues: { adults: 1 },
  });

  const search = useMutation({
    mutationFn: async (data: SearchForm) => {
      const res = await api.get<{ offers: FlightOffer[] }>('/flights/search', { params: data });
      return res.data.offers;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Buscar vuelos</h1>
        <p className="text-slate-500">Compara ofertas en tiempo real.</p>
      </header>

      <form
        onSubmit={handleSubmit((d) => search.mutate(d))}
        className="card grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium mb-1">Origen (IATA)</label>
          <input className="input uppercase" maxLength={3} {...register('origin')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Destino (IATA)</label>
          <input className="input uppercase" maxLength={3} {...register('destination')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Salida</label>
          <input type="date" className="input" {...register('departureDate')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Regreso</label>
          <input type="date" className="input" {...register('returnDate')} />
        </div>
        <button type="submit" className="btn-primary" disabled={search.isPending}>
          {search.isPending ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      <section className="space-y-3">
        {search.data?.length === 0 && (
          <p className="text-slate-500 text-sm">No se encontraron vuelos para esa búsqueda.</p>
        )}
        {search.data?.map((offer) => (
          <article key={offer.id} className="card flex items-center justify-between">
            <div>
              <p className="font-semibold">{offer.airline}</p>
              <p className="text-sm text-slate-500">
                {offer.itineraries[0]?.segments[0]?.origin} →{' '}
                {
                  offer.itineraries[0]?.segments[offer.itineraries[0].segments.length - 1]
                    ?.destination
                }{' '}
                · {offer.itineraries[0]?.segments.length} tramo(s)
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">
                {offer.totalPrice} {offer.currency}
              </p>
              <p className="text-xs text-slate-400">{offer.provider}</p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
