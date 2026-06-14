'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Enrollment } from '@/types';

export default function StudentCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enrollments/my-courses')
      .then(res => setEnrollments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning', ACTIVE: 'badge-success', COMPLETED: 'badge-info', CANCELLED: 'badge-neutral',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Kursus Saya</h1>
        <p className="page-subtitle">Daftar kursus yang Anda ikuti</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-text">Anda belum mendaftar kursus apapun.</p>
          <Link href="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Jelajahi Kursus</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {enrollments.map(enrollment => (
            <div key={enrollment.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Card thumbnail area */}
              <div style={{
                height: 140,
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, padding: 20,
              }}>
                📚
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, flex: 1 }}>
                    {enrollment.course?.title || 'Course'}
                  </h3>
                  <span className={`badge ${statusColors[enrollment.status]}`}>{enrollment.status}</span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  {enrollment.course?.shortDescription || enrollment.course?.description?.substring(0, 100) || ''}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                  <span>Instruktur: {enrollment.course?.instructor?.fullName || '-'}</span>
                  <span>{enrollment.course?._count?.sessions || 0} sesi</span>
                </div>

                {/* Grade & Certificate */}
                {enrollment.grade && (
                  <div style={{ marginTop: 12, padding: 12, background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', fontSize: 14 }}>
                    <span style={{ fontWeight: 600 }}>Nilai: </span>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{enrollment.grade.score} ({enrollment.grade.letterGrade})</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link href={`/courses/${enrollment.courseId}`} className="btn btn-ghost btn-sm" style={{ flex: 1, textAlign: 'center' }}>Detail</Link>
                  {enrollment.certificate && (
                    <a href={`${process.env.NEXT_PUBLIC_API_URL}/certificates/${enrollment.certificate.id}/download`} className="btn btn-primary btn-sm" style={{ flex: 1, textAlign: 'center' }}>
                      🏆 Sertifikat
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
