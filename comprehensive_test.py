
import requests
import sys
import json
from datetime import datetime
import uuid
import time
import random
import os
from io import BytesIO

class AlgerianDrivingSchoolTester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_data = None
        self.test_timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        self.created_school_id = None
        self.enrollment_id = None
        self.course_id = None
        self.session_id = None
        self.document_id = None
        self.quiz_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            
            print(f"URL: {url}")
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {response_data}")
            except:
                print(f"Response: {response.text}")

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")

            try:
                return success, response.json()
            except:
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test the health endpoint"""
        success, response = self.run_test(
            "Health Endpoint",
            "GET",
            "health",
            200
        )
        return success
    
    def test_get_states(self):
        """Test getting the list of Algerian states"""
        success, response = self.run_test(
            "Get Algerian States",
            "GET",
            "states",
            200
        )
        
        if success and 'states' in response and len(response['states']) == 58:
            print(f"✅ Successfully retrieved {len(response['states'])} Algerian states")
        else:
            print("❌ Failed to retrieve all 58 Algerian states")
            success = False
            
        return success

    def test_register_user(self, role="student"):
        """Test user registration"""
        random_suffix = f"{random.randint(1000, 9999)}"
        user_data = {
            "email": f"test{role}{random_suffix}@example.com",
            "password": "testpass123",
            "first_name": f"Test{role.capitalize()}",
            "last_name": f"User{random_suffix}",
            "phone": "1234567890",
            "address": "Test Address",
            "date_of_birth": "1990-01-01",
            "gender": "male" if random.random() > 0.5 else "female",
            "state": "Alger"
        }
        
        success, response = self.run_test(
            f"Register {role.capitalize()} User",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"✅ User registered successfully with ID: {response['user']['id']}")
            return True, user_data
        else:
            print(f"❌ User registration failed")
            return False, None

    def test_login(self, email, password):
        """Test user login"""
        login_data = {
            "email": email,
            "password": password
        }
        
        success, response = self.run_test(
            f"Login as {email}",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"✅ Login successful for {email} with role: {response['user']['role']}")
            return True
        else:
            print(f"❌ Login failed for {email}")
            return False

    def test_get_driving_schools(self, state=None):
        """Test retrieving driving schools with optional state filter"""
        endpoint = "driving-schools" if state is None else f"driving-schools?state={state}"
        
        success, response = self.run_test(
            f"Get Driving Schools{' in ' + state if state else ''}",
            "GET",
            endpoint,
            200
        )
        
        if success and 'schools' in response:
            print(f"✅ Retrieved {len(response['schools'])} driving schools{' in ' + state if state else ''}")
            return True, response['schools']
        else:
            print(f"❌ Failed to retrieve driving schools{' in ' + state if state else ''}")
            return False, []

    def test_create_driving_school(self):
        """Test creating a new driving school (requires manager role)"""
        school_data = {
            "name": f"Test Driving School {self.test_timestamp}",
            "address": "123 Test Street",
            "state": "Alger",
            "phone": "0555123456",
            "email": f"school{self.test_timestamp}@example.com",
            "description": "A test driving school for API testing",
            "price": 25000.0
        }
        
        success, response = self.run_test(
            "Create Driving School",
            "POST",
            "driving-schools",
            200,
            data=school_data
        )
        
        if success and 'id' in response:
            self.created_school_id = response['id']
            print(f"✅ Driving school created successfully with ID: {response['id']}")
            return True
        else:
            print("❌ Failed to create driving school")
            return False

    def test_student_enrollment(self, school_id):
        """Test student enrollment in a driving school"""
        enrollment_data = {
            "school_id": school_id
        }
        
        success, response = self.run_test(
            f"Enroll in Driving School (ID: {school_id})",
            "POST",
            "enrollments",
            200,
            data=enrollment_data
        )
        
        if success and 'enrollment_id' in response:
            self.enrollment_id = response['enrollment_id']
            print(f"✅ Enrollment successful with ID: {response['enrollment_id']}")
            return True
        else:
            print(f"❌ Failed to enroll in driving school")
            return False

    def test_get_student_enrollments(self):
        """Test retrieving student enrollments"""
        success, response = self.run_test(
            "Get Student Enrollments",
            "GET",
            "enrollments/my",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} student enrollments")
            # If we have enrollments, get the first course ID for later tests
            if len(response) > 0 and 'courses' in response[0] and len(response[0]['courses']) > 0:
                self.course_id = response[0]['courses'][0]['id']
                print(f"✅ Found course ID: {self.course_id}")
            return True, response
        else:
            print("❌ Failed to retrieve student enrollments")
            return False, []

    def test_create_sample_quizzes(self):
        """Test creating sample quizzes for theory courses"""
        success, response = self.run_test(
            "Create Sample Quizzes",
            "POST",
            "demo/create-sample-quizzes",
            200
        )
        
        if success and 'quizzes_created' in response:
            print(f"✅ Created {response['quizzes_created']} sample quizzes")
            return True
        else:
            print("❌ Failed to create sample quizzes")
            return False

    def test_get_course_quizzes(self, course_id):
        """Test getting quizzes for a course"""
        success, response = self.run_test(
            f"Get Quizzes for Course (ID: {course_id})",
            "GET",
            f"quizzes/course/{course_id}",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} quizzes for course")
            if len(response) > 0:
                self.quiz_id = response[0]['id']
                print(f"✅ Found quiz ID: {self.quiz_id}")
            return True, response
        else:
            print("❌ Failed to retrieve quizzes for course")
            return False, []

    def test_submit_quiz_attempt(self, quiz_id):
        """Test submitting a quiz attempt"""
        # Create random answers for the quiz
        answers = {}
        for i in range(10):  # Assuming up to 10 questions
            answers[str(i)] = random.choice(["No entry", "Stop", "Give way", "Speed limit"])
        
        success, response = self.run_test(
            f"Submit Quiz Attempt (ID: {quiz_id})",
            "POST",
            "quiz-attempts",
            200,
            data={
                "quiz_id": quiz_id,
                "answers": answers
            }
        )
        
        if success and 'attempt_id' in response:
            print(f"✅ Quiz attempt submitted successfully with score: {response['score']}")
            return True, response
        else:
            print("❌ Failed to submit quiz attempt")
            return False, {}

    def test_create_video_room(self, course_id):
        """Test creating a video room for a course"""
        room_data = {
            "room_name": f"test-room-{self.test_timestamp}",
            "course_id": course_id,
            "privacy": "private",
            "properties": {
                "enable_screenshare": True,
                "enable_chat": True,
                "start_video_off": False,
                "start_audio_off": False,
                "max_participants": 5
            }
        }
        
        success, response = self.run_test(
            f"Create Video Room for Course (ID: {course_id})",
            "POST",
            "video/create-room",
            200,
            data=room_data
        )
        
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            print(f"✅ Video room created successfully with session ID: {response['session_id']}")
            return True, response
        else:
            print("❌ Failed to create video room")
            return False, {}

    def test_get_course_video_rooms(self, course_id):
        """Test getting all video rooms for a course"""
        success, response = self.run_test(
            f"Get Video Rooms for Course (ID: {course_id})",
            "GET",
            f"video/rooms/{course_id}",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} video rooms for course")
            return True, response
        else:
            print("❌ Failed to retrieve video rooms for course")
            return False, []

    def test_join_video_session(self, session_id):
        """Test joining a video session"""
        success, response = self.run_test(
            f"Join Video Session (ID: {session_id})",
            "POST",
            f"video/join/{session_id}",
            200
        )
        
        if success and 'room_url' in response:
            print(f"✅ Successfully joined video session with URL: {response['room_url']}")
            return True, response
        else:
            print("❌ Failed to join video session")
            return False, {}

    def test_upload_document(self, document_type="profile_photo"):
        """Test uploading a document"""
        # This would require multipart form data, which is more complex
        # For simplicity, we'll just log that this would need to be tested manually
        print(f"⚠️ Document upload for {document_type} would need to be tested manually or with a more complex test setup")
        return True, {}

    def test_get_my_documents(self):
        """Test retrieving current user's documents"""
        success, response = self.run_test(
            "Get My Documents",
            "GET",
            "documents/my",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} documents")
            return True, response
        else:
            print("❌ Failed to retrieve documents")
            return False, []

def test_student_workflow(tester):
    """Test the complete student workflow"""
    print("\n" + "="*50)
    print("TESTING STUDENT WORKFLOW")
    print("="*50)
    
    # 1. Register as a student
    success, student_data = tester.test_register_user("student")
    if not success:
        print("❌ Could not register as student")
        return False
    
    # 2. Get available driving schools
    success, schools = tester.test_get_driving_schools()
    if not success or not schools:
        print("❌ No driving schools available for enrollment")
        return False
    
    # 3. Enroll in a driving school
    school_id = schools[0]['id']
    if not tester.test_student_enrollment(school_id):
        print("❌ Student workflow failed at enrollment")
        return False
    
    # 4. Get student enrollments
    success, enrollments = tester.test_get_student_enrollments()
    
    # 5. Create sample quizzes
    tester.test_create_sample_quizzes()
    
    # 6. If we have a course ID, test quiz and video features
    if tester.course_id:
        # Test quizzes
        success, quizzes = tester.test_get_course_quizzes(tester.course_id)
        if success and tester.quiz_id:
            tester.test_submit_quiz_attempt(tester.quiz_id)
        
        # Test video rooms (this might fail if not a teacher)
        tester.test_get_course_video_rooms(tester.course_id)
    
    # 7. Test document features
    tester.test_get_my_documents()
    
    print("✅ Student workflow completed successfully")
    return True

def test_teacher_workflow(tester):
    """Test the complete teacher workflow"""
    print("\n" + "="*50)
    print("TESTING TEACHER WORKFLOW")
    print("="*50)
    
    # 1. Register as a teacher
    success, teacher_data = tester.test_register_user("teacher")
    if not success:
        print("❌ Could not register as teacher")
        return False
    
    # 2. If we have a course ID from previous tests, try to create a video room
    if tester.course_id:
        success, room_data = tester.test_create_video_room(tester.course_id)
        if success and tester.session_id:
            tester.test_join_video_session(tester.session_id)
    else:
        print("⚠️ No course ID available for video room testing")
    
    print("✅ Teacher workflow completed successfully")
    return True

def test_manager_workflow(tester):
    """Test the complete manager workflow"""
    print("\n" + "="*50)
    print("TESTING MANAGER WORKFLOW")
    print("="*50)
    
    # 1. Register as a manager
    success, manager_data = tester.test_register_user("manager")
    if not success:
        print("❌ Could not register as manager")
        return False
    
    # 2. Create a driving school
    if not tester.test_create_driving_school():
        print("❌ Manager workflow failed at school creation")
        return False
    
    print("✅ Manager workflow completed successfully")
    return True

def main():
    tester = AlgerianDrivingSchoolTester()
    
    # Test basic endpoints
    print("\n" + "="*50)
    print("TESTING BASIC ENDPOINTS")
    print("="*50)
    tester.test_health_endpoint()
    tester.test_get_states()
    
    # Test role-specific workflows
    test_manager_workflow(tester)
    test_student_workflow(tester)
    test_teacher_workflow(tester)
    
    # Print test results
    print("\n" + "="*50)
    print(f"📊 SUMMARY: Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("="*50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
