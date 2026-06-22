// src/Components/InvoiceGenerator.tsx
import React, { useState, useEffect } from 'react';
import { Send, Download, Mail, Phone, FileText, User, Calendar, DollarSign, Hash, AlertCircle, Plus, X } from 'lucide-react';
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
  idNumber?: string;
  passportNumber?: string;
  notes?: string;
  isActive: boolean;
}

interface InvoiceFormData {
  clientId: string;
  serviceDate: string;
  dueDate: string;
  procedureType: string;
  procedureCode: string;
  amount: number;
  notes?: string;
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

export const InvoiceGenerator: React.FC = () => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    serviceDate: '',
    dueDate: '',
    procedureType: '',
    procedureCode: '',
    amount: 0,
    notes: '',
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<InvoiceResponse | null>(null);
  
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
  }, []);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async () => {
    console.log('=== handleAddClient called ===');
    console.log('New client data:', newClient);
    
    // Validate required fields
    if (!newClient.firstName || !newClient.lastName || !newClient.email || !newClient.phoneNumber) {
      console.log('Validation failed: Missing required fields');
      setError('First name, last name, email, and phone number are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email)) {
      console.log('Validation failed: Invalid email');
      setError('Please enter a valid email address');
      return;
    }

    setIsSavingClient(true);
    setError(null);

    try {
      const token = getAuthToken();
      console.log('Auth token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setError('Please login to continue');
        setIsSavingClient(false);
        return;
      }

      console.log('Sending POST request to:', `${API_URL}/api/clients`);
      console.log('Request body:', JSON.stringify(newClient, null, 2));

      const response = await fetch(`${API_URL}/api/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || data.details || 'Failed to create client');
      }

      console.log('Client created successfully!');

      // Close new client form and refresh client list
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
      console.error('Error creating client:', err);
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setIsSavingClient(false);
    }
  };
  
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.clientId) {
      setError('Please select a client');
      return;
    }
    
    if (!formData.serviceDate) {
      setError('Please select a service date');
      return;
    }
    
    if (!formData.dueDate) {
      setError('Please select a due date');
      return;
    }
    
    if (!formData.procedureType) {
      setError('Please select a procedure type');
      return;
    }
    
    if (!formData.procedureCode) {
      setError('Please enter a procedure code');
      return;
    }

    if (formData.amount <= 0) {
      setError('Please enter a valid amount');
      return;
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

      // Prepare invoice data - matches backend CreateInvoiceRequest
      const invoiceData = {
        clientId: parseInt(formData.clientId),
        serviceDate: formData.serviceDate,
        dueDate: formData.dueDate,
        procedureType: formData.procedureType,
        procedureCode: formData.procedureCode,
        taxRate: 0, // Default tax rate
        notes: formData.notes || '',
        items: [
          {
            description: `${formData.procedureType} - ${formData.procedureCode}`,
            code: formData.procedureCode,
            quantity: 1,
            rate: formData.amount,
          }
        ]
      };

      console.log('Sending invoice data:', invoiceData);

      const response = await fetch(`${API_URL}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.details || 'Failed to generate invoice');
      }

      const data = await response.json();
      console.log('Invoice created:', data);
      
      setGeneratedInvoice(data);
      setSuccess(`Invoice ${data.invoiceNumber} generated successfully! (Total: R${data.total.toFixed(2)})`);
      
      // Reset form
      setFormData({
        clientId: '',
        serviceDate: '',
        dueDate: '',
        procedureType: '',
        procedureCode: '',
        amount: 0,
        notes: '',
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
    if (!generatedInvoice) {
      setError('No invoice to download. Please generate an invoice first.');
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const response = await fetch(`${API_URL}/api/invoices/${generatedInvoice.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      // Get the PDF as a blob
      const blob = await response.blob();
      
      // Create a download link
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
      console.error('Error downloading PDF:', err);
      setError(err instanceof Error ? err.message : 'Failed to download PDF');
    }
  };

  const handleEmailInvoice = async () => {
    if (!generatedInvoice) {
      setError('No invoice to send. Please generate an invoice first.');
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

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
      console.error('Error sending invoice email:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invoice email');
    }
  };

  const handleCancelNewClient = () => {
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
    setError(null);
  };

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
          <button 
            className={styles.closeAlert} 
            onClick={() => setError(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className={styles.successAlert}>
          <span>{success}</span>
          <button 
            className={styles.closeAlert} 
            onClick={() => setSuccess(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleGenerate} className={styles.generatorForm}>
        <div className={styles.formGrid}>
          {/* Client Section */}
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
                  onChange={handleChange}
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

          {/* Service Details */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FileText size={18} />
              Service Details
            </h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="serviceDate">
                  <Calendar size={14} />
                  Service Date *
                </label>
                <input
                  id="serviceDate"
                  name="serviceDate"
                  type="date"
                  value={formData.serviceDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="dueDate">
                  <Calendar size={14} />
                  Due Date *
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="procedureType">Procedure Type *</label>
                <select
                  id="procedureType"
                  name="procedureType"
                  value={formData.procedureType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="General Anesthesia">General Anesthesia</option>
                  <option value="Regional Anesthesia">Regional Anesthesia</option>
                  <option value="Local Anesthesia">Local Anesthesia</option>
                  <option value="Epidural">Epidural</option>
                  <option value="Spinal">Spinal</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="procedureCode">
                  <Hash size={14} />
                  Procedure Code *
                </label>
                <input
                  id="procedureCode"
                  name="procedureCode"
                  type="text"
                  placeholder="CPT Code"
                  value={formData.procedureCode}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="amount">
                Amount (ZAR) *
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={handleChange}
                required
                min="0.01"
                step="0.01"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Additional notes..."
                value={formData.notes}
                onChange={handleChange}
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

        {/* Delivery Options - Only show after invoice is generated */}
        {generatedInvoice && (
          <div className={styles.deliverySection}>
            <p className={styles.deliveryLabel}>Invoice #{generatedInvoice.invoiceNumber} generated!</p>
            <p className={styles.deliverySubLabel}>You can now:</p>
            <div className={styles.deliveryButtons}>
              <button 
                type="button" 
                className={styles.deliveryButton}
                onClick={handleEmailInvoice}
              >
                <Mail size={16} />
                Send via Email
              </button>
              <button 
                type="button" 
                className={styles.deliveryButton}
                onClick={handleDownloadPDF}
              >
                <Download size={16} />
                Download PDF
              </button>
              <button 
                type="button" 
                className={styles.deliveryButton}
                onClick={() => {
                  // WhatsApp sharing
                  const message = `Invoice ${generatedInvoice.invoiceNumber} - Total: R${generatedInvoice.total.toFixed(2)}`;
                  const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }}
              >
                <Phone size={16} />
                Share via WhatsApp
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default InvoiceGenerator;