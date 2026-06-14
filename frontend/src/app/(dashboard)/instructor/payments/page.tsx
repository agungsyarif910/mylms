'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Payment } from '@/types';

export default function InstructorPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/payments/all')
      .then(res => setPayments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p: number) => new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', minimumFractionDigits: 0}).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});

  if (loading) return <div style={{textAlign:'center', padding: 40}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pembayaran</h1>
        <p className="page-subtitle">Riwayat pembayaran dari peserta</p>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">💳</div><p className="empty-state-text">Belum ada pembayaran</p></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Order ID</th><th>Peserta</th><th>Course</th><th>Jumlah</th><th>Status</th><th>Tanggal</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{fontFamily: 'monospace', fontSize: 12}}>{p.orderId}</td>
                  <td>{p.enrollment?.user?.fullName || '-'}</td>
                  <td>{p.enrollment?.course?.title || '-'}</td>
                  <td style={{fontWeight: 600}}>{formatPrice(Number(p.amount))}</td>
                  <td><span className={`badge ${p.status === 'PAID' ? 'badge-success' : p.status === 'PENDING' ? 'badge-warning' : p.status === 'FAILED' ? 'badge-error' : 'badge-neutral'}`}>{p.status}</span></td>
                  <td style={{fontSize: 13, color: 'var(--text-muted)'}}>{formatDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
