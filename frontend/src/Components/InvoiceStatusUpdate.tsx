// src/Components/InvoiceStatusUpdate.tsx
import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './InvoiceStatusUpdate.module.css';

interface InvoiceStatusUpdateProps {
  invoiceId: number;
  currentStatus: string;
  invoiceNumber?: string;
  onStatusUpdated: () => void;
  onClose: () => void;
}

// Status configuration with proper colors
const STATUSES = [
  { value: 'Draft', label: 'Draft', color: '#6c757d', bgColor: '#f8f9fa' },
  { value: 'Sent', label: 'Sent', color: '#0d6efd', bgColor: '#cfe2ff' },
  { value: 'Pending', label: 'Pending', color: '#856404', bgColor: '#fff3cd' },
  { value: 'PartiallyPaid', label: 'Partially Paid', color: '#0c5460', bgColor: '#d1ecf1' },
  { value: 'Paid', label: 'Paid', color: '#155724', bgColor: '#d4edda' },
  { value: 'Overdue', label: 'Overdue', color: '#721c24', bgColor: '#f8d7da' },
  { value: 'Cancelled', label: 'Cancelled', color: '#383d41', bgColor: '#e2e3e5' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const InvoiceStatusUpdate: React.FC<InvoiceStatusUpdateProps> = ({
  invoiceId,
  currentStatus,
  invoiceNumber,
  onStatusUpdated,
  onClose
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getAuthToken = () => {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  };

  const getStatusStyle = (statusValue: string) => {
    const statusInfo = STATUSES.find(s => s.value === statusValue);
    return {
      backgroundColor: statusInfo?.bgColor || '#f8f9fa',
      color: statusInfo?.color || '#333',
      borderColor: statusInfo?.color || '#ccc',
    };
  };

  const getStatusInfo = (statusValue: string) => {
    return STATUSES.find(s => s.value === statusValue);
  };

  const handleUpdate = async () => {
    if (selectedStatus === currentStatus) {
      setError('Status is already set to this value');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getAuthToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      setSuccess(data.message || 'Status updated successfully!');
      
      setTimeout(() => {
        onStatusUpdated();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const currentStatusInfo = getStatusInfo(currentStatus);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Update Invoice Status</h3>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {invoiceNumber && (
            <div className={styles.invoiceInfo}>
              <span className={styles.invoiceLabel}>Invoice #{invoiceNumber}</span>
            </div>
          )}

          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {success && (
            <div className={styles.successAlert}>
              <CheckCircle size={18} />
              <span>{success}</span>
            </div>
          )}

          <div className={styles.currentStatus}>
            <label>Current Status:</label>
            <span 
              className={styles.statusBadge} 
              style={getStatusStyle(currentStatus)}
            >
              {currentStatusInfo ? currentStatusInfo.label : currentStatus}
            </span>
          </div>

          <div className={styles.formGroup}>
            <label>Select New Status:</label>
            <div className={styles.statusGrid}>
              {STATUSES.map((status) => {
                const isSelected = selectedStatus === status.value;
                const isCurrent = currentStatus === status.value;
                const statusStyle = getStatusStyle(status.value);
                
                return (
                  <button
                    key={status.value}
                    className={`${styles.statusOption} ${isSelected ? styles.selected : ''} ${isCurrent ? styles.current : ''}`}
                    style={{
                      backgroundColor: isSelected ? statusStyle.backgroundColor : 'white',
                      color: isSelected ? statusStyle.color : '#333',
                      borderColor: isSelected ? statusStyle.color : '#ddd',
                      borderWidth: isSelected ? '2px' : '1px',
                    }}
                    onClick={() => setSelectedStatus(status.value)}
                    disabled={loading || isCurrent}
                  >
                    <span className={styles.statusIcon}></span>
                    <span>{status.label}</span>
                    {isCurrent && <span className={styles.currentBadge}>Current</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.statusLegend}>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#d4edda', borderColor: '#155724' }}></span>
              <span>Paid - Marks invoice as fully paid</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#f8d7da', borderColor: '#721c24' }}></span>
              <span>Overdue - Only available if due date has passed</span>
            </div>
            <div className={styles.legendItem}>
              <span className={styles.legendDot} style={{ backgroundColor: '#d1ecf1', borderColor: '#0c5460' }}></span>
              <span>Partially Paid - For partial payments</span>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose} 
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className={styles.updateButton}
            onClick={handleUpdate}
            disabled={loading || selectedStatus === currentStatus}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceStatusUpdate;