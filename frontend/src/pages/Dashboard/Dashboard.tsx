// src/pages/Dashboard/Dashboard.tsx
import React, { useState } from 'react';
import { LogOut, FileText, Users, Settings, LayoutDashboard, PlusCircle, List } from 'lucide-react';
import styles from './Dashboard.module.css';

// Components
import { InvoiceGenerator } from '../../Components/InvoiceGenerator';
//import { InvoiceTable } from '../../Components/InvoiceTable';
//import { ClientManager } from '../../Components/ClientManager';

type TabType = 'dashboard' | 'generate' | 'invoices' | 'clients' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user] = useState(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userData ? JSON.parse(userData) : { name: 'Admin', email: 'admin@example.com' };
  });

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'generate':
        return <InvoiceGenerator />;
      case 'invoices':
        // return <InvoiceTable />;
      case 'clients':
        // return <ClientManager />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <InvoiceGenerator />;
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>📄</span>
            {!sidebarCollapsed && <span className={styles.logoText}>InvoicePro</span>}
          </div>
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.active : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'generate' ? styles.active : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            <PlusCircle size={20} />
            {!sidebarCollapsed && <span>Generate Invoice</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'invoices' ? styles.active : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText size={20} />
            {!sidebarCollapsed && <span>All Invoices</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'clients' ? styles.active : ''}`}
            onClick={() => setActiveTab('clients')}
          >
            <Users size={20} />
            {!sidebarCollapsed && <span>Clients</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.name?.[0] || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className={styles.userDetails}>
                <span className={styles.userName}>{user?.name || 'Admin'}</span>
                <span className={styles.userEmail}>{user?.email || 'admin@example.com'}</span>
              </div>
            )}
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'generate' && 'Generate Invoice'}
              {activeTab === 'invoices' && 'All Invoices'}
              {activeTab === 'clients' && 'Client Management'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.dateDisplay}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </header>

        <div className={styles.contentArea}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

// Placeholder components
const DashboardOverview: React.FC = () => (
  <div className={styles.placeholder}>
    <h2>Dashboard Overview</h2>
    <p>Coming soon...</p>
  </div>
);

const SettingsPage: React.FC = () => (
  <div className={styles.placeholder}>
    <h2>Settings</h2>
    <p>Coming soon...</p>
  </div>
);

export default Dashboard;