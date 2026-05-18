import { useMutation } from '@tanstack/react-query';
import { Star } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { api } from '@/lib/api';

interface SearchForm {
  city: string;
  category?: string;
}

interface Attraction {
  id: string;
  name: string;
  description?: string | null;
  city: string;
  country: string;
  categories: string[];
  rating?: number | null;
  imageUrl?: string | null;
  openingHours?: unknown;
}

export function AttractionsPage() {
  const { register, handleSubmit } = useForm<SearchForm>();
  const search = useMutation({
    mutationFn: async (data: SearchForm) => {
      const res = await api.get<{ attractions: Attraction[] }>('/attractions', { params: data });
      return res.data.attractions;
    },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Atracciones turísticas</h1>
        <p className="text-slate-500">Descubre lo mejor de cada destino.</p>
      </header>

      <form
        onSubmit={handleSubmit((d) => search.mutate(d))}
        className="card grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium mb-1">Ciudad</label>
          <input className="input" {...register('city')} placeholder="Madrid" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Categoría (opcional)</label>
          <input className="input" {...register('category')} placeholder="museums" />
        </div>
        <button type="submit" className="btn-primary" disabled={search.isPending}>
          {search.isPending ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {search.data?.map((a) => (
          <article key={a.id} className="card">
            <h3 className="font-semibold">{a.name}</h3>
            <p className="text-xs text-slate-500 mt-1">
              {a.city}, {a.country}
            </p>
            {a.rating != null && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <Star size={12} /> {a.rating.toFixed(1)}
              </p>
            )}
            <p className="text-sm text-slate-600 mt-2 line-clamp-3">
              {a.description ?? a.categories.slice(0, 3).join(', ')}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
