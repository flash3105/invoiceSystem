// src/Components/InvoiceGenerator.tsx
import React, { useState, useEffect } from 'react';
import { Send, Download, Mail, Phone, FileText, User, Calendar, DollarSign, Hash } from 'lucide-react';
//import { invoiceService, CreateInvoiceData } from '../services/invoice.service';
//import { clientService, Client } from '../services/client.service';
import styles from './InvoiceGenerator.module.css';

// Basic form data interface - extend as needed
interface InvoiceFormData {
  clientId: string;
  serviceDate: string;
  dueDate: string;
  procedureType: string;
  procedureCode: string;
  duration: number;
  ratePerHour: number;
  notes: string;
}

export const InvoiceGenerator: React.FC = () => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    serviceDate: '',
    dueDate: '',
    procedureType: '',
    procedureCode: '',
    duration: 0,
    ratePerHour: 0,
    notes: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
 // const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  // Fetch clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      // const data = await clientService.getClients();
      // setClients(data);
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
      [name]: name === 'duration' || name === 'ratePerHour' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // await clientService.createClient(newClient);
      setShowNewClient(false);
      setNewClient({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
      });
      loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    }
  };

  const calculateTotal = () => {
    const { duration, ratePerHour } = formData;
    if (duration && ratePerHour) {
      return (duration / 60) * ratePerHour;
    }
    return 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      // const invoiceData: CreateInvoiceData = {
      //   clientId: formData.clientId,
      //   serviceDate: formData.serviceDate,
      //   dueDate: formData.dueDate,
      //   procedureType: formData.procedureType,
      //   procedureCode: formData.procedureCode,
      //   duration: formData.duration,
      //   ratePerHour: formData.ratePerHour,
      //   notes: formData.notes,
      // };

        // const invoice = await invoiceService.createInvoice(invoiceData);
      // alert(`Invoice ${invoice.invoiceNumber} generated successfully!`);
      
      // Reset form
      setFormData({
        clientId: '',
        serviceDate: '',
        dueDate: '',
        procedureType: '',
        procedureCode: '',
        duration: 0,
        ratePerHour: 0,
        notes: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating invoice');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.generator}>
      <div className={styles.generatorHeader}>
        <h2>New Invoice</h2>
        <p>Fill in the details below to generate an invoice</p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
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
              <label htmlFor="clientId">Select Client</label>
              <select
                id="clientId"
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">{loading ? 'Loading clients...' : 'Select a client...'}</option>
                {/* {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName} - {client.email}
                  </option>
                ))} */}
              </select>
              <button
                type="button"
                className={styles.newClientButton}
                onClick={() => setShowNewClient(!showNewClient)}
              >
                + Add New Client
              </button>
            </div>

            {showNewClient && (
              <div className={styles.newClientForm}>
                <h4>New Client</h4>
                <form onSubmit={handleAddClient}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>First Name</label>
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
                      <label>Last Name</label>
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
                    <label>Email</label>
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
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={newClient.phone}
                      onChange={handleNewClientChange}
                      placeholder="Phone number"
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
                  <div className={styles.newClientActions}>
                    <button type="button" onClick={() => setShowNewClient(false)}>
                      Cancel
                    </button>
                    <button type="submit" className={styles.saveClientButton}>
                      Save Client
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Service Details - Basic Fields */}
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>
              <FileText size={18} />
              Service Details
            </h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="serviceDate">
                  <Calendar size={14} />
                  Service Date
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
                  Due Date
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
                <label htmlFor="procedureType">Procedure Type</label>
                <select
                  id="procedureType"
                  name="procedureType"
                  value={formData.procedureType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select type...</option>
                  <option value="General">General Anesthesia</option>
                  <option value="Regional">Regional Anesthesia</option>
                  <option value="Local">Local Anesthesia</option>
                  <option value="Epidural">Epidural</option>
                  <option value="Spinal">Spinal</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="procedureCode">
                  <Hash size={14} />
                  Procedure Code
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

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="duration">Duration (minutes)</label>
                <input
                  id="duration"
                  name="duration"
                  type="number"
                  placeholder="e.g., 60"
                  value={formData.duration || ''}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="ratePerHour">
                  <DollarSign size={14} />
                  Rate per Hour ($)
                </label>
                <input
                  id="ratePerHour"
                  name="ratePerHour"
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.ratePerHour || ''}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
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

        {/* Total and Actions */}
        <div className={styles.totalSection}>
          <div className={styles.totalDisplay}>
            <span className={styles.totalLabel}>Total Amount:</span>
            <span className={styles.totalAmount}>${calculateTotal().toFixed(2)}</span>
          </div>

          <div className={styles.actionButtons}>
            <button
              type="submit"
              className={styles.generateButton}
              disabled={isGenerating}
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
        </div>

        {/* Delivery Options */}
        <div className={styles.deliverySection}>
          <p className={styles.deliveryLabel}>After generation, you can:</p>
          <div className={styles.deliveryButtons}>
            <button type="button" className={styles.deliveryButton}>
              <Mail size={16} />
              Send via Email
            </button>
            <button type="button" className={styles.deliveryButton}>
              <Phone size={16} />
              Send via WhatsApp
            </button>
            <button type="button" className={styles.deliveryButton}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default InvoiceGenerator;