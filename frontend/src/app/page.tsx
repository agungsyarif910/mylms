'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { Course } from '@/types';
import styles from './page.module.css';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api.get('/courses?limit=6')
      .then(res => setCourses(res.data.data || []))
      .catch(() => {});
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient}></div>
          <div className={styles.heroPattern}></div>
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>🚀 Platform Pembelajaran Online #1</div>
          <h1 className={styles.heroTitle}>
            Belajar Langsung dari
            <span className={styles.heroHighlight}> Instruktur Ahli</span>
          </h1>
          <p className={styles.heroDesc}>
            LMS Bhuana EduTech menyediakan pengalaman webinar interaktif 
            dengan materi berkualitas tinggi. Dapatkan sertifikat resmi 
            setelah menyelesaikan kursus.
          </p>
          <div className={styles.heroCta}>
            <Link href="/courses" className="btn btn-primary btn-lg">
              Jelajahi Course →
            </Link>
            <Link href="/register" className="btn btn-secondary btn-lg">
              Daftar Gratis
            </Link>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>100+</span>
              <span className={styles.heroStatLabel}>Peserta Aktif</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>10+</span>
              <span className={styles.heroStatLabel}>Kursus</span>
            </div>
            <div className={styles.heroStatDivider}></div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatValue}>⭐ 4.9</span>
              <span className={styles.heroStatLabel}>Rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={`section ${styles.features}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Mengapa Bhuana EduTech?</h2>
            <p className={styles.sectionDesc}>
              Pengalaman belajar online yang interaktif dan efektif
            </p>
          </div>
          <div className="grid-3">
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>📹</div>
              <h3>Webinar Live</h3>
              <p>Belajar langsung via Zoom dengan instruktur. Tanya jawab real-time.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconGreen}`}>📜</div>
              <h3>Sertifikat Resmi</h3>
              <p>Dapatkan sertifikat digital setelah menyelesaikan kursus.</p>
            </div>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconOrange}`}>💳</div>
              <h3>Pembayaran Mudah</h3>
              <p>Bayar dengan berbagai metode melalui Midtrans. Aman & cepat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses */}
      {courses.length > 0 && (
        <section className={`section ${styles.coursesSection}`}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Kursus Populer</h2>
              <Link href="/courses" className="btn btn-ghost">
                Lihat Semua →
              </Link>
            </div>
            <div className="grid-3">
              {courses.map(course => (
                <Link href={`/courses/${course.id}`} key={course.id} className={styles.courseCard}>
                  <div className={styles.courseThumbnail}>
                    <div className={styles.coursePlaceholder}>
                      {course.category || '📚'}
                    </div>
                    {course.category && (
                      <span className={styles.courseCategory}>{course.category}</span>
                    )}
                  </div>
                  <div className={styles.courseBody}>
                    <h3 className={styles.courseTitle}>{course.title}</h3>
                    <p className={styles.courseDesc}>
                      {course.shortDescription || course.description?.substring(0, 100)}
                    </p>
                    <div className={styles.courseMeta}>
                      <span className={styles.courseInstructor}>
                        👤 {course.instructor?.fullName}
                      </span>
                      <span className={styles.courseSessions}>
                        📅 {course._count?.sessions || 0} Sesi
                      </span>
                    </div>
                    <div className={styles.courseFooter}>
                      <span className="price">{formatPrice(Number(course.price))}</span>
                      <span className={styles.courseEnrolled}>
                        {course._count?.enrollments || 0} peserta
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaContent}>
            <h2>Siap Untuk Mulai Belajar?</h2>
            <p>Daftar sekarang dan akses kursus berkualitas dari instruktur berpengalaman.</p>
            <Link href="/register" className="btn btn-primary btn-lg">
              Daftar Sekarang — Gratis!
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
