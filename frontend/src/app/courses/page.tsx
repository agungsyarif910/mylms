'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/lib/api';
import { Course, PaginatedResponse } from '@/types';
import styles from './courses.module.css';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchCourses();
  }, [page, search]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (search) params.append('search', search);
      const res = await api.get<PaginatedResponse<Course>>(`/courses?${params}`);
      setCourses(res.data.data);
      setTotalPages(res.data.meta.totalPages);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  return (
    <>
      <Navbar />
      <div className={styles.page}>
        <div className="container">
          <div className={styles.header}>
            <h1 className="page-title">Semua Course</h1>
            <p className="page-subtitle">Temukan kursus yang sesuai dengan kebutuhan Anda</p>
          </div>

          <div className={styles.searchBar}>
            <input
              type="text"
              className="form-input"
              placeholder="🔍 Cari course..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {loading ? (
            <div className="grid-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={`skeleton ${styles.skeletonThumb}`}></div>
                  <div className={styles.skeletonBody}>
                    <div className="skeleton" style={{height: 20, width: '80%', marginBottom: 8}}></div>
                    <div className="skeleton" style={{height: 14, width: '60%', marginBottom: 16}}></div>
                    <div className="skeleton" style={{height: 14, width: '40%'}}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <p className="empty-state-text">Belum ada course tersedia</p>
            </div>
          ) : (
            <>
              <div className="grid-3">
                {courses.map(course => (
                  <Link href={`/courses/${course.id}`} key={course.id} className={styles.courseCard}>
                    <div className={styles.thumbnail}>
                      <div className={styles.thumbPlaceholder}>{course.category || '📚'}</div>
                      {course.category && <span className={styles.category}>{course.category}</span>}
                    </div>
                    <div className={styles.body}>
                      <h3 className={styles.title}>{course.title}</h3>
                      <p className={styles.desc}>{course.shortDescription || course.description?.substring(0, 100)}</p>
                      <div className={styles.meta}>
                        <span>👤 {course.instructor?.fullName}</span>
                        <span>📅 {course._count?.sessions || 0} Sesi</span>
                      </div>
                      <div className={styles.footer}>
                        <span className="price">{formatPrice(Number(course.price))}</span>
                        <span className={styles.enrolled}>{course._count?.enrollments || 0} peserta</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <span className={styles.pageInfo}>Halaman {page} dari {totalPages}</span>
                  <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
