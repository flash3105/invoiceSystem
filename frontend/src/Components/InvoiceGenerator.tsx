// src/Components/InvoiceGenerator.tsx
import React, { useState, useEffect } from 'react';
import { Send, Download, Mail, Phone, FileText, User, Calendar, DollarSign, Hash, AlertCircle, Plus, X, Trash2 } from 'lucide-react';
import styles from './InvoiceGenerator.module.css';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Types
interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

// Interface for individual line items (now includes serviceDate)
interface InvoiceItem {
  id: string; // Used for React keys mapping
  serviceDate: string;
  description: string;
  code: string;
  quantity: number;
  rate: number;
}

// Form data holds top-level invoice details and items array
interface InvoiceFormData {
  clientId: string;
  dueDate: string;
  notes?: string;
  items: InvoiceItem[];
}

interface NewClientData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  idNumber: string;
  passportNumber: string;
}

interface InvoiceResponse {
  id: number;
  invoiceNumber: string;
  total: number;
  status: string;
}

// Helper function to create an empty line item with today's date as default
const createEmptyItem = (): InvoiceItem => ({
  id: Date.now().toString() + Math.random().toString(),
  serviceDate: new Date().toISOString().split('T')[0], // Default to current date YYYY-MM-DD
  description: '',
  code: '',
  quantity: 1,
  rate: 0,
});

export const InvoiceGenerator: React.FC = () => {
  // Initial state without global serviceDate
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    dueDate: '',
    notes: '',
    items: [createEmptyItem()],
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceResponse | null>(null);
  
  // Loading states for delivery buttons
  const [emailLoading, setEmailLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  
  const [newClient, setNewClient] = useState<NewClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    idNumber: '',
    passportNumber: '',
  });

  // Get auth token from storage
  const getAuthToken = () => {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  };

  // Fetch clients on mount
  useEffect(() => {
    loadClients();
    loadDefaultNotes();
  }, []);

  const loadDefaultNotes = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/auth/business-profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const profile = await response.json();
        // If the user has saved default notes, pre-fill the formData!
        if (profile.defaultNotes) {
          setFormData(prev => ({ ...prev, notes: profile.defaultNotes }));
        }
      }
    } catch (error) {
      console.error('Error fetching default notes:', error);
    }
  };

  const loadClients = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const response = await fetch(`${API_URL}/api/clients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        throw new Error('Failed to load clients');
      }

      const data = await response.json();
      setClients(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Handles top-level form changes (client, due date, notes)
  const handleTopLevelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handles changes for specific line items
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          let parsedValue: string | number = value;
          if (field === 'rate') parsedValue = parseFloat(value as string) || 0;
          if (field === 'quantity') parsedValue = parseInt(value as string, 10) || 1;

          return { ...item, [field]: parsedValue };
        }
        return item;
      })
    }));
  };

  // Add a new line item
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, createEmptyItem()]
    }));
  };

  // Remove a line item
  const handleRemoveItem = (id: string) => {
    if (formData.items.length === 1) return; // Prevent removing the last item
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.email || !newClient.phoneNumber) {
      setError('First name, last name, email, and phone number are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSavingClient(true);
    setError(null);

    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Please login to continue');
        setIsSavingClient(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.details || 'Failed to create client');
      }

      setShowNewClient(false);
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        address: '',
        idNumber: '',
        passportNumber: '',
      });
      
      await loadClients();
      setSuccess('Client created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsSavingClient(false);
    }
  };
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Top-level validation
    if (!formData.clientId) { setError('Please select a client'); return; }
    if (!formData.dueDate) { setError('Please select a due date'); return; }

    // Line items validation (checking description, service date, quantity, and rate)
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.serviceDate) { setError(`Please enter a service date for Item ${i + 1}`); return; }
      if (!item.description) { setError(`Please enter a description for Item ${i + 1}`); return; }
      if (item.quantity <= 0) { setError(`Please enter a valid quantity for Item ${i + 1}`); return; }
      if (item.rate <= 0) { setError(`Please enter a valid rate for Item ${i + 1}`); return; }
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    setGeneratedInvoice(null);

    try {
      const token = getAuthToken();
      
      if (!token) {
        setError('Please login to continue');
        setIsGenerating(false);
        return;
      }

      // Map request data with per-item service dates matching backend DTO
      const invoiceData = {
        clientId: parseInt(formData.clientId),
        dueDate: formData.dueDate,
        taxRate: 0,
        notes: formData.notes || '',
        items: formData.items.map(item => ({
          serviceDate: item.serviceDate,
          description: item.description,
          code: item.code || '',
          quantity: item.quantity,
          rate: item.rate,
        }))
      };

      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.details || 'Failed to generate invoice');
      }

      const data = await response.json();
      
      setGeneratedInvoice(data);
      setSuccess(`Invoice ${data.invoiceNumber} generated successfully! (Total: R${data.total.toFixed(2)})`);
      
      // Reset form
      setFormData({
        clientId: '',
        dueDate: '',
        notes: '',
        items: [createEmptyItem()],
      });

      setTimeout(() => setSuccess(null), 5000);
      
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err instanceof Error ? err.message : 'Error generating invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (pdfLoading) return;
    if (!generatedInvoice) { setError('No invoice to download.'); return; }

    setPdfLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) { setError('Please login to continue'); setPdfLoading(false); return; }

      const response = await fetch(`${API_URL}/api/invoices/${generatedInvoice.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${generatedInvoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccess('PDF downloaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEmailInvoice = async () => {
    if (emailLoading) return;
    if (!generatedInvoice) { setError('No invoice to send.'); return; }

    setEmailLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) { setError('Please login to continue'); setEmailLoading(false); return; }

      const response = await fetch(`${API_URL}/api/invoices/${generatedInvoice.id}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send invoice email');
      }

      setSuccess('Invoice sent via email successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invoice email');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    if (whatsappLoading) return;
    if (!generatedInvoice) { setError('No invoice to share.'); return; }

    setWhatsappLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) { setError('Please login to continue'); setWhatsappLoading(false); return; }

      const response = await fetch(`${API_URL}/api/invoices/${generatedInvoice.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const fileName = `Invoice_${generatedInvoice.invoiceNumber}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare) {
        const shareData = {
          title: `Invoice ${generatedInvoice.invoiceNumber}`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          try {
            await navigator.share(shareData);
            setSuccess('Invoice shared successfully!');
            setTimeout(() => setSuccess(null), 3000);
            setWhatsappLoading(false);
            return;
          } catch (shareError) {
            if ((shareError as Error).name !== 'AbortError') {
              console.error('Share error:', shareError);
            } else {
              setWhatsappLoading(false);
              return;
            }
          }
        }
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSuccess('PDF downloaded! Please share it via WhatsApp.');
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      setError('Failed to share via WhatsApp.');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleCancelNewClient = () => {
    setShowNewClient(false);
    setNewClient({
      firstName: '', lastName: '', email: '', phoneNumber: '', address: '', idNumber: '', passportNumber: '',
    });
    setError(null);
  };

  // Helper calculation for UI display
  const currentSubtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);

  return (
    <div className={styles.generator}>
      <div className={styles.generatorHeader}>
        <h2>New Invoice</h2>
        <p>Fill in the details below to generate an invoice</p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button className={styles.closeAlert} onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className={styles.successAlert}>
          <span>{success}</span>
          <button className={styles.closeAlert} onClick={() => setSuccess(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleGenerate} className={styles.generatorForm}>
        <div className={styles.formGrid}>
          
          {/* ======================================= */}
          {/* 1. CLIENT SECTION                       */}
          {/* ======================================= */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <User size={18} />
              Client Information
            </h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="clientId">Select Client *</label>
              <div className={styles.selectWrapper}>
                <select
                  id="clientId"
                  name="clientId"
                  value={formData.clientId}
                  onChange={handleTopLevelChange}
                  required
                  disabled={loading}
                >
                  <option value="">{loading ? 'Loading clients...' : 'Select a client...'}</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.firstName} {client.lastName} - {client.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.newClientButton}
                  onClick={() => setShowNewClient(!showNewClient)}
                >
                  <Plus size={16} />
                  Add New
                </button>
              </div>
            </div>

            {showNewClient && (
              <div className={styles.newClientForm}>
                <h4>New Client</h4>
                <div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={newClient.firstName}
                        onChange={handleNewClientChange}
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={newClient.lastName}
                        onChange={handleNewClientChange}
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={newClient.email}
                      onChange={handleNewClientChange}
                      placeholder="Email address"
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={newClient.phoneNumber}
                      onChange={handleNewClientChange}
                      placeholder="Phone number"
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={newClient.address}
                      onChange={handleNewClientChange}
                      placeholder="Address"
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>ID Number</label>
                      <input
                        type="text"
                        name="idNumber"
                        value={newClient.idNumber}
                        onChange={handleNewClientChange}
                        placeholder="ID Number"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Passport Number</label>
                      <input
                        type="text"
                        name="passportNumber"
                        value={newClient.passportNumber}
                        onChange={handleNewClientChange}
                        placeholder="Passport Number"
                      />
                    </div>
                  </div>

                  <div className={styles.newClientActions}>
                    <button 
                      type="button" 
                      className={styles.cancelButton}
                      onClick={handleCancelNewClient}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      className={styles.saveClientButton}
                      onClick={handleAddClient}
                      disabled={isSavingClient}
                    >
                      {isSavingClient ? 'Saving...' : 'Save Client'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================= */}
          {/* 2. LINE ITEMS SECTION (Per-item Date)   */}
          {/* ======================================= */}
          <div className={styles.formSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0, borderTop: 'none', paddingTop: 0 }}>
                <FileText size={18} />
                Line Items
              </h3>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--gray-800)' }}>
                Subtotal: R{currentSubtotal.toFixed(2)}
              </div>
            </div>

            {formData.items.map((item, index) => (
              <div key={item.id} style={{ 
                background: 'var(--gray-50)', 
                padding: '20px', 
                borderRadius: 'var(--radius-sm)', 
                marginBottom: '16px',
                border: '1px solid var(--gray-200)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--gray-500)', fontWeight: '600' }}>ITEM {index + 1}</h4>
                  
                  {formData.items.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                      title="Remove Item"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Service Date & Description */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label><Calendar size={14} /> Service Date *</label>
                    <input
                      type="date"
                      value={item.serviceDate}
                      onChange={(e) => handleItemChange(item.id, 'serviceDate', e.target.value)}
                      required
                    />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 2 }}>
                    <label>Description *</label>
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Code, Quantity & Rate */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Item Code / SKU</label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={item.code}
                      onChange={(e) => handleItemChange(item.id, 'code', e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Quantity *</label>
                    <input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                      min="1"
                      step="1"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label><DollarSign size={14} /> Rate (ZAR) *</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={item.rate || ''}
                      onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)}
                      required
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={handleAddItem}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', 
                background: 'white', border: '1px dashed var(--primary)', color: 'var(--primary)',
                padding: '12px 20px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                fontWeight: '600', width: '100%', justifyContent: 'center', transition: 'var(--transition)'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'white'}
            >
              <Plus size={16} /> Add Another Item
            </button>
          </div>

          {/* ======================================= */}
          {/* 3. ADDITIONAL DETAILS (Due Date & Notes)*/}
          {/* ======================================= */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <Calendar size={18} />
              Invoice Terms
            </h3>
            
            <div className={styles.formGroup}>
              <label htmlFor="dueDate">
                Due Date *
              </label>
              <input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleTopLevelChange}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notes">Notes to Client</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Thank you for your business! Payment is due within 30 days."
                value={formData.notes}
                onChange={handleTopLevelChange}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actionButtons}>
          <button
            type="submit"
            className={styles.generateButton}
            disabled={isGenerating || loading}
          >
            {isGenerating ? (
              <>
                <span className={styles.spinner}></span>
                Generating...
              </>
            ) : (
              <>
                <FileText size={18} />
                Generate Invoice
              </>
            )}
          </button>
        </div>

        {/* Delivery Options */}
        {generatedInvoice && (
          <div className={styles.deliverySection}>
            <p className={styles.deliveryLabel}>Invoice #{generatedInvoice.invoiceNumber} generated!</p>
            <p className={styles.deliverySubLabel}>You can now:</p>
            <div className={styles.deliveryButtons}>
              <button 
                type="button" 
                className={`${styles.deliveryButton} ${emailLoading ? styles.loading : ''}`}
                onClick={handleEmailInvoice}
                disabled={emailLoading}
              >
                <Mail size={16} />
                {emailLoading ? 'Sending...' : 'Send via Email'}
              </button>
              <button 
                type="button" 
                className={`${styles.deliveryButton} ${pdfLoading ? styles.loading : ''}`}
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
              >
                <Download size={16} />
                {pdfLoading ? 'Downloading...' : 'Download PDF'}
              </button>
              <button 
                type="button" 
                className={`${styles.deliveryButton} ${whatsappLoading ? styles.loading : ''}`}
                onClick={handleWhatsAppShare}
                disabled={whatsappLoading}
              >
                <Phone size={16} />
                {whatsappLoading ? 'Opening...' : 'Share via WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default InvoiceGenerator;