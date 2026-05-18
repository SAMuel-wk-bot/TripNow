import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { api } from '@/lib/api';

interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface CreateTripForm {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

export function TripsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm<CreateTripForm>();

  const { data } = useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const res = await api.get<{ trips: Trip[] }>('/trips');
      return res.data.trips;
    },
  });

  const createTrip = useMutation({
    mutationFn: async (input: CreateTripForm) => {
      const res = await api.post('/trips', input);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trips'] });
      reset();
      setShowForm(false);
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mis viajes</h1>
          <p className="text-slate-500">Planifica y organiza tus aventuras.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          {showForm ? 'Cancelar' : 'Nuevo viaje'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleSubmit((d) => createTrip.mutate(d))}
          className="card grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Título</label>
            <input className="input" {...register('title', { required: true })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Destino</label>
            <input className="input" {...register('destination', { required: true })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Inicio</label>
            <input type="date" className="input" {...register('startDate', { required: true })} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Fin</label>
            <input type="date" className="input" {...register('endDate', { required: true })} />
          </div>
          <button type="submit" className="btn-primary md:col-span-4" disabled={createTrip.isPending}>
            {createTrip.isPending ? 'Creando…' : 'Crear viaje'}
          </button>
        </form>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {data?.length === 0 && (
          <p className="text-slate-500 text-sm">Aún no tienes viajes. ¡Crea el primero!</p>
        )}
        {data?.map((trip) => (
          <Link to={`/trips/${trip.id}`} key={trip.id} className="card hover:shadow-md">
            <h3 className="font-semibold">{trip.title}</h3>
            <p className="text-sm text-slate-500">{trip.destination}</p>
            <p className="text-xs text-slate-400 mt-2">
              {new Date(trip.startDate).toLocaleDateString()} -{' '}
              {new Date(trip.endDate).toLocaleDateString()}
            </p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700">
              {trip.status}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
