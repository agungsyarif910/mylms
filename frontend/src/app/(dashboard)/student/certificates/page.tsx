'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Certificate } from '@/types';

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get certificates through enrollments
    api.get('/enrollments/my-courses')
      .then(res => {
        const enrollments = Array.isArray(res.data) ? res.data : [];
        const certs = enrollments
          .filter((e: any) => e.certificate)
          .map((e: any) => ({
            ...e.certificate,
            courseName: e.course?.title || 'Course',
            studentName: e.user?.fullName || '',
            grade: e.grade,
          }));
        setCertificates(certs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Sertifikat Saya</h1>
        <p className="page-subtitle">Daftar sertifikat yang telah Anda peroleh</p>
      </div>

      {certificates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏆</div>
          <p className="empty-state-text">Anda belum memiliki sertifikat. Selesaikan kursus untuk mendapatkan sertifikat!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {certificates.map(cert => (
            <div key={cert.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Certificate visual header */}
              <div style={{
                padding: '32px 24px',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                color: 'white',
                textAlign: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, opacity: 0.05,
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, white 20px, white 21px)',
                }} />
                <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>SERTIFIKAT</div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>LMS Bhuana EduTech</div>
              </div>
              <div style={{ padding: 20 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
                  {cert.courseName}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>No. Sertifikat</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>{cert.certificateNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tanggal Terbit</span>
                    <span>{new Date(cert.issuedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  {cert.grade && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Nilai</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{cert.grade.score} ({cert.grade.letterGrade})</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/certificates/${cert.id}/download`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, textAlign: 'center' }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📥 Download PDF
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
