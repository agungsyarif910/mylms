'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import styles from '../auth.module.css';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan.');
      return;
    }

    const verify = async () => {
      try {
        const response = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message);

        // Auto-login after verification
        if (response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          useAuthStore.getState().setUser(response.data.user);

          setTimeout(() => {
            const role = response.data.user?.role;
            router.push(role === 'INSTRUCTOR' ? '/instructor' : '/student');
          }, 3000);
        }
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Verifikasi gagal. Token tidak valid atau sudah kadaluarsa.'
        );
      }
    };

    verify();
  }, [token, router]);

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        {status === 'loading' && (
          <>
            <span className={styles.authIcon}>⏳</span>
            <h1>Memverifikasi Email...</h1>
            <p>Mohon tunggu sebentar</p>
          </>
        )}
        {status === 'success' && (
          <>
            <span className={styles.authIcon}>✅</span>
            <h1>Email Terverifikasi!</h1>
            <p>{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <span className={styles.authIcon}>❌</span>
            <h1>Verifikasi Gagal</h1>
            <p>{message}</p>
          </>
        )}
      </div>

      {status === 'success' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
            Anda akan dialihkan ke dashboard dalam 3 detik...
          </p>
          <Link href="/login" className={`btn btn-primary ${styles.authBtn}`}>
            Login Sekarang
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div style={{ textAlign: 'center' }}>
          <Link href="/login" className={`btn btn-primary ${styles.authBtn}`}>
            Kembali ke Login
          </Link>
          <p className={styles.authFooter}>
            Belum menerima email?{' '}
            <Link href="/resend-verification">Kirim Ulang Verifikasi</Link>
          </p>
        </div>
      )}

      {status === 'loading' && (
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <Navbar />
      <div className={styles.authPage}>
        <Suspense
          fallback={
            <div className={styles.authCard}>
              <div className={styles.authHeader}>
                <span className={styles.authIcon}>⏳</span>
                <h1>Memuat...</h1>
              </div>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
              </div>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </>
  );
}
