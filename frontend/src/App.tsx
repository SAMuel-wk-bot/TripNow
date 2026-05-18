import { Navigate, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { AiAgentsPage } from '@/pages/AiAgentsPage';
import { AttractionsPage } from '@/pages/AttractionsPage';
import { CarsPage } from '@/pages/CarsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FlightsPage } from '@/pages/FlightsPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TripDetailPage } from '@/pages/TripDetailPage';
import { TripsPage } from '@/pages/TripsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/flights" element={<FlightsPage />} />
        <Route path="/cars" element={<CarsPage />} />
        <Route path="/attractions" element={<AttractionsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:id" element={<TripDetailPage />} />
        <Route path="/ai" element={<AiAgentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
