'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        email,
        password,
        fullName,
        phone: phone || undefined,
      });
      setRegistered(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registrasi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <>
        <Navbar />
        <div className={styles.authPage}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <span className={styles.authIcon}>📧</span>
              <h1>Cek Email Anda!</h1>
              <p>Kami telah mengirimkan link verifikasi</p>
            </div>

            <div className={styles.successBox}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>
                Email verifikasi telah dikirim ke <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
                Silakan klik link di dalam email untuk mengaktifkan akun Anda.
              </p>
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}>
                💡 <strong>Tips:</strong> Cek juga folder <strong>Spam</strong> atau <strong>Promosi</strong> jika
                email tidak muncul di Inbox.
              </div>
            </div>

            <p className={styles.authFooter}>
              Belum menerima email?{' '}
              <Link href="/resend-verification">Kirim Ulang</Link>
            </p>
            <p className={styles.authFooter} style={{ marginTop: '8px' }}>
              <Link href="/login">← Kembali ke Login</Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.authHeader}>
            <span className={styles.authIcon}>🎓</span>
            <h1>Buat Akun Baru</h1>
            <p>Daftar untuk mulai belajar di Bhuana EduTech</p>
          </div>

          {error && <div className="alert alert-error">⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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
              <label className="form-label">No. Telepon (opsional)</label>
              <input
                type="tel"
                className="form-input"
                placeholder="08xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Minimal 8 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Konfirmasi Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={`btn btn-primary ${styles.authBtn}`} disabled={loading}>
              {loading ? 'Loading...' : 'Daftar Sekarang'}
            </button>
          </form>

          <p className={styles.authFooter}>
            Sudah punya akun? <Link href="/login">Login</Link>
          </p>
        </div>
      </div>
    </>
  );
}
