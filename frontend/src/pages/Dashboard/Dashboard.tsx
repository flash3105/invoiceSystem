// src/pages/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { LogOut, FileText, PlusCircle, Settings, Menu, X, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './Dashboard.module.css';

// Components
import { InvoiceGenerator } from '../../Components/InvoiceGenerator';
import { InvoiceTable } from '../../Components/InvoiceTable';

// API Base URL - Use the same pattern as InvoiceTable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type TabType = 'generate' | 'invoices' | 'settings';

// Business Profile Interface
interface BusinessProfile {
  id?: number;
  userId?: number;
  businessName: string;
  businessAddress: string;
  phoneNumber: string;
  vatNumber: string;
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  accountHolderName?: string;
  businessEmail?: string;
  logoUrl?: string;
  invoicePrefix?: string;
  invoiceNumberCounter?: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('generate');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string }>({
    name: 'Admin',
    email: ''
  });

  useEffect(() => {
    // Get email from storage (it's stored as a plain string, not JSON)
    const email = localStorage.getItem('user_email') || sessionStorage.getItem('user_email') || '';
    
    // Get token to verify authentication
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    
    if (email) {
      // Extract name from email (part before @)
      const name = email.split('@')[0] || 'Admin';
      setUser({
        name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalize first letter
        email: email
      });
    }
    
    // Log authentication status
    console.log('User email:', email);
    console.log('Auth token present:', !!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('token_expires_at');
    sessionStorage.clear();
    window.location.href = '/';
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
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
      {mobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${mobileMenuOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            {!sidebarCollapsed && <span className={styles.logoText}>InvoicePro</span>}
          </div>
          
          <button 
            className={styles.sidebarToggle}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle Sidebar"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>

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

// Settings Page Component with API Integration
const SettingsPage: React.FC = () => {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>({
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

  // Get auth token - try both storage locations
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  // Load business profile on mount
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  const loadBusinessProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      console.log('Auth token present:', !!token);
      
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to continue' });
        setLoading(false);
        return;
      }

      console.log('Loading business profile from:', `${API_URL}/api/auth/business-profile`);
      
      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setLoading(false);
        // Redirect to login after delay
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      if (response.status === 404) {
        setMessage({ type: 'error', text: 'No business profile found. Please create one.' });
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to load business profile: ${response.status}`);
      }

      const data = await response.json();
      console.log('Business profile loaded:', data);
      setBusinessProfile(data);
      setMessage(null);
    } catch (err) {
      console.error('Error loading business profile:', err);
      setMessage({ type: 'error', text: 'Failed to load business profile. Please try again.' });
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
    
    // Validate required fields
    if (!businessProfile.businessName || !businessProfile.businessAddress || 
        !businessProfile.phoneNumber || !businessProfile.vatNumber || 
        !businessProfile.accountNumber) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setMessage({ type: 'error', text: 'Please login to continue' });
        setSaving(false);
        return;
      }

      // Prepare the data
      const updateData = {
        businessName: businessProfile.businessName,
        businessAddress: businessProfile.businessAddress,
        phoneNumber: businessProfile.phoneNumber,
        vatNumber: businessProfile.vatNumber,
        accountNumber: businessProfile.accountNumber,
        currency: businessProfile.currency,
        bankName: businessProfile.bankName || '',
        branchCode: businessProfile.branchCode || '',
        accountHolderName: businessProfile.accountHolderName || '',
        businessEmail: businessProfile.businessEmail || '',
      };

      console.log('Updating business profile at:', `${API_URL}/api/auth/business-profile`);
      console.log('Update data:', updateData);

      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
        return;
      }

      if (!response.ok) {
        let errorMessage = 'Failed to update business profile';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.details || errorMessage;
        } catch (e) {
          errorMessage = await response.text() || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const updatedProfile = await response.json();
      setBusinessProfile(updatedProfile);
      setMessage({ type: 'success', text: 'Business profile updated successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error updating business profile:', err);
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to update business profile' 
      });
    } finally {
      setSaving(false);
    }
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
        <p className={styles.settingsSubtitle}>Configure your business details for invoices and exports.</p>
      </div>

      {message && (
        <div className={`${styles.settingsMessage} ${styles[message.type]}`}>
          {message.type === 'success' ? (
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
          ) : (
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
          )}
          <span>{message.text}</span>
          <button 
            className={styles.closeMessage} 
            onClick={() => setMessage(null)}
          >
            ×
          </button>
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
              placeholder="Enter business name"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Business Email</label>
            <input 
              type="email" 
              name="businessEmail" 
              value={businessProfile.businessEmail || ''} 
              onChange={handleChange} 
              placeholder="business@example.com"
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
              placeholder="123 Main St, City, Country"
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
              placeholder="+27 12 345 6789"
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
              placeholder="VAT-1234567"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Currency</label>
            <input 
              type="text" 
              name="currency" 
              value={businessProfile.currency} 
              onChange={handleChange} 
              placeholder="ZAR"
            />
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Bank Account Details</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <label>Bank Name</label>
            <input 
              type="text" 
              name="bankName" 
              value={businessProfile.bankName || ''} 
              onChange={handleChange} 
              placeholder="First National Bank"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Account Holder Name</label>
            <input 
              type="text" 
              name="accountHolderName" 
              value={businessProfile.accountHolderName || ''} 
              onChange={handleChange} 
              placeholder="John Doe"
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
              placeholder="1234567890"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Branch Code</label>
            <input 
              type="text" 
              name="branchCode" 
              value={businessProfile.branchCode || ''} 
              onChange={handleChange} 
              placeholder="123456"
            />
          </div>
        </div>

        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={styles.settingsSaveButton} 
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;