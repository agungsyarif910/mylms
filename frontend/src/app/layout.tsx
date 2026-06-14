import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Bhuana EduTech - Platform Pembelajaran Online",
  description: "Platform Learning Management System untuk pengajaran online sinkron (webinar). Belajar langsung dari instruktur ahli dengan materi berkualitas.",
  keywords: "LMS, e-learning, webinar, online learning, Bhuana EduTech",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
