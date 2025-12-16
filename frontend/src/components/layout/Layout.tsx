import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  console.log('Layout загружен'); 

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Spaced Repetition App © 2025</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;