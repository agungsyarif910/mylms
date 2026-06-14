'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Feedback } from '@/types';

export default function InstructorFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/feedbacks/all')
      .then(res => setFeedbacks(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center', padding: 40}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Feedback Peserta</h1>
        <p className="page-subtitle">Lihat ulasan dari peserta kursus Anda</p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">💬</div><p className="empty-state-text">Belum ada feedback</p></div>
      ) : (
        <div className="grid-2">
          {feedbacks.map(fb => (
            <div key={fb.id} className="card">
              <div className="card-body">
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 12}}>
                  <div>
                    <strong style={{fontSize: 14}}>{fb.isAnonymous ? 'Anonim' : fb.user?.fullName}</strong>
                    <p style={{fontSize: 12, color: 'var(--text-muted)'}}>{fb.course?.title}</p>
                  </div>
                  <span style={{fontSize: 16}}>{'⭐'.repeat(fb.rating)}</span>
                </div>
                {fb.comment && <p style={{fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6}}>{fb.comment}</p>}
                <p style={{fontSize: 11, color: 'var(--text-muted)', marginTop: 12}}>{new Date(fb.createdAt).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
