// src/Components/InvoiceTable.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // <-- NEW IMPORTS
import { Eye, Download, Mail, CheckCircle, Clock, AlertCircle, Filter, FileText, Edit3, RefreshCw, Calendar } from 'lucide-react';
import styles from './InvoiceTable.module.css';

import { InvoiceStatusUpdate } from './InvoiceStatusUpdate';

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
  status: string;
  createdAt: string;
  dueDate: string;
}

const STATUS_CONFIG = {
  'Draft': { icon: '', color: '#6c757d' },
  'Sent': { icon: '', color: '#0d6efd' },
  'Pending': { icon: '', color: '#ffc107' },
  'PartiallyPaid': { icon: '', color: '#fd7e14' },
  'Paid': { icon: '', color: '#198754' },
  'Overdue': { icon: '', color: '#dc3545' },
  'Cancelled': { icon: '', color: '#dc3545' },
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const InvoiceTable: React.FC = () => {
  // --- UI State (Filters and Modals) ---
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>(''); // Format: YYYY-MM
  
  const [selectedInvoiceForStatus, setSelectedInvoiceForStatus] = useState<{id: number, status: string, invoiceNumber: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const queryClient = useQueryClient(); // <-- Gives us access to the cache

  const getAuthToken = () => {
    return sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
  };

  // --- THE REACT QUERY MAGIC ---
  const { 
    data: invoices = [], // Defaults to an empty array
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['invoices', filterStatus], // Creates a unique cache for every status filter
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('Please login to continue');

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

      return await response.json() as Invoice[];
    }
  });

  const handleDownloadPDF = async (invoiceId: number, invoiceNumber: string) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_URL}/api/invoices/${invoiceId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to download PDF');

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

      if (!response.ok) throw new Error('Failed to send email');

      setSuccessMessage('Invoice sent via email successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email');
    }
  };

  const getStatusColor = (status: string) => STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || '#6c757d';

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'Draft': 'Draft', 'Sent': 'Sent', 'Pending': 'Pending',
      'PartiallyPaid': 'Partially Paid', 'Paid': 'Paid',
      'Overdue': 'Overdue', 'Cancelled': 'Cancelled',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (config?.icon) return <span className={styles.statusEmoji}>{config.icon}</span>;
    switch (status.toLowerCase()) {
      case 'paid': return <CheckCircle size={16} className={styles.statusIconPaid} />;
      case 'sent': return <Clock size={16} className={styles.statusIconSent} />;
      case 'draft': return <AlertCircle size={16} className={styles.statusIconDraft} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return styles.statusPaid;
      case 'sent': return styles.statusSent;
      case 'draft': return styles.statusDraft;
      case 'pending': return styles.statusPending;
      case 'overdue': return styles.statusOverdue;
      case 'cancelled': return styles.statusCancelled;
      case 'partiallypaid': return styles.statusPartiallyPaid;
      default: return '';
    }
  };

  // --- Client-side Month Filtering ---
  const displayedInvoices = useMemo(() => {
    let filtered = invoices;
    
    if (filterMonth) {
      filtered = filtered.filter(inv => inv.createdAt.startsWith(filterMonth));
    }
    
    return filtered;
  }, [invoices, filterMonth]);

  // --- Totals calculate based on what is currently displayed ---
  const statusTotals = useMemo(() => {
    return displayedInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + invoice.total;
      acc['Total_All'] = (acc['Total_All'] || 0) + invoice.total;
      return acc;
    }, {} as Record<string, number>);
  }, [displayedInvoices]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading invoices...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={24} />
        <p>{error instanceof Error ? error.message : 'Failed to load invoices'}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      {successMessage && (
        <div className={styles.successMessage}>
          <CheckCircle size={18} />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>×</button>
        </div>
      )}

      <div className={styles.tableHeader}>
        <div className={styles.headerLeft}>
          <h2>All Invoices</h2>
          <span className={styles.invoiceCount}>{displayedInvoices.length} invoices</span>
        </div>
        <div className={styles.headerRight}>
          
          {/* ===== Month Filter ===== */}
          <div className={styles.filterWrapper} title="Filter by Month">
            <Calendar size={16} />
            <input 
              type="month" 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className={styles.filterSelect}
              style={{ padding: '6px 4px', cursor: 'pointer' }}
            />
            {filterMonth && (
              <button 
                onClick={() => setFilterMonth('')} 
                style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '18px', padding: '0 4px', lineHeight: 1 }}
                title="Clear date filter"
              >
                &times;
              </button>
            )}
          </div>

          <div className={styles.filterWrapper}>
            <Filter size={16} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="Draft"> Draft</option>
              <option value="Sent">Sent</option>
              <option value="Pending"> Pending</option>
              <option value="PartiallyPaid"> Partially Paid</option>
              <option value="Paid"> Paid</option>
              <option value="Overdue"> Overdue</option>
              <option value="Cancelled"> Cancelled</option>
            </select>
          </div>
          <button onClick={() => refetch()} className={styles.refreshButton}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {displayedInvoices.length > 0 && (
        <div className={styles.summaryCardsGrid}>
          {Object.entries(statusTotals)
            .filter(([key]) => key !== 'Total_All')
            .map(([status, amount]) => (
              <div key={status} className={styles.summaryCard} style={{ borderLeftColor: getStatusColor(status) }}>
                <span className={styles.summaryCardTitle}>{getStatusLabel(status)}</span>
                <span className={styles.summaryCardAmount}>R {amount.toFixed(2)}</span>
              </div>
            ))}
          <div className={styles.summaryCard} style={{ borderLeftColor: '#334155', backgroundColor: '#f8fafc' }}>
             <span className={styles.summaryCardTitle}>Total (Current View)</span>
             <span className={styles.summaryCardAmount} style={{ color: '#0f172a' }}>
               R {statusTotals['Total_All']?.toFixed(2) || '0.00'}
             </span>
          </div>
        </div>
      )}

      {displayedInvoices.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} />
          <h3>No invoices found</h3>
          <p>Try adjusting your date or status filters.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Client</th>
                <th>Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedInvoices.map((invoice) => {
                const statusColor = getStatusColor(invoice.status);
                const statusLabel = getStatusLabel(invoice.status);
                
                return (
                  <tr key={invoice.id}>
                    <td className={styles.invoiceNumber}>{invoice.invoiceNumber}</td>
                    <td>
                      <div className={styles.clientInfo}>
                        <strong>{invoice.clientName}</strong>
                        <span>{invoice.clientEmail}</span>
                      </div>
                    </td>
                    <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                    <td>
                      {new Date(invoice.dueDate).toLocaleDateString()}
                      {new Date(invoice.dueDate) < new Date() && 
                       invoice.status !== 'Paid' && 
                       invoice.status !== 'Cancelled' && (
                        <span className={styles.overdueIndicator} title="Overdue">⚠️</span>
                      )}
                    </td>
                    <td className={styles.amount}>R{invoice.total.toFixed(2)}</td>
                    <td>
                      <span 
                        className={`${styles.statusBadge} ${getStatusClass(invoice.status)}`}
                        style={{ 
                          backgroundColor: statusColor ? statusColor + '20' : undefined,
                          color: statusColor || undefined
                        }}
                      >
                        {getStatusIcon(invoice.status)}
                        {statusLabel}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.actionButton} 
                          title="Change Status"
                          onClick={() => setSelectedInvoiceForStatus({
                            id: invoice.id,
                            status: invoice.status,
                            invoiceNumber: invoice.invoiceNumber
                          })}
                        >
                          <Edit3 size={16} />
                        </button>
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedInvoiceForStatus && (
        <InvoiceStatusUpdate
          invoiceId={selectedInvoiceForStatus.id}
          currentStatus={selectedInvoiceForStatus.status}
          invoiceNumber={selectedInvoiceForStatus.invoiceNumber}
          onStatusUpdated={() => {
            // <-- Invalidate the cache to trigger a background refetch
            queryClient.invalidateQueries({ queryKey: ['invoices'] }); 
            setSuccessMessage('Status updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
          onClose={() => setSelectedInvoiceForStatus(null)}
        />
      )}
    </div>
  );
};

export default InvoiceTable;