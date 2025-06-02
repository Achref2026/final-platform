import React, { useState, useEffect } from 'react';
import './App.css';

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
    role: 'student'
  });

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
          gender: 'male',
          role: 'student'
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
    
    if (!user || user.role !== 'manager') {
      alert('Only managers can create driving schools');
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
        body: JSON.stringify({
          ...schoolForm,
          price: parseFloat(schoolForm.price)
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Driving school created successfully!');
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
        alert(data.detail || 'Failed to create driving school');
      }
    } catch (error) {
      console.error('School creation error:', error);
      alert('Failed to create driving school - Network error');
    }
  };

  const renderNavigation = () => (
    <header className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <div className="text-2xl">🚗</div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">EcoleDZ</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => setCurrentPage('home')}
              className={`text-gray-700 hover:text-blue-600 ${currentPage === 'home' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentPage('find-schools');
                fetchDrivingSchools();
              }}
              className={`text-gray-700 hover:text-blue-600 ${currentPage === 'find-schools' ? 'text-blue-600 font-semibold' : ''}`}
            >
              Find Schools
            </button>
            {user && (
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  fetchDashboardData();
                }}
                className={`text-gray-700 hover:text-blue-600 ${currentPage === 'dashboard' ? 'text-blue-600 font-semibold' : ''}`}
              >
                Dashboard
              </button>
            )}
            {user && user.role === 'manager' && (
              <button
                onClick={() => setCurrentPage('register-school')}
                className={`text-gray-700 hover:text-blue-600 ${currentPage === 'register-school' ? 'text-blue-600 font-semibold' : ''}`}
              >
                Register School
              </button>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, {user.first_name}!</span>
                <span className="text-sm text-blue-600 capitalize">({user.role})</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Login
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );

  const renderHomePage = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {renderNavigation()}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Find the Best Driving Schools in Algeria
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with certified driving instructors across all 58 wilayas. 
            Learn theory, practice parking, and master road driving with professional guidance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setCurrentPage('find-schools');
                fetchDrivingSchools();
              }}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              🔍 Find Driving Schools
            </button>
            {user && user.role === 'manager' && (
              <button
                onClick={() => setCurrentPage('register-school')}
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
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
                className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                📊 My Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose EcoleDZ?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Complete Learning Path</h3>
              <p className="text-gray-600">Theory, Park, and Road courses designed to make you a confident driver</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Certified Instructors</h3>
              <p className="text-gray-600">Learn from qualified male and female instructors across Algeria</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Payment</h3>
              <p className="text-gray-600">Secure online payment with BaridiMob integration</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const renderFindSchools = () => (
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* State Filter */}
        <div className="mb-8">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by State (Wilaya)
            </label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                fetchDrivingSchools(e.target.value);
              }}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
            <div className="text-2xl mb-4">⏳</div>
            <p className="text-gray-600">Loading driving schools...</p>
          </div>
        )}

        {/* Driving Schools List */}
        <div className="grid gap-6">
          {!loading && drivingSchools.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏫</div>
              <p className="text-gray-600">No driving schools found in {selectedState || 'Algeria'}.</p>
              <p className="text-sm text-gray-500 mt-2">Try selecting a different state or check back later.</p>
            </div>
          ) : (
            drivingSchools.map((school) => (
              <div key={school.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">{school.name}</h3>
                      <p className="text-gray-600 mt-1">{school.address}, {school.state}</p>
                      <p className="text-gray-700 mt-2">{school.description}</p>
                      
                      <div className="flex items-center mt-3 space-x-4">
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1 text-gray-600">{school.rating.toFixed(1)} ({school.total_reviews} reviews)</span>
                        </div>
                        <div className="text-green-600 font-semibold">
                          {school.price.toLocaleString()} DZD
                        </div>
                      </div>
                      
                      <div className="flex items-center mt-2 text-gray-600">
                        <span>📞 {school.phone}</span>
                        <span className="ml-4">📧 {school.email}</span>
                      </div>
                    </div>
                    
                    <div className="ml-6 flex flex-col space-y-2">
                      <button
                        onClick={() => setSelectedSchool(school)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleEnroll(school.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Enroll Now
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
    <div className="min-h-screen bg-gray-50">
      {renderNavigation()}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Register Your Driving School</h2>
          
          <form onSubmit={handleSchoolSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  required
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({...schoolForm, name: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State (Wilaya)</label>
                <select
                  required
                  value={schoolForm.state}
                  onChange={(e) => setSchoolForm({...schoolForm, state: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select State</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                required
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({...schoolForm, address: e.target.value})}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={schoolForm.phone}
                  onChange={(e) => setSchoolForm({...schoolForm, phone: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={schoolForm.email}
                  onChange={(e) => setSchoolForm({...schoolForm, email: e.target.value})}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price (DZD)</label>
              <input
                type="number"
                required
                value={schoolForm.price}
                onChange={(e) => setSchoolForm({...schoolForm, price: e.target.value})}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                required
                rows={4}
                value={schoolForm.description}
                onChange={(e) => setSchoolForm({...schoolForm, description: e.target.value})}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Create Driving School
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!user) return null;

    return (
      <div className="min-h-screen bg-gray-50">
        {renderNavigation()}
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === 'student' && 'Student Dashboard'}
              {user.role === 'manager' && 'Manager Dashboard'}
              {user.role === 'teacher' && 'Teacher Dashboard'}
            </h1>
            <p className="text-gray-600 mt-2">Welcome back, {user.first_name}!</p>
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
              <div className="text-2xl mb-4">⏳</div>
              <p className="text-gray-600">Loading dashboard...</p>
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
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏫</div>
            <div>
              <p className="text-sm text-gray-600">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.total_enrollments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <p className="text-sm text-gray-600">Active Enrollments</p>
              <p className="text-2xl font-bold text-green-600">{dashboardData.active_enrollments}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💳</div>
            <div>
              <p className="text-sm text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-orange-600">{dashboardData.pending_payments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Enrollments</h3>
          
          {dashboardData.enrollments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🎓</div>
              <p className="text-gray-600">No enrollments found. Find a driving school to get started!</p>
              <button
                onClick={() => setCurrentPage('find-schools')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Find Schools
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {dashboardData.enrollments.map((enrollment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{enrollment.school.name}</h4>
                      <p className="text-gray-600">{enrollment.school.address}, {enrollment.school.state}</p>
                      <p className="text-sm text-gray-500">Enrolled: {new Date(enrollment.enrollment.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        enrollment.enrollment.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                        enrollment.enrollment.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {enrollment.enrollment.payment_status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Course Progress */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['theory', 'park', 'road'].map((courseType) => (
                      <div key={courseType} className="border rounded p-3">
                        <h5 className="font-medium text-gray-900 capitalize mb-2">{courseType} Course</h5>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderManagerDashboard = () => (
    <div className="space-y-6">
      {dashboardData.message ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🏫</div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">No Driving School Found</h3>
            <p className="text-blue-700 mb-4">{dashboardData.message}</p>
            <button
              onClick={() => setCurrentPage('register-school')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create Driving School
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* School Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">School Name</p>
                <p className="font-medium">{dashboardData.school.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{dashboardData.school.address}, {dashboardData.school.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium text-green-600">{dashboardData.school.price.toLocaleString()} DZD</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Rating</p>
                <p className="font-medium">⭐ {dashboardData.school.rating.toFixed(1)} ({dashboardData.school.total_reviews} reviews)</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">👥</div>
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.total_students}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <p className="text-sm text-gray-600">Active Students</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.active_students}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">⏳</div>
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-orange-600">{dashboardData.pending_approvals}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">👨‍🏫</div>
                <div>
                  <p className="text-sm text-gray-600">Teachers</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.total_teachers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Teachers */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Teachers</h3>
              {dashboardData.teachers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">👨‍🏫</div>
                  <p className="text-gray-600">No teachers added yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Add teachers to start offering courses.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.teachers.map((teacher, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">👨‍🏫</div>
                        <div>
                          <p className="font-medium">{teacher.user_id}</p>
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
          </div>
        </>
      )}
    </div>
  );

  const renderTeacherDashboard = () => (
    <div className="space-y-6">
      {dashboardData.message ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Teacher Profile Not Found</h3>
            <p className="text-blue-700">{dashboardData.message}</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">📚</div>
                <div>
                  <p className="text-sm text-gray-600">Assigned Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.assigned_courses}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">▶️</div>
                <div>
                  <p className="text-sm text-gray-600">Active Courses</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.active_courses}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="text-2xl mr-3">✅</div>
                <div>
                  <p className="text-sm text-gray-600">Completed Courses</p>
                  <p className="text-2xl font-bold text-blue-600">{dashboardData.completed_courses}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Courses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Courses</h3>
              {dashboardData.courses.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-gray-600">No courses assigned yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.courses.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900 capitalize">{course.course_type} Course</h4>
                          <p className="text-gray-600">Student: {course.student.first_name} {course.student.last_name}</p>
                          <p className="text-gray-600">School: {course.school.name}</p>
                          <p className="text-sm text-gray-500">
                            Progress: {course.completed_sessions} / {course.total_sessions} sessions
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.status === 'completed' ? 'bg-green-100 text-green-800' :
                          course.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSchoolDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedSchool.name}
          </h2>
          <button
            onClick={() => setSelectedSchool(null)}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">School Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{selectedSchool.address}, {selectedSchool.state}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-medium text-green-600">{selectedSchool.price.toLocaleString()} DZD</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Rating & Reviews</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-yellow-400 text-xl">⭐</span>
                <span className="ml-2 text-lg font-semibold">{selectedSchool.rating.toFixed(1)}</span>
              </div>
              <span className="text-gray-600">({selectedSchool.total_reviews} reviews)</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-700">{selectedSchool.description}</p>
          </div>

          {/* Teachers */}
          {selectedSchool.teachers && selectedSchool.teachers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructors</h3>
              <div className="grid gap-3">
                {selectedSchool.teachers.map((teacher, index) => (
                  <div key={teacher.id || index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{teacher.user ? `${teacher.user.first_name} ${teacher.user.last_name}` : teacher.user_id}</p>
                        <p className="text-sm text-gray-600">
                          👨‍🏫 Instructor
                        </p>
                        <p className="text-sm text-gray-600">Licensed Teacher</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="text-yellow-400">⭐</span>
                          <span className="ml-1 text-sm">{teacher.rating ? teacher.rating.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setSelectedSchool(null);
                handleEnroll(selectedSchool.id);
              }}
              className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Enroll Now
            </button>
            <button
              onClick={() => setSelectedSchool(null)}
              className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {authMode === 'login' ? 'Login' : 'Register'}
          </h2>
          <button
            onClick={() => setShowAuthModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={authData.email}
              onChange={(e) => setAuthData({...authData, email: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={authData.password}
              onChange={(e) => setAuthData({...authData, password: e.target.value})}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
            />
          </div>

          {authMode === 'register' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    type="text"
                    required
                    value={authData.first_name}
                    onChange={(e) => setAuthData({...authData, first_name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    type="text"
                    required
                    value={authData.last_name}
                    onChange={(e) => setAuthData({...authData, last_name: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  required
                  value={authData.phone}
                  onChange={(e) => setAuthData({...authData, phone: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  required
                  value={authData.address}
                  onChange={(e) => setAuthData({...authData, address: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={authData.date_of_birth}
                  onChange={(e) => setAuthData({...authData, date_of_birth: e.target.value})}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender</label>
                  <select
                    value={authData.gender}
                    onChange={(e) => setAuthData({...authData, gender: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={authData.role}
                    onChange={(e) => setAuthData({...authData, role: e.target.value})}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={authLoading}
            className={`w-full py-2 px-4 rounded-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              authLoading 
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {authLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {authMode === 'login' ? 'Logging in...' : 'Registering...'}
              </div>
            ) : (
              authMode === 'login' ? 'Login' : 'Register'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="text-blue-600 hover:text-blue-800"
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
    </div>
  );
}

export default App;
