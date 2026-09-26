import { Outlet } from 'react-router-dom';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />

      <div
        className="app-content"
        style={{
          marginLeft: 'var(--saps-sidebar-width)',
        }}
      >
        <Navbar />

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;