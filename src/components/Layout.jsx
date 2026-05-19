// src/components/Layout.jsx
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen page-bg">
      <Sidebar />
      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
