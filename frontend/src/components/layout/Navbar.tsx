'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getDashboardLink = () => {
    return user?.role === 'INSTRUCTOR' ? '/instructor' : '/student';
  };

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>🎓</span>
          <span className={styles.logoText}>Bhuana EduTech</span>
        </Link>

        <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
          <Link href="/courses" className={styles.navLink}>Courses</Link>

          {isAuthenticated ? (
            <>
              <Link href={getDashboardLink()} className={styles.navLink}>
                Dashboard
              </Link>
              <div className={styles.userMenu}>
                <button className={styles.userBtn}>
                  <span className={styles.avatar}>
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                  <span className={styles.userName}>{user?.fullName}</span>
                </button>
                <div className={styles.dropdown}>
                  <Link href={getDashboardLink()} className={styles.dropdownItem}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className={styles.dropdownItem}>
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.authBtns}>
              <Link href="/login" className="btn btn-ghost">Login</Link>
              <Link href="/register" className="btn btn-primary">Daftar</Link>
            </div>
          )}
        </div>

        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}
