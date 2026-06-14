'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Terjadi kesalahan. Coba lagi.');
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
            <span className={styles.authIcon}>🔐</span>
            <h1>Lupa Password?</h1>
            <p>Masukkan email Anda untuk menerima link reset password</p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div className={styles.successBox}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📧</span>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Email Terkirim!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  Jika email <strong>{email}</strong> terdaftar di sistem kami, Anda akan menerima
                  link untuk mereset password. Silakan cek inbox dan folder spam Anda.
                </p>
              </div>
              <p className={styles.authFooter}>
                <Link href="/login">← Kembali ke Login</Link>
              </p>
            </div>
          ) : (
            <>
              {error && <div className="alert alert-error">⚠️ {error}</div>}

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

                <button
                  type="submit"
                  className={`btn btn-primary ${styles.authBtn}`}
                  disabled={loading}
                >
                  {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
                </button>
              </form>

              <p className={styles.authFooter}>
                Ingat password? <Link href="/login">Login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
