// src/Components/InvoiceTable.tsx
import React, { useState, useEffect } from 'react';
import { Eye, Download, Mail, CheckCircle, Clock, AlertCircle, Search, Filter, FileText } from 'lucide-react';
import styles from './InvoiceTable.module.css';

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
  status: string;
  createdAt: string;
  dueDate: string;
  procedureType: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const InvoiceTable: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getAuthToken = () => {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  };

  useEffect(() => {
    loadInvoices();
  }, [filterStatus]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError('Please login to continue');
        return;
      }

      const url = filterStatus !== 'all' 
        ? `${API_URL}/api/invoices?status=${filterStatus}`
        : `${API_URL}/api/invoices`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load invoices');
      }

      const data = await response.json();
      setInvoices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF');
    }
  };

  const handleEmailInvoice = async (invoiceId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alert('Invoice sent via email successfully!');
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle size={16} className={styles.statusIconPaid} />;
      case 'sent':
        return <Clock size={16} className={styles.statusIconSent} />;
      case 'draft':
        return <AlertCircle size={16} className={styles.statusIconDraft} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return styles.statusPaid;
      case 'sent':
        return styles.statusSent;
      case 'draft':
        return styles.statusDraft;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={24} />
        <p>{error}</p>
        <button onClick={loadInvoices}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.headerLeft}>
          <h2>All Invoices</h2>
          <span className={styles.invoiceCount}>{invoices.length} invoices</span>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.filterWrapper}>
            <Filter size={16} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          <button onClick={loadInvoices} className={styles.refreshButton}>
            Refresh
          </button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} />
          <h3>No invoices yet</h3>
          <p>Create your first invoice by going to the Generate Invoice tab</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Procedure</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className={styles.invoiceNumber}>{invoice.invoiceNumber}</td>
                  <td>
                    <div className={styles.clientInfo}>
                      <strong>{invoice.clientName}</strong>
                      <span>{invoice.clientEmail}</span>
                    </div>
                  </td>
                  <td>{invoice.procedureType}</td>
                  <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                  <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                  <td className={styles.amount}>R{invoice.total.toFixed(2)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={styles.actionButton} 
                        title="Download PDF"
                        onClick={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className={styles.actionButton} 
                        title="Send Email"
                        onClick={() => handleEmailInvoice(invoice.id)}
                      >
                        <Mail size={16} />
                      </button>
                      <button 
                        className={styles.actionButton} 
                        title="View"
                        onClick={() => window.open(`${API_URL}/api/invoices/${invoice.id}/pdf`, '_blank')}
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceTable;