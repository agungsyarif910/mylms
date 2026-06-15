'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Course, CourseSession } from '@/types';

export default function InstructorCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'students' | 'grades'>('overview');

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', shortDescription: '', price: 0, maxParticipants: 0, category: '',
  });

  useEffect(() => {
    if (!params.id) return;
    Promise.all([
      api.get(`/courses/${params.id}`),
      api.get(`/courses/${params.id}/sessions`),
    ]).then(([courseRes, sessionsRes]) => {
      setCourse(courseRes.data);
      setSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setEditForm({
        title: courseRes.data.title || '',
        description: courseRes.data.description || '',
        shortDescription: courseRes.data.shortDescription || '',
        price: courseRes.data.price || 0,
        maxParticipants: courseRes.data.maxParticipants || 0,
        category: courseRes.data.category || '',
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [params.id]);

  const handleUpdate = async () => {
    try {
      const res = await api.put(`/courses/${params.id}`, editForm);
      setCourse(res.data);
      setEditing(false);
    } catch { /* ignore */ }
  };

  const handlePublish = async () => {
    try {
      const res = await api.patch(`/courses/${params.id}/publish`);
      setCourse(res.data);
    } catch { /* ignore */ }
  };

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus course ini?')) return;
    try {
      await api.delete(`/courses/${params.id}`);
      router.push('/instructor/courses');
    } catch { /* ignore */ }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}>Loading...</div>;
  if (!course) return <div style={{ textAlign: 'center', padding: 60 }}>Course tidak ditemukan</div>;

  const statusColors: Record<string, string> = {
    DRAFT: 'badge-warning', PUBLISHED: 'badge-success', ARCHIVED: 'badge-neutral',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
            <Link href="/instructor/courses" style={{ color: 'var(--primary-600)' }}>← Kembali ke Courses</Link>
          </div>
          <h1 className="page-title">{course.title}</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <span className={`badge ${statusColors[course.status]}`}>{course.status}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {course._count?.enrollments || 0} peserta · {course._count?.sessions || 0} sesi
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {course.status === 'DRAFT' && (
            <button onClick={handlePublish} className="btn btn-primary btn-sm">🚀 Publish</button>
          )}
          <button onClick={() => setEditing(!editing)} className="btn btn-ghost btn-sm">✏️ Edit</button>
          <button onClick={handleDelete} className="btn btn-sm" style={{ color: 'var(--error)' }}>🗑️ Hapus</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border-color)', marginBottom: 24 }}>
        {(['overview', 'sessions', 'students', 'grades'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'var(--primary-600)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab ? '2px solid var(--primary-600)' : '2px solid transparent',
              background: 'none',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: activeTab === tab ? 'var(--primary-600)' : 'transparent',
              cursor: 'pointer',
              marginBottom: -2,
              transition: 'all 0.2s',
            }}
          >
            {tab === 'overview' ? '📋 Overview' : tab === 'sessions' ? '📅 Sesi' : tab === 'students' ? '👥 Peserta' : '📊 Nilai'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab course={course} editing={editing} editForm={editForm} setEditForm={setEditForm} onSave={handleUpdate} onCancel={() => setEditing(false)} formatPrice={formatPrice} />
      )}
      {activeTab === 'sessions' && (
        <SessionsTab courseId={params.id as string} sessions={sessions} setSessions={setSessions} />
      )}
      {activeTab === 'students' && (
        <StudentsTab courseId={params.id as string} />
      )}
      {activeTab === 'grades' && (
        <GradesTab courseId={params.id as string} />
      )}
    </div>
  );
}

/* ===== OVERVIEW TAB ===== */
function OverviewTab({ course, editing, editForm, setEditForm, onSave, onCancel, formatPrice }: any) {
  if (editing) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Edit Course</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Judul</label>
            <input className="form-input" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi Singkat</label>
            <input className="form-input" value={editForm.shortDescription} onChange={e => setEditForm({ ...editForm, shortDescription: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Deskripsi</label>
            <textarea className="form-input" rows={5} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Harga (IDR)</label>
              <input className="form-input" type="number" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Maks. Peserta</label>
              <input className="form-input" type="number" value={editForm.maxParticipants} onChange={e => setEditForm({ ...editForm, maxParticipants: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <input className="form-input" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button onClick={onSave} className="btn btn-primary">Simpan</button>
            <button onClick={onCancel} className="btn btn-ghost">Batal</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Deskripsi</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{course.description}</p>
      </div>
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Detail</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Harga</span>
            <span style={{ fontWeight: 600 }}>{formatPrice(course.price)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Maks Peserta</span>
            <span style={{ fontWeight: 600 }}>{course.maxParticipants}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Kategori</span>
            <span style={{ fontWeight: 600 }}>{course.category || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Peserta</span>
            <span style={{ fontWeight: 600 }}>{course._count?.enrollments || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Sesi</span>
            <span style={{ fontWeight: 600 }}>{course._count?.sessions || 0}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--text-muted)' }}>Dibuat</span>
            <span>{new Date(course.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== SESSIONS TAB ===== */
function SessionsTab({ courseId, sessions, setSessions }: { courseId: string; sessions: CourseSession[]; setSessions: (s: CourseSession[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', sessionDate: '', startTime: '', endTime: '', zoomLink: '', sessionOrder: sessions.length + 1 });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      const res = await api.post(`/courses/${courseId}/sessions`, form);
      setSessions([...sessions, res.data]);
      setShowForm(false);
      setForm({ title: '', description: '', sessionDate: '', startTime: '', endTime: '', zoomLink: '', sessionOrder: sessions.length + 2 });
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Yakin ingin menghapus sesi ini?')) return;
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch { /* ignore */ }
  };

  const sessionStatusColors: Record<string, string> = {
    SCHEDULED: 'badge-info', ONGOING: 'badge-warning', COMPLETED: 'badge-success', CANCELLED: 'badge-neutral',
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Sesi Webinar ({sessions.length})</h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">+ Tambah Sesi</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Judul Sesi</label>
              <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Sesi 1: Pengenalan" />
            </div>
            <div className="form-group">
              <label className="form-label">Urutan</label>
              <input className="form-input" type="number" value={form.sessionOrder} onChange={e => setForm({ ...form, sessionOrder: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal</label>
              <input className="form-input" type="date" value={form.sessionDate} onChange={e => setForm({ ...form, sessionDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Mulai</label>
              <input className="form-input" type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Jam Selesai</label>
              <input className="form-input" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Zoom Link</label>
              <input className="form-input" value={form.zoomLink} onChange={e => setForm({ ...form, zoomLink: e.target.value })} placeholder="https://zoom.us/j/..." />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: 16 }}>
            <label className="form-label">Deskripsi</label>
            <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={handleAdd} className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan Sesi'}</button>
            <button onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">Batal</button>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <p className="empty-state-text">Belum ada sesi. Tambahkan sesi webinar pertama!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.sort((a, b) => a.sessionOrder - b.sessionOrder).map(session => (
            <div key={session.id} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sesi {session.sessionOrder}: {session.title}</span>
                  <span className={`badge ${sessionStatusColors[session.status]}`}>{session.status}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  📅 {new Date(session.sessionDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  &nbsp;· ⏰ {session.startTime} - {session.endTime}
                  {session.zoomLink && <span> · 🔗 <a href={session.zoomLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-600)' }}>Zoom</a></span>}
                </div>
              </div>
              <button onClick={() => handleDelete(session.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== STUDENTS TAB ===== */
function StudentsTab({ courseId }: { courseId: string }) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/enrollments/course/${courseId}`)
      .then(res => setEnrollments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const statusColors: Record<string, string> = {
    PENDING: 'badge-warning', ACTIVE: 'badge-success', COMPLETED: 'badge-info', CANCELLED: 'badge-neutral',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Peserta Terdaftar ({enrollments.length})</h3>
      {enrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <p className="empty-state-text">Belum ada peserta yang terdaftar.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Status</th>
                <th>Tanggal Daftar</th>
                <th>Nilai</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{enrollment.user?.fullName || '-'}</td>
                  <td>{enrollment.user?.email || '-'}</td>
                  <td><span className={`badge ${statusColors[enrollment.status]}`}>{enrollment.status}</span></td>
                  <td>{new Date(enrollment.enrolledAt || enrollment.createdAt).toLocaleDateString('id-ID')}</td>
                  <td>{enrollment.grade ? `${enrollment.grade.score} (${enrollment.grade.letterGrade})` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ===== GRADES TAB ===== */
function GradesTab({ courseId }: { courseId: string }) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ score: 0, notes: '' });

  useEffect(() => {
    api.get(`/enrollments/course/${courseId}`)
      .then(res => setEnrollments(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleGrade = async (enrollmentId: string) => {
    try {
      await api.post('/grades', { enrollmentId, score: gradeForm.score, notes: gradeForm.notes });
      // Refresh enrollments
      const res = await api.get(`/enrollments/course/${courseId}`);
      setEnrollments(Array.isArray(res.data) ? res.data : []);
      setGradingId(null);
      setGradeForm({ score: 0, notes: '' });
    } catch { /* ignore */ }
  };

  const handleGenerateCertificate = async (enrollmentId: string) => {
    try {
      await api.post(`/certificates/generate/${enrollmentId}`);
      alert('Sertifikat berhasil dibuat!');
      // Refresh
      const res = await api.get(`/enrollments/course/${courseId}`);
      setEnrollments(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal membuat sertifikat');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  const activeEnrollments = enrollments.filter(e => e.status === 'ACTIVE' || e.status === 'COMPLETED');

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Penilaian Peserta</h3>
      {activeEnrollments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p className="empty-state-text">Belum ada peserta aktif untuk dinilai.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeEnrollments.map(enrollment => (
            <div key={enrollment.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: enrollment.id === gradingId ? 16 : 0 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{enrollment.user?.fullName || 'Peserta'}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{enrollment.user?.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {enrollment.grade ? (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary-600)' }}>{enrollment.grade.score}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{enrollment.grade.letterGrade}</div>
                    </div>
                  ) : (
                    <button onClick={() => { setGradingId(enrollment.id); setGradeForm({ score: 0, notes: '' }); }} className="btn btn-primary btn-sm">Beri Nilai</button>
                  )}
                  {enrollment.grade && !enrollment.certificate && (
                    <button onClick={() => handleGenerateCertificate(enrollment.id)} className="btn btn-ghost btn-sm">🏆 Sertifikat</button>
                  )}
                  {enrollment.certificate && (
                    <span className="badge badge-success">✅ Sertifikat</span>
                  )}
                </div>
              </div>

              {gradingId === enrollment.id && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                  <div className="form-group" style={{ flex: '0 0 120px' }}>
                    <label className="form-label">Nilai (0-100)</label>
                    <input className="form-input" type="number" min={0} max={100} value={gradeForm.score} onChange={e => setGradeForm({ ...gradeForm, score: Number(e.target.value) })} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Catatan</label>
                    <input className="form-input" value={gradeForm.notes} onChange={e => setGradeForm({ ...gradeForm, notes: e.target.value })} placeholder="Catatan opsional..." />
                  </div>
                  <button onClick={() => handleGrade(enrollment.id)} className="btn btn-primary btn-sm">Simpan</button>
                  <button onClick={() => setGradingId(null)} className="btn btn-ghost btn-sm">Batal</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
