import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <span>🎓</span>
              <span>Bhuana EduTech</span>
            </div>
            <p className={styles.desc}>
              Platform pembelajaran online dengan webinar interaktif. 
              Belajar langsung dari instruktur berpengalaman.
            </p>
          </div>
          <div className={styles.links}>
            <h4>Platform</h4>
            <a href="/courses">Semua Course</a>
            <a href="/login">Login</a>
            <a href="/register">Daftar</a>
          </div>
          <div className={styles.links}>
            <h4>Kontak</h4>
            <a href="mailto:adam.bhuana@gmail.com">adam.bhuana@gmail.com</a>
            <p>© {new Date().getFullYear()} LMS Bhuana EduTech</p>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>Made with ❤️ by Bhuana EduTech</p>
        </div>
      </div>
    </footer>
  );
}
