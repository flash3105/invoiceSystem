// src/pages/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { LogOut, FileText, PlusCircle, Settings, List } from 'lucide-react';
import styles from './Dashboard.module.css';

// Components
import { InvoiceGenerator } from '../../Components/InvoiceGenerator';
import { InvoiceTable } from '../../Components/InvoiceTable';

type TabType = 'generate' | 'invoices' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: 'Admin',
    email: 'admin@example.com'
  });

  // Load user from session storage on mount
  useEffect(() => {
    const userData = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_expires_at');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token_expires_at');
    window.location.href = '/login';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'generate':
        return <InvoiceGenerator />;
      case 'invoices':
        return <InvoiceTable />;
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
              {user?.name?.[0]?.toUpperCase() || 'A'}
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
              {activeTab === 'generate' && 'Generate Invoice'}
              {activeTab === 'invoices' && 'All Invoices'}
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

// Settings Page Component
const SettingsPage: React.FC = () => {
  const [businessProfile, setBusinessProfile] = useState({
    businessName: '',
    businessAddress: '',
    phoneNumber: '',
    vatNumber: '',
    accountNumber: '',
    bankName: '',
    branchCode: '',
    accountHolderName: '',
    businessEmail: '',
    currency: 'ZAR'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthToken = () => {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  };

  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to continue' });
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data);
      }
    } catch (error) {
      console.error('Error loading business profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to continue' });
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessProfile),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Business profile updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.settingsLoading}>
        <div className={styles.spinner}></div>
        <p>Loading business profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.settingsTitle}>Business Settings</h2>
      <p className={styles.settingsSubtitle}>Update your business information that will appear on invoices</p>

      {message && (
        <div className={`${styles.settingsMessage} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <label>Business Name *</label>
            <input
              type="text"
              name="businessName"
              value={businessProfile.businessName}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Business Email</label>
            <input
              type="email"
              name="businessEmail"
              value={businessProfile.businessEmail || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Business Address *</label>
            <input
              type="text"
              name="businessAddress"
              value={businessProfile.businessAddress}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Phone Number *</label>
            <input
              type="tel"
              name="phoneNumber"
              value={businessProfile.phoneNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>VAT Number *</label>
            <input
              type="text"
              name="vatNumber"
              value={businessProfile.vatNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Account Number *</label>
            <input
              type="text"
              name="accountNumber"
              value={businessProfile.accountNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Bank Name</label>
            <input
              type="text"
              name="bankName"
              value={businessProfile.bankName || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Branch Code</label>
            <input
              type="text"
              name="branchCode"
              value={businessProfile.branchCode || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Account Holder Name</label>
            <input
              type="text"
              name="accountHolderName"
              value={businessProfile.accountHolderName || ''}
              onChange={handleChange}
            />
          </div>

          <div className={styles.settingsGroup}>
            <label>Currency</label>
            <input
              type="text"
              name="currency"
              value={businessProfile.currency || 'ZAR'}
              onChange={handleChange}
            />
          </div>
        </div>

        <button type="submit" className={styles.settingsSaveButton} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Dashboard;