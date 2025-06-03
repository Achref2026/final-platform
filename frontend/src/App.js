import React, { useState, useEffect } from 'react';
import './App.css';
import VideoCall from './components/VideoCall';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import PhotoUpload from './components/PhotoUpload';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function App() {
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
    gender: 'male'
  });

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

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = authMode === 'login' 
        ? { email: authData.email, password: authData.password }
        : authData;

      console.log('Making request to:', `${BACKEND_URL}${endpoint}`);
      console.log('Payload:', { ...payload, password: '[REDACTED]' });

      // Add a status update for the user
      console.log('Attempting to connect to backend...');

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', response.status, response.statusText, errorText);
        
        if (response.status === 404) {
          throw new Error('Backend service not found (404). The API endpoint may not be properly configured.');
        } else if (response.status === 500) {
          throw new Error('Internal server error. Please try again later.');
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
        setUser(data.user);
        setShowAuthModal(false);
        
        setTimeout(() => {
          alert(`${authMode === 'login' ? 'Login' : 'Registration'} successful!`);
        }, 100);
        
        // Reset form
        setAuthData({
          email: '',
          password: '',
          first_name: '',
          last_name: '',
          phone: '',
          address: '',
          date_of_birth: '',
          gender: 'male'
        });
      } else {
        console.error('Auth failed but response was ok:', data);
        setTimeout(() => {
          let errorMessage = 'Authentication failed';
          if (data.detail) {
            if (typeof data.detail === 'string') {
              errorMessage = data.detail;
            } else if (Array.isArray(data.detail)) {
              errorMessage = data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
            }
          }
          alert(errorMessage);
        }, 100);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setTimeout(() => {
        let errorMessage = `${authMode === 'login' ? 'Login' : 'Registration'} failed`;
        
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = '⚠️ Connection Error: The backend service is not accessible. This appears to be a configuration issue with the external URL routing. Please contact support or try again later.';
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = '🌐 Network Error: Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = '⏱️ Timeout Error: The request took too long. Please try again.';
        } else {
          errorMessage += ` - ${error.message}`;
        }
        
        alert(errorMessage);
      }, 100);
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
      const data = await response.json();
      setDrivingSchools(data.schools || []);
    } catch (error) {
      console.error('Error fetching driving schools:', error);
      setDrivingSchools([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (schoolId) => {
    if (!user) {
      alert('Please login to enroll in a driving school');
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
        alert('Enrollment successful! Please proceed with payment.');
      } else {
        alert(data.detail || 'Enrollment failed');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Enrollment failed - Network error');
    }
  };

  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('Please login to register a driving school');
      setShowAuthModal(true);
      return;
    }

    if (user.role !== 'manager') {
      alert('Only managers can register driving schools');
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

  // Video Call Functions
  const createVideoRoom = async (courseId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const roomName = `course-${courseId}-${Date.now()}`;
      
      const response = await fetch(`${BACKEND_URL}/api/video/create-room`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          room_name: roomName,
          course_id: courseId,
          properties: {
            enable_screenshare: true,
            enable_chat: true,
            start_video_off: false,
            start_audio_off: false,
            max_participants: 10
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setVideoCallRoom({
          url: data.room_url,
          name: data.room_name,
          sessionId: data.session_id
        });
        setShowVideoCall(true);
      } else {
        const errorData = await response.json();
        alert('Failed to create video room: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating video room:', error);
      alert('Failed to create video room. Please try again.');
    }
  };

  const joinVideoSession = async (sessionId) => {
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${BACKEND_URL}/api/video/join/${sessionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVideoCallRoom({
          url: data.room_url,
          name: data.room_name,
          sessionId: data.session_id
        });
        setShowVideoCall(true);
      } else {
        const errorData = await response.json();
        alert('Failed to join video session: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error joining video session:', error);
      alert('Failed to join video session. Please try again.');
    }
  };

  const leaveVideoCall = () => {
    setShowVideoCall(false);
    setVideoCallRoom(null);
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
    
    // Refresh dashboard if on dashboard page
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

  const closeDocumentList = () => {
    setShowDocumentList(false);
  };

  // Quiz Management Functions
  const fetchQuizzes = async (courseId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/quizzes/course/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
        return data;
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  };

  const openQuiz = async (courseId) => {
    const courseQuizzes = await fetchQuizzes(courseId);
    if (courseQuizzes.length > 0) {
      setCurrentQuiz(courseQuizzes[0]); // Take the first quiz for the course
      setActiveQuiz(courseQuizzes[0]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
      setShowQuizModal(true);
    } else {
      alert('No quizzes available for this course yet.');
    }
  };

  const handleQuizAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;

    try {
      const token = localStorage.getItem('auth_token');
      const answers = Object.keys(quizAnswers).map(questionIndex => ({
        question_index: parseInt(questionIndex),
        answer: quizAnswers[questionIndex]
      }));

      const formData = new FormData();
      formData.append('quiz_id', activeQuiz.id);
      formData.append('answers', JSON.stringify(answers));

      const response = await fetch(`${BACKEND_URL}/api/quiz-attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setQuizResult(result);
        setQuizSubmitted(true);
        
        // Refresh dashboard data to update progress
        if (currentPage === 'dashboard') {
          setTimeout(() => {
            fetchDashboardData();
          }, 1000);
        }
      } else {
        alert('Failed to submit quiz. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    }
  };

  const closeQuizModal = () => {
    setShowQuizModal(false);
    setCurrentQuiz(null);
    setActiveQuiz(null);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
  };

  const renderNavigation = () => (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-3xl animate-pulse">🚗</div>
            <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DrivingDZ
            </h1>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setCurrentPage('home')}
              className={`nav-button ${currentPage === 'home' ? 'nav-button-active' : ''}`}
            >
              🏠 Home
            </button>
            <button
              onClick={() => {
                setCurrentPage('find-schools');
                fetchDrivingSchools();
              }}
              className={`nav-button ${currentPage === 'find-schools' ? 'nav-button-active' : ''}`}
            >
              🔍 Find Schools
            </button>
            {user && (
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  fetchDashboardData();
                }}
                className={`nav-button ${currentPage === 'dashboard' ? 'nav-button-active' : ''}`}
              >
                📊 Dashboard
              </button>
            )}
            {user && user.role === 'manager' && (
              <button
                onClick={() => setCurrentPage('register-school')}
                className={`nav-button ${currentPage === 'register-school' ? 'nav-button-active' : ''}`}
              >
                🏫 Register School
              </button>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <span className="text-gray-700 font-medium">Welcome, {user.first_name}!</span>
                  <div className="text-xs text-blue-600 capitalize bg-blue-100 px-2 py-1 rounded-full">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Logout
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
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                >
                  Register
                </button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
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
                🏠 Home
              </button>
              <button
                onClick={() => {
                  setCurrentPage('find-schools');
                  fetchDrivingSchools();
                  setMobileMenuOpen(false);
                }}
                className={`mobile-nav-button ${currentPage === 'find-schools' ? 'mobile-nav-button-active' : ''}`}
              >
                🔍 Find Schools
              </button>
              {user && (
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    fetchDashboardData();
                    setMobileMenuOpen(false);
                  }}
                  className={`mobile-nav-button ${currentPage === 'dashboard' ? 'mobile-nav-button-active' : ''}`}
                >
                  📊 Dashboard
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
                  🏫 Register School
                </button>
              )}
              
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-center mb-4">
                    <span className="text-gray-700 font-medium">Welcome, {user.first_name}!</span>
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
                    Logout
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
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setShowAuthModal(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    Register
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
              Master the Road with
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                DrivingDZ
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Your Journey to Independence Starts Here! 🇩🇿
              <br />
              Connect with certified driving instructors across all 58 wilayas of Algeria. 
              Learn theory, master parking, and conquer the roads with professional guidance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
              <button
                onClick={() => {
                  setCurrentPage('find-schools');
                  fetchDrivingSchools();
                }}
                className="hero-button hero-button-primary"
              >
                🔍 Find Your Perfect School
              </button>
              {user && user.role === 'manager' && (
                <button
                  onClick={() => setCurrentPage('register-school')}
                  className="hero-button hero-button-secondary"
                >
                  🏫 Register Your School
                </button>
              )}
              {user && (
                <button
                  onClick={() => {
                    setCurrentPage('dashboard');
                    fetchDashboardData();
                  }}
                  className="hero-button hero-button-tertiary"
                >
                  📊 My Dashboard
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
              Why Choose <span className="text-blue-600">DrivingDZ</span>?
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Learning Path</h3>
              <p className="text-gray-600 leading-relaxed">
                Master all aspects of driving with our comprehensive curriculum: 
                Theory lessons, Parking practice, and Real road experience designed to make you a confident, safe driver.
              </p>
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  <span className="feature-badge">📚 Theory</span>
                  <span className="feature-badge">🅿️ Parking</span>
                  <span className="feature-badge">🛣️ Road</span>
                </div>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="feature-icon-container">
                <div className="text-5xl mb-4 group-hover:animate-pulse">👨‍🏫</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Certified Instructors</h3>
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Easy Payment</h3>
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
            🚀 Start Learning Today
          </button>
        </div>
      </section>
    </div>
  );

  const renderFindSchools = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {renderNavigation()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
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
              🗺️ Filter by State (Wilaya)
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
              <p className="text-sm text-gray-500 mb-6">
                Try selecting a different state or check back later.
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
                        👁️ View Details
                      </button>
                      <button
                        onClick={() => handleEnroll(school.id)}
                        className="btn-primary-modern"
                      >
                        🎓 Enroll Now
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

  const renderRegisterSchool = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {renderNavigation()}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Register Your <span className="text-blue-600">Driving School</span>
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
                <label className="form-label">🗺️ State (Wilaya)</label>
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
              <label className="form-label">📍 Address</label>
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
                <label className="form-label">📞 Phone</label>
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
                <label className="form-label">📧 Email</label>
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
              <label className="form-label">💰 Price (DZD)</label>
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

  const renderDashboard = () => {
    if (!user) return null;

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
            <p className="text-xl text-gray-600">Welcome back, {user.first_name}!</p>
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon bg-blue-100 text-blue-600">🏫</div>
            <div>
              <p className="stat-label">Total Enrollments</p>
              <p className="stat-value">{dashboardData.total_enrollments}</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon bg-green-100 text-green-600">✅</div>
            <div>
              <p className="stat-label">Active Enrollments</p>
              <p className="stat-value">{dashboardData.active_enrollments}</p>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="flex items-center">
            <div className="stat-icon bg-orange-100 text-orange-600">💳</div>
            <div>
              <p className="stat-label">Pending Payments</p>
              <p className="stat-value">{dashboardData.pending_payments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Video Sessions */}
      <div className="dashboard-section">
        <h3 className="section-title">📹 Upcoming Video Sessions</h3>
        {dashboardData.enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.enrollments.map((enrollment, enrollmentIndex) => 
              enrollment.courses
                .filter(course => course.course_type === 'theory' && course.teacher_id)
                .map((course, courseIndex) => (
                  <div key={`${enrollmentIndex}-${courseIndex}`} className="video-session-card">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">Theory Session</h4>
                        <p className="text-sm text-gray-600">{enrollment.school.name}</p>
                      </div>
                      <div className="text-2xl">📹</div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Progress:</span> {course.completed_sessions}/{course.total_sessions} sessions
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 ${course.status === 'in_progress' ? 'text-green-600' : 'text-gray-500'}`}>
                          {course.status.replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => createVideoRoom(course.id)}
                        className="btn-primary-modern text-sm flex-1"
                      >
                        🚀 Start Session
                      </button>
                      <button
                        onClick={() => openQuiz(course.id)}
                        className="btn-secondary-modern text-sm flex-1"
                      >
                        📝 Take Quiz
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        ) : (
          <div className="empty-state">
            <div className="text-6xl mb-4">📹</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No video sessions yet</h3>
            <p className="text-gray-600">Enroll in a driving school to start your theory sessions!</p>
          </div>
        )}
      </div>

      {/* Documents Section - Enhanced */}
      <div className="dashboard-section">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title">📄 Required Documents</h3>
          <button
            onClick={openDocumentList}
            className="btn-secondary-modern text-sm"
          >
            👁️ View All Documents
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
                          {uploadedDoc?.is_verified ? '✅ Verified' : '⏳ Pending Verification'}
                        </p>
                        <button
                          onClick={() => window.open(uploadedDoc?.file_url, '_blank')}
                          className="btn-secondary-modern text-xs w-full"
                        >
                          👁️ View Document
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openDocumentUpload(docReq.type)}
                        className="btn-primary-modern text-xs w-full"
                      >
                        📤 Upload {docReq.label}
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
              Find Schools
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
                      enrollment.enrollment.payment_status === 'completed' ? 'status-completed' :
                      enrollment.enrollment.payment_status === 'pending' ? 'status-pending' :
                      'status-failed'
                    }`}>
                      {enrollment.enrollment.payment_status}
                    </span>
                  </div>
                </div>
                
                {/* Course Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['theory', 'park', 'road'].map((courseType) => {
                    const course = enrollment.courses.find(c => c.course_type === courseType);
                    return (
                      <div key={courseType} className="progress-card">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium text-gray-900 capitalize">{courseType} Course</h5>
                          {courseType === 'theory' && course && (
                            <div className="flex space-x-2">
                              {course.teacher_id && (
                                <button
                                  onClick={() => createVideoRoom(course.id)}
                                  className="btn-primary-modern text-xs"
                                >
                                  📹 Join Class
                                </button>
                              )}
                              <button
                                onClick={() => openQuiz(course.id)}
                                className="btn-secondary-modern text-xs"
                              >
                                📝 Take Quiz
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="progress-bar mb-2">
                          <div 
                            className="progress-fill" 
                            style={{
                              width: `${enrollment.progress[courseType].total > 0 ? 
                                (enrollment.progress[courseType].completed / enrollment.progress[courseType].total) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600">
                          {enrollment.progress[courseType].completed} / {enrollment.progress[courseType].total} sessions
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderManagerDashboard = () => (
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
          {/* School Info */}
          <div className="dashboard-section">
            <h3 className="section-title">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">School Name</p>
                <p className="font-bold text-lg">{dashboardData.school.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{dashboardData.school.address}, {dashboardData.school.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-bold text-green-600 text-lg">{dashboardData.school.price.toLocaleString()} DZD</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="font-medium">⭐ {dashboardData.school.rating.toFixed(1)} ({dashboardData.school.total_reviews} reviews)</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
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

          {/* Teachers */}
          <div className="dashboard-section">
            <h3 className="section-title">Teachers</h3>
            {dashboardData.teachers.length === 0 ? (
              <div className="empty-state">
                <div className="text-6xl mb-4">👨‍🏫</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No teachers added yet</h3>
                <p className="text-gray-600">Add teachers to start offering courses.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboardData.teachers.map((teacher, index) => (
                  <div key={index} className="teacher-card">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">👨‍🏫</div>
                      <div>
                        <p className="font-bold text-lg">{teacher.user_id}</p>
                        <p className="text-sm text-gray-600">
                          Can teach: {teacher.can_teach_male && teacher.can_teach_female ? 'All genders' :
                            teacher.can_teach_female ? 'Female only' : 'Male only'}
                        </p>
                        <p className="text-sm text-gray-600">⭐ {teacher.rating.toFixed(1)} rating</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      {dashboardData.message ? (
        <div className="info-card">
          <div className="text-center">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-2xl font-bold text-blue-900 mb-2">Teacher Profile Not Found</h3>
            <p className="text-blue-700">{dashboardData.message}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="stat-card">
              <div className="flex items-center">
                <div className="stat-icon bg-blue-100 text-blue-600">📚</div>
                <div>
                  <p className="stat-label">Assigned Courses</p>
                  <p className="stat-value">{dashboardData.assigned_courses}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center">
                <div className="stat-icon bg-green-100 text-green-600">▶️</div>
                <div>
                  <p className="stat-label">Active Courses</p>
                  <p className="stat-value">{dashboardData.active_courses}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center">
                <div className="stat-icon bg-purple-100 text-purple-600">✅</div>
                <div>
                  <p className="stat-label">Completed Courses</p>
                  <p className="stat-value">{dashboardData.completed_courses}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses */}
          <div className="dashboard-section">
            <h3 className="section-title">My Courses</h3>
            {dashboardData.courses.length === 0 ? (
              <div className="empty-state">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No courses assigned yet</h3>
                <p className="text-gray-600">Courses will appear here when assigned by your school.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {dashboardData.courses.map((course, index) => (
                  <div key={index} className="course-card">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-gray-900 capitalize">{course.course_type} Course</h4>
                        <p className="text-gray-600">Student: {course.student.first_name} {course.student.last_name}</p>
                        <p className="text-gray-600">School: {course.school.name}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Progress: {course.completed_sessions} / {course.total_sessions} sessions
                        </p>
                        <div className="progress-bar mt-2" style={{width: '200px'}}>
                          <div 
                            className="progress-fill" 
                            style={{
                              width: `${course.total_sessions > 0 ? (course.completed_sessions / course.total_sessions) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`status-badge ${
                          course.status === 'completed' ? 'status-completed' :
                          course.status === 'in_progress' ? 'status-pending' :
                          'status-failed'
                        }`}>
                          {course.status.replace('_', ' ')}
                        </span>
                        
                        {course.course_type === 'theory' && course.status === 'in_progress' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => createVideoRoom(course.id)}
                              className="btn-primary-modern text-sm"
                            >
                              📹 Start Class
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderSchoolDetailsModal = () => (
    <div className="modal-backdrop">
      <div className="modal-container">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {selectedSchool.name}
          </h2>
          <button
            onClick={() => setSelectedSchool(null)}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{selectedSchool.address}, {selectedSchool.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-bold text-green-600 text-lg">{selectedSchool.price.toLocaleString()} DZD</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{selectedSchool.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{selectedSchool.email}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rating & Reviews</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-yellow-400 text-2xl">⭐</span>
                <span className="ml-2 text-xl font-bold">{selectedSchool.rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-600">({selectedSchool.total_reviews} reviews)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
            <p className="text-gray-700 leading-relaxed">{selectedSchool.description}</p>
          </div>

          {/* Teachers */}
          {selectedSchool.teachers && selectedSchool.teachers.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Instructors</h3>
              <div className="grid gap-4">
                {selectedSchool.teachers.map((teacher, index) => (
                  <div key={teacher.id || index} className="teacher-card">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{teacher.user ? `${teacher.user.first_name} ${teacher.user.last_name}` : teacher.user_id}</p>
                        <p className="text-sm text-gray-600">
                          👨‍🏫 Certified Instructor
                        </p>
                        <p className="text-sm text-gray-600">Licensed Professional</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1 text-sm font-bold">{teacher.rating ? teacher.rating.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              onClick={() => {
                setSelectedSchool(null);
                handleEnroll(selectedSchool.id);
              }}
              className="btn-primary flex-1"
            >
              🎓 Enroll Now
            </button>
            <button
              onClick={() => setSelectedSchool(null)}
              className="btn-secondary flex-1"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuthModal = () => (
    <div className="modal-backdrop">
      <div className="modal-container max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {authMode === 'login' ? '🔐 Login' : '📝 Register'}
          </h2>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="form-group">
            <label className="form-label">📧 Email</label>
            <input
              type="email"
              required
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              className="input-modern"
            />
          </div>

          <div className="form-group">
            <label className="form-label">🔒 Password</label>
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
                  <label className="form-label">👤 First Name</label>
                  <input
                    type="text"
                    required
                    value={authData.first_name}
                    onChange={(e) => setAuthData({...authData, first_name: e.target.value})}
                    className="input-modern"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">👤 Last Name</label>
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
                <label className="form-label">📞 Phone</label>
                <input
                  type="tel"
                  required
                  value={authData.phone}
                  onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                  className="input-modern"
                />
              </div>

              <div className="form-group">
                <label className="form-label">📍 Address</label>
                <input
                  type="text"
                  required
                  value={authData.address}
                  onChange={(e) => setAuthData({...authData, address: e.target.value})}
                  className="input-modern"
                />
              </div>

              <div className="form-group">
                <label className="form-label">📅 Date of Birth</label>
                <input
                  type="date"
                  required
                  value={authData.date_of_birth}
                  onChange={(e) => setAuthData({...authData, date_of_birth: e.target.value})}
                  className="input-modern"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">⚧ Gender</label>
                  <select
                    value={authData.gender}
                    onChange={(e) => setAuthData({...authData, gender: e.target.value})}
                    className="select-modern"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className={`btn-submit-modern ${authLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {authLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner-small mr-2"></div>
                {authMode === 'login' ? 'Logging in...' : 'Registering...'}
              </div>
            ) : (
              authMode === 'login' ? '🔐 Login' : '📝 Register'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {authMode === 'login' 
              ? "Don't have an account? Register"
              : "Already have an account? Login"
            }
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="App">
      {currentPage === 'home' && renderHomePage()}
      {currentPage === 'find-schools' && renderFindSchools()}
      {currentPage === 'register-school' && renderRegisterSchool()}
      {currentPage === 'dashboard' && renderDashboard()}
      {showAuthModal && renderAuthModal()}
      {selectedSchool && renderSchoolDetailsModal()}
      
      {/* Video Call Modal */}
      {showVideoCall && videoCallRoom && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-6xl">
            <VideoCall
              roomUrl={videoCallRoom.url}
              onLeave={leaveVideoCall}
              userName={user ? `${user.first_name} ${user.last_name}` : 'User'}
            />
          </div>
        </div>
      )}
      
      {/* Document Upload Modal */}
      {showDocumentUpload && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-2xl">
            <DocumentUpload
              documentType={uploadDocumentType}
              onUploadSuccess={handleDocumentUploadSuccess}
              onCancel={cancelDocumentUpload}
            />
          </div>
        </div>
      )}
      
      {/* Document List Modal */}
      {showDocumentList && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                📄 My Documents
              </h2>
              <button
                onClick={closeDocumentList}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
              >
                ✕
              </button>
            </div>
            <DocumentList />
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && activeQuiz && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                📝 {activeQuiz.title}
              </h2>
              <button
                onClick={closeQuizModal}
                className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
              >
                ✕
              </button>
            </div>
            
            {!quizSubmitted ? (
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-800">
                    <span className="font-bold">Time Limit:</span> {activeQuiz.time_limit_minutes} minutes
                  </p>
                  <p className="text-blue-800">
                    <span className="font-bold">Passing Score:</span> {activeQuiz.passing_score}%
                  </p>
                  <p className="text-blue-800">
                    <span className="font-bold">Questions:</span> {activeQuiz.questions.length}
                  </p>
                </div>
                
                {activeQuiz.questions.map((question, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {index + 1}. {question.question}
                    </h3>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={`question_${index}`}
                            value={option}
                            checked={quizAnswers[index] === option}
                            onChange={() => handleQuizAnswer(index, option)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-6">
                  <p className="text-gray-600">
                    Answered: {Object.keys(quizAnswers).length} / {activeQuiz.questions.length}
                  </p>
                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length !== activeQuiz.questions.length}
                    className="btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    📤 Submit Quiz
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className={`text-8xl ${quizResult.passed ? 'text-green-500' : 'text-red-500'}`}>
                  {quizResult.passed ? '🎉' : '😔'}
                </div>
                
                <div>
                  <h3 className="text-3xl font-bold mb-4">
                    {quizResult.passed ? 'Congratulations!' : 'Keep Practicing!'}
                  </h3>
                  <p className="text-xl text-gray-700 mb-4">
                    Your Score: <span className="font-bold text-2xl">{quizResult.score.toFixed(1)}%</span>
                  </p>
                  <p className="text-gray-600">
                    {quizResult.passed 
                      ? 'You passed the quiz! Great job on mastering the theory.' 
                      : `You need ${activeQuiz.passing_score}% to pass. Review the material and try again.`
                    }
                  </p>
                </div>
                
                <button
                  onClick={closeQuizModal}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contact Us Section */}
      <footer className="bg-gradient-to-r from-gray-900 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-8">
              📞 Contact Us
            </h2>
            <p className="text-xl text-gray-300 mb-12">
              Get in touch with us for any inquiries about our driving school platform
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Phone Contact */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 hover:bg-white/20 transition-all duration-200">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-2xl font-bold mb-4">Phone Support</h3>
                <p className="text-gray-300 mb-4">Call us for immediate assistance</p>
                <a 
                  href="tel:+213555123456" 
                  className="text-2xl font-bold text-yellow-400 hover:text-yellow-300 transition-colors"
                >
                  +213 555 123 456
                </a>
                <p className="text-sm text-gray-400 mt-2">
                  Available: Sunday - Thursday, 8:00 AM - 6:00 PM
                </p>
              </div>

              {/* Social Media */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 hover:bg-white/20 transition-all duration-200">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-2xl font-bold mb-4">Follow Us</h3>
                <p className="text-gray-300 mb-6">Connect with us on social media</p>
                <div className="flex justify-center space-x-6">
                  <a 
                    href="https://facebook.com/drivingdz" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl hover:text-blue-400 transition-colors"
                    title="Facebook"
                  >
                    📘
                  </a>
                  <a 
                    href="https://instagram.com/drivingdz" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl hover:text-pink-400 transition-colors"
                    title="Instagram"
                  >
                    📷
                  </a>
                  <a 
                    href="https://youtube.com/drivingdz" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl hover:text-red-400 transition-colors"
                    title="YouTube"
                  >
                    📺
                  </a>
                  <a 
                    href="https://twitter.com/drivingdz" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-3xl hover:text-blue-300 transition-colors"
                    title="Twitter"
                  >
                    🐦
                  </a>
                </div>
              </div>
            </div>

            {/* Additional Contact Info */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h4 className="text-lg font-bold mb-2">📧 Email Support</h4>
                  <a 
                    href="mailto:support@drivingdz.com"
                    className="text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    support@drivingdz.com
                  </a>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">🏢 Main Office</h4>
                  <p className="text-gray-300">
                    123 Rue de la République<br />
                    Alger Centre, Algeria
                  </p>
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-2">⏰ Business Hours</h4>
                  <p className="text-gray-300">
                    Sunday - Thursday: 8:00 AM - 6:00 PM<br />
                    Friday - Saturday: Closed
                  </p>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <p className="text-gray-400">
                © 2024 DrivingDZ. All rights reserved. | Made with ❤️ for Algerian drivers
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;