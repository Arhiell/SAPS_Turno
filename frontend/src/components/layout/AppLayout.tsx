import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

const AppLayout = () => {
  const { user } = useAuth();
  const isPatient = user?.rol === 'PACIENTE';

  return (
    <div className={`app-layout${isPatient ? ' app-layout--patient' : ''}`}>
      <Sidebar />

      <div className="app-content">
        <Navbar />

        <main className="app-main" id="contenido">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
