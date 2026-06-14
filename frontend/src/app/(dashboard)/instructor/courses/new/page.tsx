'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', shortDescription: '', price: '', maxParticipants: '30', category: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/courses', {
        ...form,
        price: Number(form.price),
        maxParticipants: Number(form.maxParticipants),
      });
      router.push(`/instructor/courses/${res.data.course.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Buat Course Baru</h1>
        <p className="page-subtitle">Isi detail kursus yang akan Anda ajarkan</p>
      </div>

      <div style={{ maxWidth: 640, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 32 }}>
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Judul Course *</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="Fullstack Web Development" required />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Singkat</label>
            <input className="form-input" name="shortDescription" value={form.shortDescription} onChange={handleChange} placeholder="Ringkasan singkat tentang course" />
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Lengkap *</label>
            <textarea className="form-input form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Penjelasan detail tentang materi..." required rows={5} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Harga (IDR) *</label>
              <input className="form-input" name="price" type="number" value={form.price} onChange={handleChange} placeholder="500000" required min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Maks Peserta *</label>
              <input className="form-input" name="maxParticipants" type="number" value={form.maxParticipants} onChange={handleChange} placeholder="30" required min="1" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kategori</label>
            <input className="form-input" name="category" value={form.category} onChange={handleChange} placeholder="Web Development" />
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : '💾 Simpan Course'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Batal</button>
          </div>
        </form>
      </div>
    </div>
  );
}
