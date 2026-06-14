'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import styles from '../auth.module.css';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    if (!token) {
      setError('Token reset tidak ditemukan');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Reset password gagal. Token mungkin sudah kadaluarsa.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <span className={styles.authIcon}>❌</span>
          <h1>Link Tidak Valid</h1>
          <p>Token reset password tidak ditemukan di URL.</p>
        </div>
        <Link href="/forgot-password" className={`btn btn-primary ${styles.authBtn}`}>
          Minta Link Baru
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.authCard}>
      <div className={styles.authHeader}>
        <span className={styles.authIcon}>🔑</span>
        <h1>Reset Password</h1>
        <p>Buat password baru untuk akun Anda</p>
      </div>

      {success ? (
        <div style={{ textAlign: 'center' }}>
          <div className={styles.successBox}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>✅</span>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
              Password Berhasil Direset!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Anda sekarang bisa login dengan password baru.
            </p>
          </div>
          <Link href="/login" className={`btn btn-primary ${styles.authBtn}`}>
            Login Sekarang
          </Link>
        </div>
      ) : (
        <>
          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Password Baru</label>
              <input
                type="password"
                className="form-input"
                placeholder="Ulangi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.authBtn}`}
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>

          <p className={styles.authFooter}>
            <Link href="/login">← Kembali ke Login</Link>
          </p>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <ResetPasswordContent />
        </Suspense>
      </div>
    </>
  );
}
