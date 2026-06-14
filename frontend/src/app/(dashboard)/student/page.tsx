'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Enrollment } from '@/types';

export default function StudentDashboard() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enrollments/my-courses')
      .then(res => setEnrollments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <div style={{textAlign: 'center', padding: 40}}>Loading...</div>;

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE');
  const completedEnrollments = enrollments.filter(e => e.status === 'COMPLETED');

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Student</h1>
        <p className="page-subtitle">Overview kursus dan progress Anda</p>
      </div>

      <div className="grid-3" style={{marginBottom: 40}}>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--primary-50)'}}>📚</div>
          <div className="stat-label">Kursus Aktif</div>
          <div className="stat-value">{activeEnrollments.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(16,185,129,0.1)'}}>✅</div>
          <div className="stat-label">Selesai</div>
          <div className="stat-value">{completedEnrollments.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245,158,11,0.1)'}}>📜</div>
          <div className="stat-label">Sertifikat</div>
          <div className="stat-value">{enrollments.filter(e => e.certificate).length}</div>
        </div>
      </div>

      <h2 style={{fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 20}}>Kursus Saya</h2>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-text">Belum ada kursus. Jelajahi course yang tersedia!</p>
          <Link href="/courses" className="btn btn-primary" style={{marginTop: 16}}>Jelajahi Course</Link>
        </div>
      ) : (
        <div className="grid-2">
          {enrollments.map(enrollment => (
            <div key={enrollment.id} className="card">
              <div className="card-body">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12}}>
                  <h3 style={{fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', flex: 1}}>
                    {enrollment.course?.title}
                  </h3>
                  <span className={`badge ${enrollment.status === 'ACTIVE' ? 'badge-success' : enrollment.status === 'COMPLETED' ? 'badge-info' : 'badge-warning'}`}>
                    {enrollment.status}
                  </span>
                </div>

                <p style={{fontSize: 13, color: 'var(--text-muted)', marginBottom: 16}}>
                  👤 {enrollment.course?.instructor?.fullName} • Enrolled: {formatDate(enrollment.enrolledAt)}
                </p>

                {/* Upcoming sessions with Zoom link */}
                {enrollment.status === 'ACTIVE' && enrollment.course?.sessions && enrollment.course.sessions.length > 0 && (
                  <div style={{marginBottom: 16}}>
                    <p style={{fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8}}>SESI MENDATANG:</p>
                    {enrollment.course.sessions.slice(0, 2).map(session => (
                      <div key={session.id} style={{padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 6, fontSize: 13}}>
                        <strong>{session.title}</strong>
                        <div style={{color: 'var(--text-muted)', fontSize: 12}}>
                          {new Date(session.sessionDate).toLocaleDateString('id-ID')} • {session.startTime} - {session.endTime}
                        </div>
                        {session.zoomLink && (
                          <a href={session.zoomLink} target="_blank" rel="noopener noreferrer" className="btn btn-accent btn-sm" style={{marginTop: 6}}>
                            🔗 Join Zoom
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {enrollment.grade && (
                  <div style={{padding: '8px 12px', background: 'rgba(16,185,129,0.05)', borderRadius: 8, fontSize: 13, marginBottom: 12}}>
                    <strong>Grade: {enrollment.grade.letterGrade}</strong> ({Number(enrollment.grade.score)}/100)
                  </div>
                )}

                {enrollment.certificate && (
                  <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}${enrollment.certificate.fileUrl}`} target="_blank" className="btn btn-accent btn-sm">
                    📜 Download Sertifikat
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
