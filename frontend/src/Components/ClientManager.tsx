// src/Components/ClientManager.tsx
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, User, Mail, Phone, MapPin, X } from 'lucide-react';
import { clientService, Client, CreateClientData } from '../services/client.service';
import styles from './ClientManager.module.css';

export const ClientManager: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<CreateClientData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    insuranceProvider: '',
    policyNumber: '',
  });

  // Fetch clients on mount
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async (search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientService.getClients(search);
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    loadClients(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingClient(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      insuranceProvider: '',
      policyNumber: '',
    });
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      dateOfBirth: client.dateOfBirth || '',
      insuranceProvider: client.insuranceProvider || '',
      policyNumber: client.policyNumber || '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      dateOfBirth: '',
      insuranceProvider: '',
      policyNumber: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingClient) {
        // Update existing client
        await clientService.updateClient(editingClient.id, formData);
      } else {
        // Create new client
        await clientService.createClient(formData);
      }
      
      closeModal();
      loadClients(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client');
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;
    
    try {
      setLoading(true);
      await clientService.deleteClient(id);
      loadClients(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      setLoading(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className={styles.clientManager}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2>Client Management</h2>
          <p className={styles.subtitle}>Manage your clients and their information</p>
        </div>
        <button className={styles.addButton} onClick={openAddModal}>
          <Plus size={18} />
          Add Client
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search clients by name or email..."
          value={searchTerm}
          onChange={handleSearch}
          className={styles.searchInput}
        />
        {searchTerm && (
          <button className={styles.clearSearch} onClick={() => handleSearch({ target: { value: '' } } as any)}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Total Clients</span>
          <span className={styles.statValue}>{clients.length}</span>
        </div>
      </div>

      {/* Client Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  {searchTerm ? 'No clients found matching your search' : 'No clients yet. Click "Add Client" to get started.'}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.id}>
                  <td className={styles.clientName}>
                    <div className={styles.avatar}>
                      {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                    </div>
                    <span>{client.firstName} {client.lastName}</span>
                  </td>
                  <td>
                    <a href={`mailto:${client.email}`} className={styles.emailLink}>
                      {client.email}
                    </a>
                  </td>
                  <td>
                    <a href={`tel:${client.phone}`} className={styles.phoneLink}>
                      {client.phone}
                    </a>
                  </td>
                  <td className={styles.addressCell}>{client.address}</td>
                  <td>{new Date(client.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button 
                        className={styles.actionButton} 
                        title="Edit"
                        onClick={() => openEditModal(client)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`} 
                        title="Delete"
                        onClick={() => handleDelete(client.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{editingClient ? 'Edit Client' : 'Add New Client'}</h3>
              <button className={styles.modalClose} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
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
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Insurance Provider</label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    placeholder="Insurance provider"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Policy Number</label>
                  <input
                    type="text"
                    name="policyNumber"
                    value={formData.policyNumber}
                    onChange={handleInputChange}
                    placeholder="Policy number"
                  />
                </div>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? 'Saving...' : editingClient ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;