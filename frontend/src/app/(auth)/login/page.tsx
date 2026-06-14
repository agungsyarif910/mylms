'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import Navbar from '@/components/layout/Navbar';
import styles from '../auth.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResend(false);
    setLoading(true);

    try {
      await login(email, password);
      const user = useAuthStore.getState().user;
      router.push(user?.role === 'INSTRUCTOR' ? '/instructor' : '/student');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa email dan password.';
      setError(msg);
      // Show resend verification link if email not verified
      if (msg.toLowerCase().includes('verifikasi') || msg.toLowerCase().includes('belum diverifikasi')) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <span className={styles.authIcon}>🎓</span>
            <h1>Selamat Datang Kembali</h1>
            <p>Login ke akun LMS Bhuana EduTech</p>
          </div>

          {error && (
            <div className="alert alert-error">
              ⚠️ {error}
              {showResend && (
                <div style={{ marginTop: '8px' }}>
                  <Link
                    href="/resend-verification"
                    style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '13px' }}
                  >
                    → Kirim ulang email verifikasi
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <Link
                  href="/forgot-password"
                  style={{
                    fontSize: '13px',
                    color: 'var(--primary-600)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  Lupa Password?
                </Link>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={`btn btn-primary ${styles.authBtn}`} disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </button>
          </form>

          <p className={styles.authFooter}>
            Belum punya akun? <Link href="/register">Daftar Sekarang</Link>
          </p>
        </div>
      </div>
    </>
  );
}
