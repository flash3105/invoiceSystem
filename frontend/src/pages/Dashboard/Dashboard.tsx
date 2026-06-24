// src/pages/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { LogOut, FileText, PlusCircle, Settings, Menu, X } from 'lucide-react';
import styles from './Dashboard.module.css';

// Components
import { InvoiceGenerator } from '../../Components/InvoiceGenerator';
import { InvoiceTable } from '../../Components/InvoiceTable';

type TabType = 'generate' | 'invoices' | 'settings';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: 'Admin',
    email: 'admin@example.com'
  });

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
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // Smoothly dismiss sidebar on mobile after clicking
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'generate': return <InvoiceGenerator />;
      case 'invoices': return <InvoiceTable />;
      case 'settings': return <SettingsPage />;
      default: return <InvoiceGenerator />;
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Dimmed Background Overlay for Mobile Viewports */}
      {mobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Architecture (Anchored Far Left) */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            
            {!sidebarCollapsed && <span className={styles.logoText}>InvoicePro</span>}
          </div>
          
          {/* Desktop Toggle Button */}
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>

          {/* Mobile Close Button */}
          <button 
            className={styles.mobileCloseBtn}
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'generate' ? styles.active : ''}`}
            onClick={() => handleTabChange('generate')}
          >
            <PlusCircle size={20} />
            {!sidebarCollapsed && <span>Generate Invoice</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'invoices' ? styles.active : ''}`}
            onClick={() => handleTabChange('invoices')}
          >
            <FileText size={20} />
            {!sidebarCollapsed && <span>All Invoices</span>}
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => handleTabChange('settings')}
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

      {/* Dynamic Content Container */}
      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <button 
              className={styles.mobileMenuBtn} 
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Menu"
            >
              <Menu size={22} />
            </button>
            <h1 className={styles.pageTitle}>
              {activeTab === 'generate' && 'Generate Invoice'}
              {activeTab === 'invoices' && 'All Invoices'}
              {activeTab === 'settings' && 'Settings'}
            </h1>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.dateDisplay}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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

// Settings Page Component (Kept self-contained as requested)
const SettingsPage: React.FC = () => {
  const [businessProfile, setBusinessProfile] = useState({
    businessName: '', businessAddress: '', phoneNumber: '', vatNumber: '',
    accountNumber: '', bankName: '', branchCode: '', accountHolderName: '',
    businessEmail: '', currency: 'ZAR'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setTimeout(() => setLoading(false), 400);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBusinessProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setMessage({ type: 'success', text: 'Business profile updated successfully!' });
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }, 800);
  };

  if (loading) {
    return (
      <div className={styles.settingsLoading}>
        <div className={styles.spinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsHeader}>
        <h2 className={styles.settingsTitle}>Business Settings</h2>
        <p className={styles.settingsSubtitle}>Configure parameters used for computational math and invoice exports.</p>
      </div>

      {message && (
        <div className={`${styles.settingsMessage} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <label>Business Name *</label>
            <input type="text" name="businessName" value={businessProfile.businessName} onChange={handleChange} required />
          </div>
          <div className={styles.settingsGroup}>
            <label>Business Email</label>
            <input type="email" name="businessEmail" value={businessProfile.businessEmail} onChange={handleChange} />
          </div>
          <div className={styles.settingsGroup}>
            <label>Business Address *</label>
            <input type="text" name="businessAddress" value={businessProfile.businessAddress} onChange={handleChange} required />
          </div>
          <div className={styles.settingsGroup}>
            <label>Phone Number *</label>
            <input type="tel" name="phoneNumber" value={businessProfile.phoneNumber} onChange={handleChange} required />
          </div>
          <div className={styles.settingsGroup}>
            <label>VAT Number *</label>
            <input type="text" name="vatNumber" value={businessProfile.vatNumber} onChange={handleChange} required />
          </div>
          <div className={styles.settingsGroup}>
            <label>Currency</label>
            <input type="text" name="currency" value={businessProfile.currency} onChange={handleChange} />
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Bank Account Mapping</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <label>Bank Name</label>
            <input type="text" name="bankName" value={businessProfile.bankName} onChange={handleChange} />
          </div>
          <div className={styles.settingsGroup}>
            <label>Account Holder Name</label>
            <input type="text" name="accountHolderName" value={businessProfile.accountHolderName} onChange={handleChange} />
          </div>
          <div className={styles.settingsGroup}>
            <label>Account Number *</label>
            <input type="text" name="accountNumber" value={businessProfile.accountNumber} onChange={handleChange} required />
          </div>
          <div className={styles.settingsGroup}>
            <label>Branch Code</label>
            <input type="text" name="branchCode" value={businessProfile.branchCode} onChange={handleChange} />
          </div>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.settingsSaveButton} disabled={saving}>
            {saving ? 'Processing...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;