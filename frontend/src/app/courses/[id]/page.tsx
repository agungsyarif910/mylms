'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Course } from '@/types';
import styles from './detail.module.css';

export default function CourseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (id) {
      api.get(`/courses/${id}`)
        .then(res => setCourse(res.data))
        .catch(() => router.push('/courses'))
        .finally(() => setLoading(false));
    }
  }, [id, router]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleEnroll = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setEnrolling(true);
    setMessage('');
    try {
      const res = await api.post('/enrollments', { courseId: id });
      const enrollment = res.data.enrollment;
      // Create payment
      const paymentRes = await api.post('/payments/create', { enrollmentId: enrollment.id });
      const { snapUrl } = paymentRes.data.payment;
      if (snapUrl) window.location.href = snapUrl;
      else setMessage('Pembayaran berhasil dibuat. Silakan selesaikan pembayaran.');
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Gagal mendaftar');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container"><div className="skeleton" style={{height: 400, borderRadius: 16}}></div></div>
      </div>
    </>
  );

  if (!course) return null;

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.layout}>
            {/* Main Content */}
            <div className={styles.main}>
              <div className={styles.breadcrumb}>
                <Link href="/courses">Courses</Link> / <span>{course.title}</span>
              </div>

              <h1 className={styles.title}>{course.title}</h1>

              <div className={styles.metaRow}>
                <span className={styles.instructor}>👤 {course.instructor?.fullName}</span>
                {(course.averageRating ?? 0) > 0 && <span>⭐ {course.averageRating?.toFixed(1)}</span>}
                <span>👥 {course._count?.enrollments || 0} peserta</span>
                <span>📅 {course._count?.sessions || 0} sesi</span>
              </div>

              <div className={styles.section}>
                <h2>Tentang Course</h2>
                <p className={styles.description}>{course.description}</p>
              </div>

              {/* Sessions */}
              {course.sessions && course.sessions.length > 0 && (
                <div className={styles.section}>
                  <h2>Jadwal Webinar</h2>
                  <div className={styles.sessionList}>
                    {course.sessions.map((session, idx) => (
                      <div key={session.id} className={styles.sessionCard}>
                        <div className={styles.sessionOrder}>{idx + 1}</div>
                        <div className={styles.sessionInfo}>
                          <h3>{session.title}</h3>
                          <p>{formatDate(session.sessionDate)} • {session.startTime} - {session.endTime} WIB</p>
                          {session.description && <p className={styles.sessionDesc}>{session.description}</p>}
                        </div>
                        <span className={`badge ${session.status === 'COMPLETED' ? 'badge-success' : session.status === 'ONGOING' ? 'badge-warning' : 'badge-info'}`}>
                          {session.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedbacks */}
              {course.feedbacks && course.feedbacks.length > 0 && (
                <div className={styles.section}>
                  <h2>Ulasan Peserta</h2>
                  <div className={styles.feedbackList}>
                    {course.feedbacks.map(fb => (
                      <div key={fb.id} className={styles.feedbackCard}>
                        <div className={styles.feedbackHeader}>
                          <strong>{fb.isAnonymous ? 'Anonim' : fb.user?.fullName}</strong>
                          <span>{'⭐'.repeat(fb.rating)}</span>
                        </div>
                        {fb.comment && <p>{fb.comment}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className={styles.sidebar}>
              <div className={styles.priceCard}>
                <div className={styles.thumbnail}>
                  <div className={styles.thumbPlaceholder}>{course.category || '📚'}</div>
                </div>
                <div className={styles.priceCardBody}>
                  <div className="price price-lg">{formatPrice(Number(course.price))}</div>
                  <ul className={styles.features}>
                    <li>📹 {course._count?.sessions || 0} sesi webinar live</li>
                    <li>👥 Maks {course.maxParticipants} peserta</li>
                    <li>📜 Sertifikat kelulusan</li>
                    <li>💬 Tanya jawab langsung</li>
                  </ul>

                  {message && <div className="alert alert-info" style={{marginBottom: 16}}>{message}</div>}

                  <button
                    className="btn btn-primary btn-lg"
                    style={{width: '100%'}}
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Memproses...' : 'Daftar Sekarang'}
                  </button>

                  {course.category && (
                    <div className={styles.categoryTag}>
                      <span className="badge badge-info">{course.category}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
