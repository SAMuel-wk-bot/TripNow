import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { api } from '@/lib/api';

interface ItineraryItem {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
}

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
  itineraryItems: ItineraryItem[];
}

export function TripDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();

  const { data: trip } = useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      const res = await api.get<Trip>(`/trips/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/trips/${id}/itinerary/generate`, {
        interests: ['museums', 'food', 'history'],
        pace: 'BALANCED',
        travelersCount: 2,
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trip', id] }),
  });

  if (!trip) return <p>Cargando…</p>;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{trip.title}</h1>
          <p className="text-slate-500">{trip.destination}</p>
          <p className="text-xs text-slate-400 mt-1">
            {new Date(trip.startDate).toLocaleDateString()} -{' '}
            {new Date(trip.endDate).toLocaleDateString()}
          </p>
        </div>
        <button onClick={() => generate.mutate()} className="btn-primary" disabled={generate.isPending}>
          {generate.isPending ? 'Generando…' : 'Generar itinerario'}
        </button>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-3">Itinerario</h2>
        {trip.itineraryItems.length === 0 && (
          <p className="text-sm text-slate-500">
            No hay actividades aún. Genera un itinerario automático con IA.
          </p>
        )}
        <ol className="space-y-3">
          {trip.itineraryItems.map((item) => (
            <li key={item.id} className="card">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.location && (
                    <p className="text-xs text-slate-400">{item.location}</p>
                  )}
                  {item.description && (
                    <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <p>{new Date(item.startsAt).toLocaleString()}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100">
                    {item.type}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
