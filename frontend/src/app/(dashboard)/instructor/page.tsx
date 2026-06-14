'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { DashboardStats, Course } from '@/types';

export default function InstructorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses/instructor/dashboard'),
      api.get('/courses/instructor/my-courses'),
    ]).then(([statsRes, coursesRes]) => {
      setStats(statsRes.data);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (loading) return <div style={{textAlign: 'center', padding: 40}}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Instructor</h1>
        <p className="page-subtitle">Overview performa kursus Anda</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{marginBottom: 40}}>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'var(--primary-50)'}}>📚</div>
          <div className="stat-label">Total Courses</div>
          <div className="stat-value">{stats?.totalCourses || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(16,185,129,0.1)'}}>👥</div>
          <div className="stat-label">Total Peserta</div>
          <div className="stat-value">{stats?.totalEnrollments || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(249,115,22,0.1)'}}>💰</div>
          <div className="stat-label">Total Pendapatan</div>
          <div className="stat-value" style={{fontSize: 22}}>{formatPrice(Number(stats?.totalRevenue || 0))}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(245,158,11,0.1)'}}>⭐</div>
          <div className="stat-label">Rating Rata-rata</div>
          <div className="stat-value">{(stats?.averageRating || 0).toFixed(1)}</div>
        </div>
      </div>

      {/* Recent Courses */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
        <h2 style={{fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700}}>Courses Saya</h2>
        <Link href="/instructor/courses/new" className="btn btn-primary btn-sm">+ Buat Course</Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-text">Belum ada course. Buat course pertama Anda!</p>
          <Link href="/instructor/courses/new" className="btn btn-primary" style={{marginTop: 16}}>Buat Course</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Peserta</th>
                <th>Sesi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {courses.slice(0, 10).map(course => (
                <tr key={course.id}>
                  <td style={{fontWeight: 600, color: 'var(--text-primary)'}}>{course.title}</td>
                  <td>
                    <span className={`badge ${course.status === 'PUBLISHED' ? 'badge-success' : course.status === 'DRAFT' ? 'badge-warning' : 'badge-neutral'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td>{course._count?.enrollments || 0}</td>
                  <td>{course._count?.sessions || 0}</td>
                  <td>
                    <Link href={`/instructor/courses/${course.id}`} className="btn btn-ghost btn-sm">Kelola</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
