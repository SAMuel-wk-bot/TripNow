import { Bot, Car, Compass, MapPin, Plane } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    to: '/flights',
    icon: Plane,
    title: 'Buscar vuelos',
    description: 'Encuentra las mejores ofertas en vuelos.',
  },
  {
    to: '/cars',
    icon: Car,
    title: 'Alquilar coche',
    description: 'Compara precios entre proveedores.',
  },
  {
    to: '/attractions',
    icon: MapPin,
    title: 'Explorar atracciones',
    description: 'Descubre qué visitar en tu destino.',
  },
  {
    to: '/trips',
    icon: Compass,
    title: 'Mis viajes',
    description: 'Organiza tus itinerarios.',
  },
  {
    to: '/ai',
    icon: Bot,
    title: 'Asistente IA',
    description: 'Pide ayuda a nuestros agentes inteligentes.',
  },
];

export function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold">Hola, ¡bienvenido a TripNow!</h1>
        <p className="text-slate-500 mt-1">¿A dónde quieres ir hoy?</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((a) => (
          <Link key={a.to} to={a.to} className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-brand-50 text-brand-600 p-2">
                <a.icon size={20} />
              </div>
              <h3 className="font-semibold">{a.title}</h3>
            </div>
            <p className="text-sm text-slate-500">{a.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
