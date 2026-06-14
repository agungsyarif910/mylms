'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';
import { Course } from '@/types';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.courseId) return;
    api.get(`/courses/${params.courseId}`)
      .then(res => setCourse(res.data))
      .catch(() => setError('Course tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [params.courseId]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const handleCheckout = async () => {
    if (!course) return;
    setProcessing(true);
    setError('');

    try {
      // Step 1: Create enrollment
      const enrollRes = await api.post('/enrollments', { courseId: course.id });
      const enrollmentId = enrollRes.data.id;

      // Step 2: Create payment
      const paymentRes = await api.post('/payments/create', { enrollmentId });
      const { snapToken, snapUrl } = paymentRes.data;

      // Step 3: Redirect to Midtrans or show snap popup
      if (snapUrl) {
        window.location.href = snapUrl;
      } else if (snapToken && (window as any).snap) {
        (window as any).snap.pay(snapToken, {
          onSuccess: () => {
            router.push('/student');
          },
          onPending: () => {
            router.push('/student');
          },
          onError: () => {
            setError('Pembayaran gagal. Silakan coba lagi.');
          },
          onClose: () => {
            setProcessing(false);
          },
        });
      } else if (snapUrl) {
        window.open(snapUrl, '_blank');
      } else {
        // Fallback: just redirect to student dashboard
        router.push('/student');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memproses pembayaran';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
          <div>Loading...</div>
        </div>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 100 }}>
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😢</div>
            <h2>Course Tidak Ditemukan</h2>
            <Link href="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>Kembali ke Courses</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      {/* Midtrans Snap Script */}
      <script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''}
      />

      <div style={{ minHeight: '100vh', paddingTop: 100, paddingBottom: 60 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 32 }}>
            <Link href="/courses" style={{ color: 'var(--primary-600)' }}>Courses</Link>
            {' > '}
            <Link href={`/courses/${course.id}`} style={{ color: 'var(--primary-600)' }}>{course.title}</Link>
            {' > '} Checkout
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'start' }}>
            {/* Left: Course Summary */}
            <div className="card" style={{ padding: 32 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
                Ringkasan Pesanan
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Pastikan detail pesanan Anda sudah benar</p>

              <div style={{ display: 'flex', gap: 16, padding: 20, background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, flexShrink: 0,
                }}>
                  📚
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{course.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>
                    {course.shortDescription || course.description?.substring(0, 120) + '...'}
                  </p>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    👨‍🏫 {course.instructor?.fullName || 'Instructor'} · {course._count?.sessions || 0} sesi
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Informasi Pembeli</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Nama</span>
                    <span style={{ fontWeight: 500 }}>{user?.fullName || '-'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Email</span>
                    <span style={{ fontWeight: 500 }}>{user?.email || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Payment Summary */}
            <div className="card" style={{ padding: 32, position: 'sticky', top: 100 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 20 }}>
                Detail Pembayaran
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Harga Kursus</span>
                  <span>{formatPrice(course.price)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Diskon</span>
                  <span style={{ color: 'var(--success)' }}>Rp 0</span>
                </div>
                <div style={{ height: 1, background: 'var(--border-color)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 18 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary-600)' }}>{formatPrice(course.price)}</span>
                </div>
              </div>

              {error && (
                <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13, color: 'var(--error)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={processing}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px 20px', fontSize: 15, fontWeight: 700 }}
              >
                {processing ? '⏳ Memproses...' : `💳 Bayar ${formatPrice(course.price)}`}
              </button>

              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                Pembayaran diproses melalui <strong>Midtrans</strong> (Sandbox Mode)
              </p>

              <div style={{
                display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16,
                fontSize: 12, color: 'var(--text-muted)',
              }}>
                🔒 Transaksi aman & terenkripsi
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
