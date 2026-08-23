// src/pages/Dashboard/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { LogOut, FileText, PlusCircle, Settings, Menu, X, AlertCircle, CheckCircle, Plus, Trash2 } from 'lucide-react';
import styles from './Dashboard.module.css';

// Components
import { InvoiceGenerator } from '../../Components/InvoiceGenerator';
import { InvoiceTable } from '../../Components/InvoiceTable';

// API Base URL - Use the same pattern as InvoiceTable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type TabType = 'generate' | 'invoices' | 'settings';

export interface CustomField {
  label: string;
  value: string;
}

// Business Profile Interface
interface BusinessProfile {
  id?: number;
  userId?: number;
  businessName: string;
  businessAddress: string;
  phoneNumber: string;
  vatNumber?: string; // Made optional/legacy
  accountNumber: string;
  bankName?: string;
  branchCode?: string;
  accountHolderName?: string;
  businessEmail?: string;
  logoUrl?: string;
  invoicePrefix?: string;
  invoiceNumberCounter?: number;
  defaultNotes?: string;
  customFields?: CustomField[]; // <-- New Custom Fields Array
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
    vatNumber: '', // Keeping it here just in case they have legacy data
    accountNumber: '',
    bankName: '',
    branchCode: '',
    accountHolderName: '',
    businessEmail: '',
    defaultNotes: '',
    customFields: [],
    currency: 'ZAR'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setLoading(false);
        setTimeout(() => window.location.href = '/', 2000);
        return;
      }

      if (response.status === 404) {
        setMessage({ type: 'error', text: 'No business profile found. Please create one.' });
        setLoading(false);
        return;
      }

      if (!response.ok) throw new Error(`Failed to load business profile: ${response.status}`);

      const data = await response.json();
      // Ensure customFields is always an array
      setBusinessProfile({ ...data, customFields: data.customFields || [] });
      setMessage(null);
    } catch (err) {
      console.error('Error loading business profile:', err);
      setMessage({ type: 'error', text: 'Failed to load business profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessProfile(prev => ({ ...prev, [name]: value }));
  };

  // --- CUSTOM FIELD HANDLERS ---
  const handleAddCustomField = () => {
    if ((businessProfile.customFields?.length || 0) < 5) {
      setBusinessProfile(prev => ({
        ...prev,
        customFields: [...(prev.customFields || []), { label: '', value: '' }]
      }));
    }
  };

  const handleRemoveCustomField = (indexToRemove: number) => {
    setBusinessProfile(prev => ({
      ...prev,
      customFields: prev.customFields?.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleCustomFieldChange = (index: number, field: 'label' | 'value', val: string) => {
    setBusinessProfile(prev => {
      const updatedFields = [...(prev.customFields || [])];
      updatedFields[index] = { ...updatedFields[index], [field]: val };
      return { ...prev, customFields: updatedFields };
    });
  };
  // ------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Removed vatNumber from strict required checks
    if (!businessProfile.businessName || !businessProfile.businessAddress || 
        !businessProfile.phoneNumber || !businessProfile.accountNumber) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = getAuthToken();
      if (!token) return;

      // Clean up empty fields before sending to API
      const cleanedCustomFields = (businessProfile.customFields || []).filter(
        field => field.label.trim() !== '' || field.value.trim() !== ''
      );

      const updateData = {
        ...businessProfile,
        customFields: cleanedCustomFields,
      };

      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        setMessage({ type: 'error', text: 'Session expired. Please login again.' });
        setTimeout(() => window.location.href = '/', 2000);
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
      setBusinessProfile({ ...updatedProfile, customFields: updatedProfile.customFields || [] });
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
          <button className={styles.closeMessage} onClick={() => setMessage(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <label>Business Name *</label>
            <input 
              type="text" name="businessName" value={businessProfile.businessName} onChange={handleChange} required placeholder="Enter business name"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Business Email</label>
            <input 
              type="email" name="businessEmail" value={businessProfile.businessEmail || ''} onChange={handleChange} placeholder="business@example.com"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Business Address *</label>
            <input 
              type="text" name="businessAddress" value={businessProfile.businessAddress} onChange={handleChange} required placeholder="123 Main St, City, Country"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Phone Number *</label>
            <input 
              type="tel" name="phoneNumber" value={businessProfile.phoneNumber} onChange={handleChange} required placeholder="+27 12 345 6789"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Currency</label>
            <input 
              type="text" name="currency" value={businessProfile.currency} onChange={handleChange} placeholder="ZAR"
            />
          </div>
        </div>

        {/* --- CUSTOM FIELDS UI --- */}
        <h3 className={styles.sectionTitle} style={{ marginTop: '24px' }}>Custom Fields</h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
          Add up to 5 specific details like VAT Number, Practice Number, or PO Number.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {businessProfile.customFields?.map((field, index) => (
            <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Field Name (e.g. VAT No)"
                value={field.label}
                onChange={(e) => handleCustomFieldChange(index, 'label', e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              />
              <input
                type="text"
                placeholder="Value (e.g. 412345678)"
                value={field.value}
                onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                style={{ flex: 2, padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              />
              <button 
                type="button" 
                onClick={() => handleRemoveCustomField(index)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                title="Remove field"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}

          {(!businessProfile.customFields || businessProfile.customFields.length < 5) && (
            <button 
              type="button" 
              onClick={handleAddCustomField}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start', padding: '8px 12px', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: 500 }}
            >
              <Plus size={16} /> Add Custom Field
            </button>
          )}
        </div>

        <h3 className={styles.sectionTitle}>Bank Account Details</h3>
        <div className={styles.settingsGrid}>
          <div className={styles.settingsGroup}>
            <label>Bank Name</label>
            <input 
              type="text" name="bankName" value={businessProfile.bankName || ''} onChange={handleChange} placeholder="First National Bank"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Account Holder Name</label>
            <input 
              type="text" name="accountHolderName" value={businessProfile.accountHolderName || ''} onChange={handleChange} placeholder="John Doe"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Account Number *</label>
            <input 
              type="text" name="accountNumber" value={businessProfile.accountNumber} onChange={handleChange} required placeholder="1234567890"
            />
          </div>
          <div className={styles.settingsGroup}>
            <label>Branch Code</label>
            <input 
              type="text" name="branchCode" value={businessProfile.branchCode || ''} onChange={handleChange} placeholder="123456"
            />
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Invoice Preferences</h3>
        <div className={styles.settingsGrid} style={{ display: 'block' }}>
          <div className={styles.settingsGroup}>
            <label>Default Notes / Terms & Conditions</label>
            <textarea 
              name="defaultNotes" 
              value={businessProfile.defaultNotes || ''} 
              onChange={handleChange} 
              placeholder="e.g. Payment is due within 30 days. Late payments accrue 5% interest."
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                marginTop: '5px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>
        </div>
        <div className={styles.formActions}>
          <button 
            type="submit" className={styles.settingsSaveButton} disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Dashboard;