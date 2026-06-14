'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, loadUser, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div className={styles.loading}><div className={styles.spinner}></div></div>;
  }

  if (!isAuthenticated || !user) return null;

  const isInstructor = user.role === 'INSTRUCTOR';
  const prefix = isInstructor ? '/instructor' : '/student';

  const navItems = isInstructor
    ? [
        { href: '/instructor', label: 'Dashboard', icon: '📊' },
        { href: '/instructor/courses', label: 'Courses', icon: '📚' },
        { href: '/instructor/payments', label: 'Pembayaran', icon: '💳' },
        { href: '/instructor/feedbacks', label: 'Feedback', icon: '💬' },
      ]
    : [
        { href: '/student', label: 'Dashboard', icon: '📊' },
        { href: '/student/courses', label: 'Kursus Saya', icon: '📚' },
        { href: '/student/certificates', label: 'Sertifikat', icon: '📜' },
      ];

  return (
    <div className={styles.dashboardLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Link href="/" className={styles.logo}>
            <span>🎓</span>
            <span>Bhuana EduTech</span>
          </Link>
        </div>

        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <div className={styles.userName}>{user.fullName}</div>
            <div className={styles.userRole}>
              {isInstructor ? '🎓 Instructor' : '📖 Student'}
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button onClick={() => { logout(); router.push('/'); }} className={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h2 className={styles.greeting}>
              Halo, {user.fullName?.split(' ')[0]}! 👋
            </h2>
          </div>
          <div className={styles.topBarRight}>
            <Link href="/" className="btn btn-ghost btn-sm">🏠 Beranda</Link>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
