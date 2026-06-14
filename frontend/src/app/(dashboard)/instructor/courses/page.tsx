'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Course } from '@/types';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/instructor/my-courses')
      .then(res => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/courses/${id}/publish`);
      setCourses(prev => prev.map(c => c.id === id ? { ...c, status: 'PUBLISHED' as const } : c));
    } catch {}
  };

  if (loading) return <div style={{textAlign: 'center', padding: 40}}>Loading...</div>;

  return (
    <div>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24}}>
        <div>
          <h1 className="page-title">Kelola Courses</h1>
          <p className="page-subtitle">Buat dan kelola kursus Anda</p>
        </div>
        <Link href="/instructor/courses/new" className="btn btn-primary">+ Buat Course</Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <p className="empty-state-text">Belum ada course</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Course</th><th>Status</th><th>Harga</th><th>Peserta</th><th>Sesi</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td style={{fontWeight: 600, color: 'var(--text-primary)', maxWidth: 300}}>{course.title}</td>
                  <td><span className={`badge ${course.status === 'PUBLISHED' ? 'badge-success' : course.status === 'DRAFT' ? 'badge-warning' : 'badge-neutral'}`}>{course.status}</span></td>
                  <td>{new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', minimumFractionDigits: 0}).format(Number(course.price))}</td>
                  <td>{course._count?.enrollments || 0}</td>
                  <td>{course._count?.sessions || 0}</td>
                  <td style={{display: 'flex', gap: 8}}>
                    <Link href={`/instructor/courses/${course.id}`} className="btn btn-ghost btn-sm">Kelola</Link>
                    {course.status === 'DRAFT' && (
                      <button onClick={() => handlePublish(course.id)} className="btn btn-accent btn-sm">Publish</button>
                    )}
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
