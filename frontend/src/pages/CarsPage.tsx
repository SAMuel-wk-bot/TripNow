import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { api } from '@/lib/api';

interface CarSearchForm {
  pickupLocation: string;
  dropoffLocation?: string;
  pickupDate: string;
  dropoffDate: string;
  driverAge: number;
}

interface CarOffer {
  id: string;
  supplier: string;
  vehicleClass: string;
  model: string;
  transmission: string;
  seats: number;
  totalPrice: number;
  currency: string;
}

export function CarsPage() {
  const { register, handleSubmit } = useForm<CarSearchForm>({
    defaultValues: { driverAge: 30 },
  });
  const search = useMutation({
    mutationFn: async (data: CarSearchForm) => {
      const res = await api.get<{ offers: CarOffer[] }>('/cars/search', { params: data });
      return res.data.offers;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Alquilar coche</h1>
        <p className="text-slate-500">Encuentra el vehículo perfecto para tu viaje.</p>
      </header>

      <form
        onSubmit={handleSubmit((d) => search.mutate(d))}
        className="card grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium mb-1">Recogida</label>
          <input className="input" {...register('pickupLocation')} placeholder="MAD" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Devolución</label>
          <input className="input" {...register('dropoffLocation')} placeholder="MAD" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Fecha recogida</label>
          <input type="datetime-local" className="input" {...register('pickupDate')} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Fecha devolución</label>
          <input type="datetime-local" className="input" {...register('dropoffDate')} />
        </div>
        <button type="submit" className="btn-primary" disabled={search.isPending}>
          {search.isPending ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {search.data?.map((offer) => (
          <article key={offer.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{offer.model}</p>
                <p className="text-sm text-slate-500">
                  {offer.vehicleClass} · {offer.transmission} · {offer.seats} plazas
                </p>
                <p className="text-xs text-slate-400 mt-1">{offer.supplier}</p>
              </div>
              <p className="text-lg font-bold">
                {offer.totalPrice} {offer.currency}
              </p>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
