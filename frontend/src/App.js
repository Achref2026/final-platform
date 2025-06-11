import React, { useState, useEffect } from 'react';
import './App.css';
import VideoCall from './components/VideoCall';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import PhotoUpload from './components/PhotoUpload';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Language translations
const translations = {
  en: {
    appName: 'DrivingDZ',
    home: 'Home',
    findSchools: 'Find Schools',
    dashboard: 'Dashboard',
    registerSchool: 'Register School',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    welcome: 'Welcome',
    heroTitle: 'Master the Road with DrivingDZ',
    heroSubtitle: 'Your Journey to Independence Starts Here! 🇩🇿',
    heroDescription: 'Connect with certified driving instructors across all 58 wilayas of Algeria.',
    findPerfectSchool: 'Find Your Perfect School',
    startLearning: 'Start Learning Today',
    whyChoose: 'Why Choose DrivingDZ?',
    completeLearningPath: 'Complete Learning Path',
    certifiedInstructors: 'Certified Instructors',
    easyPayment: 'Easy Payment',
    theory: 'Theory',
    park: 'Parking',
    road: 'Road',
    enrollNow: 'Enroll Now',
    viewDetails: 'View Details',
    price: 'Price',
    state: 'State',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    uploadDocument: 'Upload Document',
    documents: 'Documents',
    viewDocument: 'View Document',
    verified: 'Verified',
    pendingVerification: 'Pending Verification',
    courseProgress: 'Course Progress',
    completedSessions: 'Completed Sessions',
    totalSessions: 'Total Sessions',
    takeExam: 'Take Exam',
    examPassed: 'Exam Passed',
    examFailed: 'Exam Failed',
    retakeCourse: 'Retake Course',
    nextCourse: 'Next Course Available',
    drivingLicense: 'Driving License Earned!',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    addTeacher: 'Add Teacher',
    teacherEmail: 'Teacher Email',
    canTeachMale: 'Can Teach Male',
    canTeachFemale: 'Can Teach Female',
    approveEnrollment: 'Approve Enrollment',
    rejectEnrollment: 'Reject Enrollment',
    completePayment: 'Complete Payment',
    paymentCompleted: 'Payment Completed',
    documentsRequired: 'Documents Required Before Starting Courses'
  },
  ar: {
    appName: 'DrivingDZ',
    home: 'الرئيسية',
    findSchools: 'البحث عن المدارس',
    dashboard: 'لوحة التحكم',
    registerSchool: 'تسجيل مدرسة',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    welcome: 'مرحباً',
    heroTitle: 'أتقن القيادة مع DrivingDZ',
    heroSubtitle: 'رحلتك نحو الاستقلالية تبدأ هنا! 🇩🇿',
    heroDescription: 'تواصل مع مدربي القيادة المعتمدين في جميع ولايات الجزائر الـ58',
    findPerfectSchool: 'ابحث عن مدرستك المثالية',
    startLearning: 'ابدأ التعلم اليوم',
    whyChoose: 'لماذا تختار DrivingDZ؟',
    completeLearningPath: 'مسار تعليمي شامل',
    certifiedInstructors: 'مدربون معتمدون',
    easyPayment: 'دفع سهل',
    theory: 'النظرية',
    park: 'الركن',
    road: 'الطريق',
    enrollNow: 'سجل الآن',
    viewDetails: 'عرض التفاصيل',
    price: 'السعر',
    state: 'الولاية',
    address: 'العنوان',
    phone: 'الهاتف',
    email: 'البريد الإلكتروني',
    uploadDocument: 'رفع وثيقة',
    documents: 'الوثائق',
    viewDocument: 'عرض الوثيقة',
    verified: 'مُتحقق منه',
    pendingVerification: 'في انتظار التحقق',
    courseProgress: 'تقدم الدورة',
    completedSessions: 'الجلسات المكتملة',
    totalSessions: 'إجمالي الجلسات',
    takeExam: 'خذ الامتحان',
    examPassed: 'نجح في الامتحان',
    examFailed: 'فشل في الامتحان',
    retakeCourse: 'إعادة الدورة',
    nextCourse: 'الدورة التالية متاحة',
    drivingLicense: 'حصلت على رخصة القيادة!',
    pending: 'معلق',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    addTeacher: 'إضافة مدرب',
    teacherEmail: 'بريد المدرب الإلكتروني',
    canTeachMale: 'يمكن تدريب الذكور',
    canTeachFemale: 'يمكن تدريب الإناث',
    approveEnrollment: 'الموافقة على التسجيل',
    rejectEnrollment: 'رفض التسجيل',
    completePayment: 'إكمال الدفع',
    paymentCompleted: 'تم الدفع',
    documentsRequired: 'الوثائق مطلوبة قبل بدء الدورات'
  },
  fr: {
    appName: 'DrivingDZ',
    home: 'Accueil',
    findSchools: 'Trouver des Écoles',
    dashboard: 'Tableau de Bord',
    registerSchool: 'Inscrire École',
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    welcome: 'Bienvenue',
    heroTitle: 'Maîtrisez la Route avec DrivingDZ',
    heroSubtitle: 'Votre Voyage vers l\'Indépendance Commence Ici! 🇩🇿',
    heroDescription: 'Connectez-vous avec des instructeurs de conduite certifiés dans les 58 wilayas d\'Algérie',
    findPerfectSchool: 'Trouvez Votre École Parfaite',
    startLearning: 'Commencez à Apprendre Aujourd\'hui',
    whyChoose: 'Pourquoi Choisir DrivingDZ?',
    completeLearningPath: 'Parcours d\'Apprentissage Complet',
    certifiedInstructors: 'Instructeurs Certifiés',
    easyPayment: 'Paiement Facile',
    theory: 'Théorie',
    park: 'Stationnement',
    road: 'Route',
    enrollNow: 'S\'inscrire Maintenant',
    viewDetails: 'Voir les Détails',
    price: 'Prix',
    state: 'Wilaya',
    address: 'Adresse',
    phone: 'Téléphone',
    email: 'Email',
    uploadDocument: 'Télécharger Document',
    documents: 'Documents',
    viewDocument: 'Voir Document',
    verified: 'Vérifié',
    pendingVerification: 'En Attente de Vérification',
    courseProgress: 'Progrès du Cours',
    completedSessions: 'Sessions Terminées',
    totalSessions: 'Total des Sessions',
    takeExam: 'Passer l\'Examen',
    examPassed: 'Examen Réussi',
    examFailed: 'Examen Échoué',
    retakeCourse: 'Reprendre le Cours',
    nextCourse: 'Cours Suivant Disponible',
    drivingLicense: 'Permis de Conduire Obtenu!',
    pending: 'En Attente',
    approved: 'Approuvé',
    rejected: 'Rejeté',
    addTeacher: 'Ajouter Instructeur',
    teacherEmail: 'Email de l\'Instructeur',
    canTeachMale: 'Peut Enseigner aux Hommes',
    canTeachFemale: 'Peut Enseigner aux Femmes',
    approveEnrollment: 'Approuver l\'Inscription',
    rejectEnrollment: 'Rejeter l\'Inscription',
    completePayment: 'Terminer le Paiement',
    paymentCompleted: 'Paiement Terminé',
    documentsRequired: 'Documents Requis Avant de Commencer les Cours'
  }
};

function App() {
  // Language state
  const [language, setLanguage] = useState('en');
  const t = translations[language];

  // State management
  const [currentPage, setCurrentPage] = useState('home');
  const [states, setStates] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [drivingSchools, setDrivingSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: '',
    address: '',
    state: '',
    phone: '',
    email: '',
    description: '',
    price: ''
  });
  const [authData, setAuthData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: 'male',
    state: ''
  });

  // Error handling state
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Global error handler function
  const handleApiError = (error, customMessage = '') => {
    console.error('API Error:', error);
    let errorMsg = customMessage || 'An error occurred. Please try again.';
    
    if (error.message) {
      errorMsg = error.message;
    }
    
    setGlobalError(errorMsg);
    // Auto-clear global error after 5 seconds
    setTimeout(() => setGlobalError(''), 5000);
  };

  // Global success handler
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Teacher management state
  const [teacherForm, setTeacherForm] = useState({
    email: '',
    can_teach_male: true,
    can_teach_female: true
  });
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [pendingTeachers, setPendingTeachers] = useState([]);

  // Video call state
  const [videoCallRoom, setVideoCallRoom] = useState(null);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Document management state
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [uploadDocumentType, setUploadDocumentType] = useState('');
  const [showDocumentList, setShowDocumentList] = useState(false);

  // Quiz system state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Load user data from localStorage on component mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    const savedLanguage = localStorage.getItem('language') || 'en';
    setLanguage(savedLanguage);
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Fetch Algerian states
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/states`);
        const data = await response.json();
        setStates(data.states);
      } catch (error) {
        console.error('Error fetching states:', error);
        setStates([
          'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar',
          'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger',
          'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma',
          'Constantine', 'Médéa', 'Mostaganem', 'MSila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh',
          'Illizi', 'Bordj Bou Arréridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued',
          'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
          'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès',
          'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El Meghaier', 'El Meniaa'
        ]);
      }
    };

    fetchStates();
  }, []);

  // Fetch dashboard data when user changes
  useEffect(() => {
    if (user && currentPage === 'dashboard') {
      fetchDashboardData();
    }
  }, [user, currentPage]);

  // Language change handler
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/dashboard/${user.role}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchPendingEnrollments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/enrollments/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingEnrollments(data);
      }
    } catch (error) {
      console.error('Error fetching pending enrollments:', error);
    }
  };

  const fetchPendingTeachers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/teachers/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingTeachers(data);
      }
    } catch (error) {
      console.error('Error fetching pending teachers:', error);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      let response;

      if (authMode === 'login') {
        // Login uses JSON
        const payload = { email: authData.email, password: authData.password };
        response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Registration uses FormData
        const formData = new FormData();
        formData.append('email', authData.email);
        formData.append('password', authData.password);
        formData.append('first_name', authData.first_name);
        formData.append('last_name', authData.last_name);
        formData.append('phone', authData.phone);
        formData.append('address', authData.address);
        formData.append('date_of_birth', authData.date_of_birth);
        formData.append('gender', authData.gender);
        formData.append('state', authData.state);

        response = await fetch(`${BACKEND_URL}${endpoint}`, {
          method: 'POST',
          body: formData // No Content-Type header for FormData
        });
      }

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }
        } catch {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setUser(data.user);
        setSuccessMessage(`${authMode === 'login' ? t.login : t.register} successful!`);
        
        // Close modal after a brief delay to show success message
        setTimeout(() => {
          setShowAuthModal(false);
          setSuccessMessage('');
        }, 1500);
        
        // Reset form
        setAuthData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          date_of_birth: '',
          gender: 'male',
          state: ''
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      setErrorMessage(`${authMode === 'login' ? t.login : t.register} failed: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
    setCurrentPage('home');
    setDashboardData(null);
  };

  const fetchDrivingSchools = async (state = '') => {
    setLoading(true);
    try {
      const url = state 
        ? `${BACKEND_URL}/api/driving-schools?state=${encodeURIComponent(state)}`
        : `${BACKEND_URL}/api/driving-schools`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch driving schools: ${response.status}`);
      }
      const data = await response.json();
      setDrivingSchools(data.schools || []);
    } catch (error) {
      handleApiError(error, 'Failed to load driving schools. Please try again.');
      setDrivingSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (schoolId) => {
    if (!user) {
      setErrorMessage('Please login to enroll in a driving school');
      setShowAuthModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          school_id: schoolId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showSuccess('Enrollment successful! Please proceed with payment and upload required documents.');
        setCurrentPage('dashboard');
        fetchDashboardData();
      } else {
        throw new Error(data.detail || 'Enrollment failed');
      }
    } catch (error) {
      handleApiError(error, 'Failed to enroll in driving school');
    }
  };

  const handleCompletePayment = async (enrollmentId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('enrollment_id', enrollmentId);

      const response = await fetch(`${BACKEND_URL}/api/payments/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert(t.paymentCompleted + '! Please upload required documents.');
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        alert('Payment failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error completing payment:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/enrollments/${enrollmentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Enrollment approved successfully!');
        fetchPendingEnrollments();
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        alert('Approval failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving enrollment:', error);
      alert('Approval failed. Please try again.');
    }
  };

  const handleRejectEnrollment = async (enrollmentId) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('reason', reason);

      const response = await fetch(`${BACKEND_URL}/api/enrollments/${enrollmentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        alert('Enrollment rejected.');
        fetchPendingEnrollments();
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        alert('Rejection failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      alert('Rejection failed. Please try again.');
    }
  };

  const handleAddTeacher = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/teachers/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(teacherForm)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Show detailed message with login info
        let message = data.message;
        if (data.login_info) {
          if (data.login_info.temporary_password) {
            message += `\n\nLogin Credentials:\nEmail: ${data.login_info.email}\nTemporary Password: ${data.login_info.temporary_password}\n\n${data.login_info.message}`;
          } else {
            message += `\n\n${data.login_info.message}`;
          }
        }
        
        alert(message);
        setShowTeacherModal(false);
        setTeacherForm({
          email: '',
          can_teach_male: true,
          can_teach_female: true
        });
        fetchDashboardData();
        fetchPendingTeachers();
      } else {
        const errorData = await response.json();
        alert('Failed to add teacher: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert('Failed to add teacher. Please try again.');
    }
  };

  const handleApproveTeacher = async (teacherId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/teachers/${teacherId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Teacher approved successfully!');
        fetchPendingTeachers();
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        alert('Approval failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error approving teacher:', error);
      alert('Approval failed. Please try again.');
    }
  };

  const handleCompleteSession = async (courseId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/courses/${courseId}/complete-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        alert('Failed to complete session: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session. Please try again.');
    }
  };

  const handleTakeExam = async (courseId) => {
    const score = prompt('Enter exam score (0-100):');
    if (!score || isNaN(score) || score < 0 || score > 100) {
      alert('Please enter a valid score between 0 and 100');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('score', score);

      const response = await fetch(`${BACKEND_URL}/api/courses/${courseId}/take-exam`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchDashboardData();
      } else {
        const errorData = await response.json();
        alert('Exam submission failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error taking exam:', error);
      alert('Exam submission failed. Please try again.');
    }
  };

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to register a driving school');
      setShowAuthModal(true);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/driving-schools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(schoolForm)
      });

      if (response.ok) {
        alert('Driving school registered successfully!');
        setSchoolForm({
          name: '',
          address: '',
          state: '',
          phone: '',
          email: '',
          description: '',
          price: ''
        });
        setCurrentPage('dashboard');
      } else {
        const errorData = await response.json();
        alert('Registration failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error registering school:', error);
      alert('Registration failed. Please try again.');
    }
  };

  // Document Management Functions
  const openDocumentUpload = (documentType) => {
    setUploadDocumentType(documentType);
    setShowDocumentUpload(true);
  };

  const handleDocumentUploadSuccess = (uploadData) => {
    setShowDocumentUpload(false);
    setUploadDocumentType('');
    alert('Document uploaded successfully!');
    
    if (currentPage === 'dashboard') {
      fetchDashboardData();
    }
  };

  const cancelDocumentUpload = () => {
    setShowDocumentUpload(false);
    setUploadDocumentType('');
  };

  const openDocumentList = () => {
    setShowDocumentList(true);
  };

  const closeDocumentList = () => {
    setShowDocumentList(false);
  };

  // Enhanced Document Upload Flow - Role-based requirements
  const getRequiredDocuments = (userRole) => {
    const requirements = {
      student: [
        { type: 'profile_photo', label: 'Profile Photo', icon: '📸', required: true },
        { type: 'id_card', label: 'ID Card', icon: '🆔', required: true },
        { type: 'medical_certificate', label: 'Medical Certificate', icon: '🏥', required: true }
      ],
      teacher: [
        { type: 'profile_photo', label: 'Profile Photo', icon: '📸', required: true },
        { type: 'id_card', label: 'ID Card', icon: '🆔', required: true },
        { type: 'driving_license', label: 'Driving License', icon: '🚗', required: true },
        { type: 'teaching_license', label: 'Teaching License', icon: '👨‍🏫', required: true }
      ],
      manager: [
        { type: 'profile_photo', label: 'Profile Photo', icon: '📸', required: true },
        { type: 'id_card', label: 'ID Card', icon: '🆔', required: true }
      ]
    };
    return requirements[userRole] || [];
  };

  const checkDocumentCompleteness = (userRole, uploadedDocs) => {
    const required = getRequiredDocuments(userRole);
    const uploadedTypes = uploadedDocs.map(doc => doc.document_type);
    const missing = required.filter(req => req.required && !uploadedTypes.includes(req.type));
    return {
      isComplete: missing.length === 0,
      missing: missing,
      completion: Math.round((uploadedTypes.length / required.length) * 100)
    };
  };

  const renderLanguageSelector = () => (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">🌐</span>
      <select
        value={language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="en">English</option>
        <option value="ar">العربية</option>
        <option value="fr">Français</option>
      </select>
    </div>
  );

  const renderNavigation = () => (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-3xl animate-pulse">🚗</div>
            <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t.appName}
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setCurrentPage('home')}
              className={`nav-button ${currentPage === 'home' ? 'nav-button-active' : ''}`}
            >
              🏠 {t.home}
            </button>
            <button
              onClick={() => {
                setCurrentPage('find-schools');
                fetchDrivingSchools();
              }}
              className={`nav-button ${currentPage === 'find-schools' ? 'nav-button-active' : ''}`}
            >
              🔍 {t.findSchools}
            </button>
            {user && user.role !== 'guest' && (
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  fetchDashboardData();
                }}
                className={`nav-button ${currentPage === 'dashboard' ? 'nav-button-active' : ''}`}
              >
                📊 {t.dashboard}
              </button>
            )}
            {user && user.role === 'manager' && (
              <button
                onClick={() => setCurrentPage('register-school')}
                className={`nav-button ${currentPage === 'register-school' ? 'nav-button-active' : ''}`}
              >
                🏫 {t.registerSchool}
              </button>
            )}
            {/* Register School button for all users */}
            {(!user || user.role === 'guest') && (
              <button
                onClick={() => setCurrentPage('register-school')}
                className={`nav-button ${currentPage === 'register-school' ? 'nav-button-active' : ''}`}
              >
                🏫 {t.registerSchool}
              </button>
            )}
            {renderLanguageSelector()}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <span className="text-gray-700 font-medium">{t.welcome}, {user.first_name}!</span>
                  <div className="text-xs text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded-full">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  {t.login}
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  {t.register}
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            {renderLanguageSelector()}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setCurrentPage('home');
                  setMobileMenuOpen(false);
                }}
                className={`mobile-nav-button ${currentPage === 'home' ? 'mobile-nav-button-active' : ''}`}
              >
                🏠 {t.home}
              </button>
              <button
                onClick={() => {
                  setCurrentPage('find-schools');
                  fetchDrivingSchools();
                  setMobileMenuOpen(false);
                }}
                className={`mobile-nav-button ${currentPage === 'find-schools' ? 'mobile-nav-button-active' : ''}`}
              >
                🔍 {t.findSchools}
              </button>
              {user && user.role !== 'guest' && (
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    fetchDashboardData();
                    setMobileMenuOpen(false);
                  }}
                  className={`mobile-nav-button ${currentPage === 'dashboard' ? 'mobile-nav-button-active' : ''}`}
                >
                  📊 {t.dashboard}
                </button>
              )}
              {user && user.role === 'manager' && (
                <button
                  onClick={() => {
                    setCurrentPage('register-school');
                    setMobileMenuOpen(false);
                  }}
                  className={`mobile-nav-button ${currentPage === 'register-school' ? 'mobile-nav-button-active' : ''}`}
                >
                  🏫 {t.registerSchool}
                </button>
              )}
              {/* Register School button for all users in mobile */}
              {(!user || user.role === 'guest') && (
                <button
                  onClick={() => {
                    setCurrentPage('register-school');
                    setMobileMenuOpen(false);
                  }}
                  className={`mobile-nav-button ${currentPage === 'register-school' ? 'mobile-nav-button-active' : ''}`}
                >
                  🏫 {t.registerSchool}
                </button>
              )}
              
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center mb-4">
                    <span className="text-gray-700 font-medium">{t.welcome}, {user.first_name}!</span>
                    <div className="text-xs text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded-full inline-block mt-1">
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {t.logout}
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    {t.login}
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    {t.register}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );

  const renderHomePage = () => (
    <div className="min-h-screen">
      {renderNavigation()}

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 51, 234, 0.7)), url('https://images.pexels.com/photos/593172/pexels-photo-593172.jpeg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              {t.heroTitle}
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                {t.appName}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              {t.heroSubtitle}
              <br />
              {t.heroDescription}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <button
                onClick={() => {
                  setCurrentPage('find-schools');
                  fetchDrivingSchools();
                }}
                className="hero-button hero-button-primary"
              >
                🔍 {t.findPerfectSchool}
              </button>
              {/* Register School button for all users */}
              <button
                onClick={() => setCurrentPage('register-school')}
                className="hero-button hero-button-secondary"
              >
                🏫 {t.registerSchool}
              </button>
              {user && user.role !== 'guest' && (
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    fetchDashboardData();
                  }}
                  className="hero-button hero-button-tertiary"
                >
                  📊 {t.dashboard}
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating Animation */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-white animate-bounce">
          <div className="text-2xl">👇</div>
          <p className="text-sm">Discover More</p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t.whyChoose}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of driving education in Algeria
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card group">
              <div className="feature-icon-container">
                <div className="text-5xl mb-4 group-hover:animate-pulse">🎯</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.completeLearningPath}</h3>
              <p className="text-gray-600 leading-relaxed">
                Master all aspects of driving with our comprehensive curriculum: 
                Theory lessons, Parking practice, and Real road experience designed to make you a confident, safe driver.
              </p>
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  <span className="feature-badge">📚 {t.theory}</span>
                  <span className="feature-badge">🅿️ {t.park}</span>
                  <span className="feature-badge">🛣️ {t.road}</span>
                </div>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="feature-icon-container">
                <div className="text-5xl mb-4 group-hover:animate-pulse">👨‍🏫</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.certifiedInstructors}</h3>
              <p className="text-gray-600 leading-relaxed">
                Learn from qualified, professional male and female instructors across Algeria. 
                Our certified teachers provide personalized instruction tailored to your learning style.
              </p>
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  <span className="feature-badge">✅ Certified</span>
                  <span className="feature-badge">👨‍🏫 Professional</span>
                  <span className="feature-badge">⭐ Rated</span>
                </div>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="feature-icon-container">
                <div className="text-5xl mb-4 group-hover:animate-pulse">💳</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{t.easyPayment}</h3>
              <p className="text-gray-600 leading-relaxed">
                Secure, convenient online payment system with BaridiMob integration. 
                Transparent pricing with no hidden fees - pay safely and start learning immediately.
              </p>
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  <span className="feature-badge">🔒 Secure</span>
                  <span className="feature-badge">📱 BaridiMob</span>
                  <span className="feature-badge">💰 Transparent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="stat-item">
              <div className="text-4xl md:text-5xl font-bold text-white">58</div>
              <div className="text-blue-100 mt-2">Wilayas Covered</div>
            </div>
            <div className="stat-item">
              <div className="text-4xl md:text-5xl font-bold text-white">1000+</div>
              <div className="text-blue-100 mt-2">Happy Students</div>
            </div>
            <div className="stat-item">
              <div className="text-4xl md:text-5xl font-bold text-white">200+</div>
              <div className="text-blue-100 mt-2">Certified Instructors</div>
            </div>
            <div className="stat-item">
              <div className="text-4xl md:text-5xl font-bold text-white">95%</div>
              <div className="text-blue-100 mt-2">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of successful drivers who learned with DrivingDZ
          </p>
          <button
            onClick={() => {
              setCurrentPage('find-schools');
              fetchDrivingSchools();
            }}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-lg text-xl font-bold hover:from-yellow-300 hover:to-orange-400 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            🚀 {t.startLearning}
          </button>
        </div>
      </section>
    </div>
  );

  const renderDashboard = () => {
    if (!user) return null;

    // Show special message for guest users
    if (user.role === 'guest') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          {renderNavigation()}
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="bg-white rounded-2xl shadow-xl p-12 border border-gray-100">
                <div className="text-8xl mb-6">👋</div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Welcome to DrivingDZ!
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  You're currently registered as a guest. To access your personalized dashboard, 
                  you need to take action by either enrolling in a driving school or registering your own school.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <div className="text-4xl mb-4">🎓</div>
                    <h3 className="text-xl font-bold text-blue-900 mb-3">Become a Student</h3>
                    <p className="text-blue-700 text-sm mb-4">
                      Find and enroll in a driving school to start your learning journey
                    </p>
                    <button
                      onClick={() => {
                        setCurrentPage('find-schools');
                        fetchDrivingSchools();
                      }}
                      className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200"
                    >
                      🔍 Find Driving Schools
                    </button>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                    <div className="text-4xl mb-4">🏫</div>
                    <h3 className="text-xl font-bold text-green-900 mb-3">Register Your School</h3>
                    <p className="text-green-700 text-sm mb-4">
                      Own a driving school? Register it and become a manager
                    </p>
                    <button
                      onClick={() => setCurrentPage('register-school')}
                      className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200"
                    >
                      🏫 Register School
                    </button>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center justify-center text-yellow-800">
                    <div className="text-xl mr-2">💡</div>
                    <p className="text-sm">
                      Once you enroll in a school or register your own, you'll get full access to your personalized dashboard!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {renderNavigation()}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
              {user.role === 'student' && '🎓 Student Dashboard'}
              {user.role === 'manager' && '🏫 Manager Dashboard'}
              {user.role === 'teacher' && '👨‍🏫 Teacher Dashboard'}
            </h1>
            <p className="text-xl text-gray-600">{t.welcome}, {user.first_name}!</p>
          </div>

          {/* Dashboard Content */}
          {dashboardData ? (
            <>
              {user.role === 'student' && renderStudentDashboard()}
              {user.role === 'manager' && renderManagerDashboard()}
              {user.role === 'teacher' && renderTeacherDashboard()}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your dashboard...</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStudentDashboard = () => (
    <div className="space-y-6">
      {/* Enrollment Status Warning */}
      {dashboardData.enrollments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-bold text-yellow-900 mb-2">⚠️ {t.documentsRequired}</h4>
          <p className="text-yellow-700 text-sm">
            You must upload and verify all required documents before courses can begin. Managers need to approve your enrollment after payment and document verification.
          </p>
        </div>
      )}

      {/* Payment Pending */}
      {dashboardData.enrollments.some(e => e.enrollment.payment_status === 'pending') && (
        <div className="dashboard-section">
          <h3 className="section-title">💳 {t.pending} Payments</h3>
          {dashboardData.enrollments.filter(e => e.enrollment.payment_status === 'pending').map((enrollment, index) => (
            <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-orange-900">{enrollment.school.name}</h4>
                  <p className="text-orange-700">Amount: {enrollment.enrollment.amount.toLocaleString()} DZD</p>
                </div>
                <button
                  onClick={() => handleCompletePayment(enrollment.enrollment.id)}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                >
                  {t.completePayment}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Documents Section */}
      <div className="dashboard-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title">📄 Required {t.documents}</h3>
          <button
            onClick={openDocumentList}
            className="btn-secondary-modern text-sm"
          >
            👁️ View All {t.documents}
          </button>
        </div>
        
        {user && (
          <div className="space-y-4">
            {/* Document Completion Status */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-blue-900">Document Verification Status</h4>
                <span className="text-sm text-blue-600">
                  {dashboardData.documents ? checkDocumentCompleteness(user.role, dashboardData.documents).completion : 0}% Complete
                </span>
              </div>
              <div className="progress-bar mb-2">
                <div 
                  className="progress-fill bg-blue-500" 
                  style={{
                    width: `${dashboardData.documents ? checkDocumentCompleteness(user.role, dashboardData.documents).completion : 0}%`
                  }}
                ></div>
              </div>
              <p className="text-sm text-blue-700">
                Complete your document verification to access all features
              </p>
            </div>

            {/* Required Documents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getRequiredDocuments(user.role).map((docReq) => {
                const isUploaded = dashboardData.documents && 
                  dashboardData.documents.some(doc => doc.document_type === docReq.type);
                const uploadedDoc = dashboardData.documents && 
                  dashboardData.documents.find(doc => doc.document_type === docReq.type);
                
                return (
                  <div key={docReq.type} className={`document-requirement-card ${isUploaded ? 'completed' : 'pending'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-2xl">{docReq.icon}</div>
                      <div className={`text-xl ${isUploaded ? 'text-green-500' : 'text-gray-400'}`}>
                        {isUploaded ? '✅' : '⏳'}
                      </div>
                    </div>
                    
                    <h5 className="font-bold text-gray-900 mb-2">{docReq.label}</h5>
                    
                    {isUploaded ? (
                      <div>
                        <p className="text-sm text-green-600 mb-2">
                          {uploadedDoc?.is_verified ? `✅ ${t.verified}` : `⏳ ${t.pendingVerification}`}
                        </p>
                        <button
                          onClick={() => window.open(uploadedDoc?.file_url, '_blank')}
                          className="btn-secondary-modern text-xs w-full"
                        >
                          👁️ {t.viewDocument}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openDocumentUpload(docReq.type)}
                        className="btn-primary-modern text-xs w-full"
                      >
                        📤 {t.uploadDocument} {docReq.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Enrollments */}
      <div className="dashboard-section">
        <h3 className="section-title">My Enrollments</h3>
        
        {dashboardData.enrollments.length === 0 ? (
          <div className="empty-state">
            <div className="text-6xl mb-4">🎓</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No enrollments found</h3>
            <p className="text-gray-600 mb-6">Find a driving school to get started!</p>
            <button
              onClick={() => setCurrentPage('find-schools')}
              className="btn-primary"
            >
              {t.findSchools}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {dashboardData.enrollments.map((enrollment, index) => (
              <div key={index} className="enrollment-card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{enrollment.school.name}</h4>
                    <p className="text-gray-600">{enrollment.school.address}, {enrollment.school.state}</p>
                    <p className="text-sm text-gray-500">
                      Enrolled: {new Date(enrollment.enrollment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`status-badge ${
                      enrollment.enrollment.enrollment_status === 'approved' ? 'status-completed' :
                      enrollment.enrollment.enrollment_status === 'pending_approval' ? 'status-pending' :
                      enrollment.enrollment.enrollment_status === 'pending_payment' ? 'status-pending' :
                      enrollment.enrollment.enrollment_status === 'pending_documents' ? 'status-pending' :
                      'status-failed'
                    }`}>
                      {enrollment.enrollment.enrollment_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                {/* Course Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['theory', 'park', 'road'].map((courseType) => {
                    const course = enrollment.courses.find(c => c.course_type === courseType);
                    if (!course) return null;
                    
                    return (
                      <div key={courseType} className="progress-card">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900 capitalize">{courseType} {t.courseProgress}</h5>
                          <div className="text-sm text-gray-500">
                            {course.status === 'locked' && '🔒 Locked'}
                            {course.status === 'available' && '✅ Available'}
                            {course.status === 'in_progress' && '⏳ In Progress'}
                            {course.status === 'completed' && '✅ Completed'}
                          </div>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{
                                width: `${course.total_sessions > 0 ? 
                                  (course.completed_sessions / course.total_sessions) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {course.completed_sessions} / {course.total_sessions} sessions
                          </p>
                        </div>
                        
                        {course.status === 'locked' && (
                          <p className="text-xs text-gray-500">Complete previous course first</p>
                        )}
                        
                        {course.status === 'available' && enrollment.enrollment.enrollment_status === 'approved' && (
                          <button
                            onClick={() => handleCompleteSession(course.id)}
                            className="btn-primary-modern text-xs w-full"
                          >
                            Start Course
                          </button>
                        )}
                        
                        {course.status === 'in_progress' && (
                          <button
                            onClick={() => handleCompleteSession(course.id)}
                            className="btn-primary-modern text-xs w-full"
                          >
                            Complete Session
                          </button>
                        )}
                        
                        {course.status === 'completed' && course.exam_status === 'available' && (
                          <button
                            onClick={() => handleTakeExam(course.id)}
                            className="btn-warning-modern text-xs w-full"
                          >
                            📝 {t.takeExam}
                          </button>
                        )}
                        
                        {course.exam_status === 'passed' && (
                          <div className="text-xs text-green-600 font-bold text-center">
                            ✅ {t.examPassed}
                          </div>
                        )}
                        
                        {course.exam_status === 'failed' && (
                          <div className="text-xs text-red-600 font-bold text-center">
                            ❌ {t.examFailed}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Driving License Status */}
                {enrollment.enrollment.enrollment_status === 'completed' && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-4xl mb-2">🎉</div>
                    <h4 className="font-bold text-green-900">{t.drivingLicense}</h4>
                    <p className="text-green-700">You have completed all courses and can now get your driving license!</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderManagerDashboard = () => {
    // Load pending data when manager dashboard is accessed
    useEffect(() => {
      if (user && user.role === 'manager' && currentPage === 'dashboard') {
        fetchPendingEnrollments();
        fetchPendingTeachers();
      }
    }, [user, currentPage]);

    return (
      <div className="space-y-6">
        {dashboardData.message ? (
          <div className="info-card">
            <div className="text-center">
              <div className="text-6xl mb-4">🏫</div>
              <h3 className="text-2xl font-bold text-blue-900 mb-2">No Driving School Found</h3>
              <p className="text-blue-700 mb-6">{dashboardData.message}</p>
              <button
                onClick={() => setCurrentPage('register-school')}
                className="btn-primary"
              >
                Create Driving School
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Quick Actions */}
            <div className="dashboard-section">
              <h3 className="section-title">🚀 Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowTeacherModal(true)}
                  className="quick-action-card"
                >
                  <div className="text-3xl mb-2">👨‍🏫</div>
                  <h4 className="font-bold text-gray-900">{t.addTeacher}</h4>
                  <p className="text-sm text-gray-600">Recruit new instructors</p>
                </button>
                
                <button
                  onClick={() => fetchPendingEnrollments()}
                  className="quick-action-card"
                >
                  <div className="text-3xl mb-2">✅</div>
                  <h4 className="font-bold text-gray-900">Approve Students</h4>
                  <p className="text-sm text-gray-600">Review enrollments</p>
                </button>
                
                <button
                  onClick={() => fetchPendingTeachers()}
                  className="quick-action-card"
                >
                  <div className="text-3xl mb-2">👨‍🏫</div>
                  <h4 className="font-bold text-gray-900">Approve Teachers</h4>
                  <p className="text-sm text-gray-600">Review teacher applications</p>
                </button>
                
                <button
                  onClick={() => setCurrentPage('register-school')}
                  className="quick-action-card"
                >
                  <div className="text-3xl mb-2">⚙️</div>
                  <h4 className="font-bold text-gray-900">School Settings</h4>
                  <p className="text-sm text-gray-600">Manage your school</p>
                </button>
              </div>
            </div>

            {/* Pending Enrollments */}
            <div className="dashboard-section">
              <h3 className="section-title">📋 {t.pending} Enrollments</h3>
              {pendingEnrollments.length === 0 ? (
                <div className="empty-state">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No pending enrollments</h3>
                  <p className="text-gray-600">All enrollments have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingEnrollments.map((enrollment, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">
                            {enrollment.student.first_name} {enrollment.student.last_name}
                          </h4>
                          <p className="text-gray-600">{enrollment.student.email}</p>
                          <p className="text-sm text-gray-500">
                            Enrolled: {new Date(enrollment.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            Documents: {enrollment.documents_complete ? '✅ Complete' : '❌ Incomplete'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveEnrollment(enrollment.id)}
                            disabled={!enrollment.documents_complete}
                            className={`px-4 py-2 rounded-lg text-sm ${
                              enrollment.documents_complete
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            ✅ {t.approveEnrollment}
                          </button>
                          <button
                            onClick={() => handleRejectEnrollment(enrollment.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
                          >
                            ❌ {t.rejectEnrollment}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Teachers */}
            <div className="dashboard-section">
              <h3 className="section-title">👨‍🏫 {t.pending} Teachers</h3>
              {pendingTeachers.length === 0 ? (
                <div className="empty-state">
                  <div className="text-6xl mb-4">👨‍🏫</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No pending teachers</h3>
                  <p className="text-gray-600">All teachers have been processed.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTeachers.map((teacher, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">
                            {teacher.user.first_name} {teacher.user.last_name}
                          </h4>
                          <p className="text-gray-600">{teacher.user.email}</p>
                          <p className="text-sm text-gray-500">
                            Can teach: {teacher.can_teach_male && teacher.can_teach_female ? 'Male & Female' :
                              teacher.can_teach_male ? 'Male only' : 'Female only'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Documents: {teacher.documents_complete ? '✅ Complete' : '❌ Incomplete'}
                          </p>
                        </div>
                        <div>
                          <button
                            onClick={() => handleApproveTeacher(teacher.id)}
                            disabled={!teacher.documents_complete}
                            className={`px-4 py-2 rounded-lg text-sm ${
                              teacher.documents_complete
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            ✅ Approve Teacher
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* School Statistics */}
            {dashboardData.school && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="stat-icon bg-blue-100 text-blue-600">👥</div>
                    <div>
                      <p className="stat-label">Total Students</p>
                      <p className="stat-value">{dashboardData.total_students}</p>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="stat-icon bg-green-100 text-green-600">✅</div>
                    <div>
                      <p className="stat-label">Active Students</p>
                      <p className="stat-value">{dashboardData.active_students}</p>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="stat-icon bg-orange-100 text-orange-600">⏳</div>
                    <div>
                      <p className="stat-label">Pending Approvals</p>
                      <p className="stat-value">{dashboardData.pending_approvals}</p>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="flex items-center">
                    <div className="stat-icon bg-purple-100 text-purple-600">👨‍🏫</div>
                    <div>
                      <p className="stat-label">Teachers</p>
                      <p className="stat-value">{dashboardData.total_teachers}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👨‍🏫</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Teacher Dashboard</h3>
        <p className="text-gray-600">Teacher features coming soon!</p>
      </div>
    </div>
  );

  // Render based on current page
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return renderHomePage();
      case 'find-schools':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {renderNavigation()}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Find Your Perfect <span className="text-blue-600">Driving School</span>
                </h1>
                <p className="text-xl text-gray-600">
                  Discover certified driving schools across Algeria's 58 wilayas
                </p>
              </div>

              {/* State Filter */}
              <div className="mb-8">
                <div className="max-w-md mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🗺️ Filter by {t.state} (Wilaya)
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      fetchDrivingSchools(e.target.value);
                    }}
                    className="select-modern"
                  >
                    <option value="">All States</option>
                    {states.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Finding the best driving schools...</p>
                </div>
              )}

              {/* Driving Schools List */}
              <div className="grid gap-6">
                {!loading && drivingSchools.length === 0 ? (
                  <div className="empty-state">
                    <div className="text-6xl mb-4">🏫</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">No driving schools found</h3>
                    <p className="text-gray-600 mb-4">
                      No driving schools found in {selectedState || 'Algeria'}.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedState('');
                        fetchDrivingSchools();
                      }}
                      className="btn-primary"
                    >
                      View All Schools
                    </button>
                  </div>
                ) : (
                  drivingSchools.map((school) => (
                    <div key={school.id} className="school-card-modern">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <h3 className="text-2xl font-bold text-gray-900">{school.name}</h3>
                              <div className="ml-4 flex items-center">
                                <span className="text-yellow-400 text-lg">⭐</span>
                                <span className="ml-1 text-gray-600 font-medium">
                                  {school.rating.toFixed(1)} ({school.total_reviews})
                                </span>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 mb-3 flex items-center">
                              <span className="mr-2">📍</span>
                              {school.address}, {school.state}
                            </p>
                            
                            <p className="text-gray-700 mb-4 leading-relaxed">{school.description}</p>
                            
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-6 text-sm text-gray-600">
                                <span className="flex items-center">
                                  <span className="mr-1">📞</span>
                                  {school.phone}
                                </span>
                                <span className="flex items-center">
                                  <span className="mr-1">📧</span>
                                  {school.email}
                                </span>
                              </div>
                              <div className="price-badge-modern">
                                {school.price.toLocaleString()} DZD
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-6 flex flex-col space-y-2 min-w-[140px]">
                            <button
                              onClick={() => setSelectedSchool(school)}
                              className="btn-secondary-modern"
                            >
                              👁️ {t.viewDetails}
                            </button>
                            <button
                              onClick={() => handleEnroll(school.id)}
                              className="btn-primary-modern"
                            >
                              🎓 {t.enrollNow}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );
      case 'register-school':
        return (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            {renderNavigation()}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {t.registerSchool}
                </h1>
                <p className="text-xl text-gray-600">
                  Join our network of certified driving schools across Algeria
                </p>
              </div>

              <div className="form-container-modern">
                <form onSubmit={handleSchoolSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">🏫 School Name</label>
                      <input
                        type="text"
                        required
                        value={schoolForm.name}
                        onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
                        className="input-modern"
                        placeholder="Enter your school name"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">🗺️ {t.state} (Wilaya)</label>
                      <select
                        required
                        value={schoolForm.state}
                        onChange={(e) => setSchoolForm({...schoolForm, state: e.target.value})}
                        className="select-modern"
                      >
                        <option value="">Select State</option>
                        {states.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">📍 {t.address}</label>
                    <input
                      type="text"
                      required
                      value={schoolForm.address}
                      onChange={(e) => setSchoolForm({...schoolForm, address: e.target.value})}
                      className="input-modern"
                      placeholder="Enter complete address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">📞 {t.phone}</label>
                      <input
                        type="tel"
                        required
                        value={schoolForm.phone}
                        onChange={(e) => setSchoolForm({...schoolForm, phone: e.target.value})}
                        className="input-modern"
                        placeholder="+213..."
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">📧 {t.email}</label>
                      <input
                        type="email"
                        required
                        value={schoolForm.email}
                        onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
                        className="input-modern"
                        placeholder="school@example.com"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">💰 {t.price} (DZD)</label>
                    <input
                      type="number"
                      required
                      value={schoolForm.price}
                      onChange={(e) => setSchoolForm({...schoolForm, price: e.target.value})}
                      className="input-modern"
                      placeholder="Enter course price"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">📝 Description</label>
                    <textarea
                      required
                      rows={4}
                      value={schoolForm.description}
                      onChange={(e) => setSchoolForm({...schoolForm, description: e.target.value})}
                      className="input-modern"
                      placeholder="Describe your driving school, facilities, and what makes it special..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-submit-modern"
                  >
                    🏫 Create Driving School
                  </button>
                </form>
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return renderDashboard();
      default:
        return renderHomePage();
    }
  };

  return (
    <div className="App">
      {/* Global Error/Success Notifications */}
      {globalError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="text-red-600 mr-3 text-xl">⚠️</div>
            <div>
              <div className="text-red-800 font-medium">Error</div>
              <div className="text-red-700 text-sm">{globalError}</div>
            </div>
            <button
              onClick={() => setGlobalError('')}
              className="ml-4 text-red-400 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {successMessage && !showAuthModal && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-center">
            <div className="text-green-600 mr-3 text-xl">✅</div>
            <div>
              <div className="text-green-800 font-medium">Success</div>
              <div className="text-green-700 text-sm">{successMessage}</div>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="ml-4 text-green-400 hover:text-green-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {renderCurrentPage()}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <h2 className="text-2xl font-bold text-gray-900">
                {authMode === 'login' ? t.login : t.register}
              </h2>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {/* Error and Success Messages */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-600 mr-2">❌</div>
                  <div className="text-red-800 text-sm">{errorMessage}</div>
                </div>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-green-600 mr-2">✅</div>
                  <div className="text-green-800 text-sm">{successMessage}</div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="form-group">
                <label className="form-label">{t.email}</label>
                <input
                  type="email"
                  required
                  value={authData.email}
                  onChange={(e) => setAuthData({...authData, email: e.target.value})}
                  className="input-modern"
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={authData.password}
                  onChange={(e) => setAuthData({...authData, password: e.target.value})}
                  className="input-modern"
                />
              </div>
              
              {authMode === 'register' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        required
                        value={authData.first_name}
                        onChange={(e) => setAuthData({...authData, first_name: e.target.value})}
                        className="input-modern"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        required
                        value={authData.last_name}
                        onChange={(e) => setAuthData({...authData, last_name: e.target.value})}
                        className="input-modern"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{t.phone}</label>
                    <input
                      type="tel"
                      required
                      value={authData.phone}
                      onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                      className="input-modern"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">{t.address}</label>
                    <input
                      type="text"
                      required
                      value={authData.address}
                      onChange={(e) => setAuthData({...authData, address: e.target.value})}
                      className="input-modern"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input
                        type="date"
                        required
                        value={authData.date_of_birth}
                        onChange={(e) => setAuthData({...authData, date_of_birth: e.target.value})}
                        className="input-modern"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Gender</label>
                      <select
                        required
                        value={authData.gender}
                        onChange={(e) => setAuthData({...authData, gender: e.target.value})}
                        className="select-modern"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">State (Wilaya)</label>
                    <select
                      required
                      value={authData.state}
                      onChange={(e) => setAuthData({...authData, state: e.target.value})}
                      className="select-modern"
                    >
                      <option value="">Select a state...</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              
              <button
                type="submit"
                disabled={authLoading}
                className="btn-submit-modern"
              >
                {authLoading ? 'Loading...' : (authMode === 'login' ? t.login : t.register)}
              </button>
            </form>
            
            <div className="text-center mt-4">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-blue-600 hover:text-blue-800"
              >
                {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Modal */}
      {showTeacherModal && (
        <div className="modal-overlay">
          <div className="auth-modal">
            <div className="auth-modal-header">
              <h2 className="text-2xl font-bold text-gray-900">{t.addTeacher}</h2>
              <button
                onClick={() => setShowTeacherModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">{t.teacherEmail}</label>
                <input
                  type="email"
                  required
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({...teacherForm, email: e.target.value})}
                  className="input-modern"
                  placeholder="teacher@example.com"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={teacherForm.can_teach_male}
                      onChange={(e) => setTeacherForm({...teacherForm, can_teach_male: e.target.checked})}
                      className="mr-2"
                    />
                    {t.canTeachMale}
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={teacherForm.can_teach_female}
                      onChange={(e) => setTeacherForm({...teacherForm, can_teach_female: e.target.checked})}
                      className="mr-2"
                    />
                    {t.canTeachFemale}
                  </label>
                </div>
              </div>
              
              <button
                onClick={handleAddTeacher}
                className="btn-submit-modern"
              >
                {t.addTeacher}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <DocumentUpload
          documentType={uploadDocumentType}
          onSuccess={handleDocumentUploadSuccess}
          onCancel={cancelDocumentUpload}
        />
      )}

      {/* Document List Modal */}
      {showDocumentList && (
        <DocumentList
          onClose={closeDocumentList}
        />
      )}
    </div>
  );
}

export default App;
