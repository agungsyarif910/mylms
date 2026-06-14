export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: 'INSTRUCTOR' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  shortDescription?: string;
  price: number;
  maxParticipants: number;
  thumbnailUrl?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  instructor?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    email?: string;
  };
  sessions?: CourseSession[];
  _count?: {
    enrollments: number;
    sessions: number;
    feedbacks: number;
  };
  averageRating?: number;
  feedbacks?: Feedback[];
}

export interface CourseSession {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  zoomLink?: string;
  zoomMeetingId?: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  sessionOrder: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  enrolledAt: string;
  completedAt?: string;
  course?: Course;
  payment?: Payment;
  grade?: Grade;
  certificate?: Certificate;
  user?: User;
}

export interface Payment {
  id: string;
  enrollmentId: string;
  userId: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
  paymentMethod?: string;
  midtransSnapToken?: string;
  midtransSnapUrl?: string;
  paidAt?: string;
  createdAt: string;
  snapToken?: string;
  snapUrl?: string;
}

export interface Grade {
  id: string;
  enrollmentId: string;
  score: number;
  letterGrade?: string;
  notes?: string;
  gradedAt: string;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  certificateNumber: string;
  fileUrl?: string;
  issuedAt: string;
}

export interface Feedback {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment?: string;
  isAnonymous: boolean;
  createdAt: string;
  user?: { fullName: string; avatarUrl?: string };
  course?: { title: string };
}

export interface DashboardStats {
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  averageRating: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}
