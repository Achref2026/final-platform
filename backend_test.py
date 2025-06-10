
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
    def __init__(self, base_url="https://489a6cd0-789c-4508-9d21-ba86cb418ff1.preview.emergentagent.com"):
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
                print(f"Response: {json.dumps(response_data, indent=2)}")
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
    
    def test_create_driving_school(self, school_data):
        """Test creating a new driving school (requires manager role)"""
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
    
    def test_get_driving_school_details(self, school_id):
        """Test retrieving details of a specific driving school"""
        success, response = self.run_test(
            f"Get Driving School Details (ID: {school_id})",
            "GET",
            f"driving-schools/{school_id}",
            200
        )
        
        if success and 'id' in response and response['id'] == school_id:
            print(f"✅ Retrieved details for driving school: {response['name']}")
            return True, response
        else:
            print(f"❌ Failed to retrieve driving school details for ID: {school_id}")
            return False, {}
    
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
            return True, response
        else:
            print("❌ Failed to retrieve student enrollments")
            return False, []
    
    def test_get_student_courses(self):
        """Test retrieving student courses"""
        success, response = self.run_test(
            "Get Student Courses",
            "GET",
            "courses/my",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} student courses")
            return True, response
        else:
            print("❌ Failed to retrieve student courses")
            return False, []
    
    def test_get_dashboard_data(self, role):
        """Test retrieving dashboard data for a specific role"""
        success, response = self.run_test(
            f"Get {role.capitalize()} Dashboard",
            "GET",
            f"dashboard/{role}",
            200
        )
        
        if success:
            print(f"✅ Retrieved {role} dashboard data")
            return True, response
        else:
            print(f"❌ Failed to retrieve {role} dashboard data")
            return False, {}
    
    def test_complete_payment(self, enrollment_id):
        """Test completing a payment for an enrollment"""
        form_data = {'enrollment_id': enrollment_id}
        
        # Set up headers without Content-Type (will be set by requests for form data)
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing Complete Payment for Enrollment (ID: {enrollment_id})...")
        
        try:
            url = f"{self.base_url}/api/payments/complete"
            response = requests.post(
                url,
                data=form_data,
                headers=headers
            )
            
            print(f"URL: {url}")
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response_data
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
            
    def test_complete_course_session(self, course_id):
        """Test completing a course session"""
        success, response = self.run_test(
            f"Complete Course Session (ID: {course_id})",
            "POST",
            f"courses/{course_id}/complete-session",
            200
        )
        
        if success:
            print(f"✅ Course session completed successfully")
            return True, response
        else:
            print("❌ Failed to complete course session")
            return False, {}
            
    def test_take_exam(self, course_id, score=75):
        """Test taking an exam for a course"""
        # Set up headers without Content-Type (will be set by requests for form data)
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing Take Exam for Course (ID: {course_id})...")
        
        try:
            url = f"{self.base_url}/api/courses/{course_id}/take-exam"
            form_data = {'score': score}
            response = requests.post(
                url,
                data=form_data,
                headers=headers
            )
            
            print(f"URL: {url}")
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response_data
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
            
    def test_add_teacher(self, email, can_teach_male=True, can_teach_female=True):
        """Test adding a teacher to a driving school"""
        teacher_data = {
            "email": email,
            "can_teach_male": can_teach_male,
            "can_teach_female": can_teach_female
        }
        
        success, response = self.run_test(
            f"Add Teacher (Email: {email})",
            "POST",
            "teachers/add",
            200,
            data=teacher_data
        )
        
        if success and 'id' in response:
            print(f"✅ Teacher added successfully with ID: {response['id']}")
            return True, response
        else:
            print("❌ Failed to add teacher")
            return False, {}
            
    def test_get_pending_teachers(self):
        """Test getting pending teachers for approval"""
        success, response = self.run_test(
            "Get Pending Teachers",
            "GET",
            "teachers/pending",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} pending teachers")
            return True, response
        else:
            print("❌ Failed to retrieve pending teachers")
            return False, []
            
    def test_approve_teacher(self, teacher_id):
        """Test approving a teacher"""
        success, response = self.run_test(
            f"Approve Teacher (ID: {teacher_id})",
            "POST",
            f"teachers/{teacher_id}/approve",
            200
        )
        
        if success:
            print(f"✅ Teacher approved successfully")
            return True
        else:
            print("❌ Failed to approve teacher")
            return False
            
    def test_get_pending_enrollments(self):
        """Test getting pending enrollments for approval"""
        success, response = self.run_test(
            "Get Pending Enrollments",
            "GET",
            "enrollments/pending",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} pending enrollments")
            return True, response
        else:
            print("❌ Failed to retrieve pending enrollments")
            return False, []
            
    def test_approve_enrollment(self, enrollment_id):
        """Test approving an enrollment"""
        success, response = self.run_test(
            f"Approve Enrollment (ID: {enrollment_id})",
            "POST",
            f"enrollments/{enrollment_id}/approve",
            200
        )
        
        if success:
            print(f"✅ Enrollment approved successfully")
            return True
        else:
            print("❌ Failed to approve enrollment")
            return False
            
    def test_reject_enrollment(self, enrollment_id, reason="Test rejection"):
        """Test rejecting an enrollment"""
        # Set up headers without Content-Type (will be set by requests for form data)
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing Reject Enrollment (ID: {enrollment_id})...")
        
        try:
            url = f"{self.base_url}/api/enrollments/{enrollment_id}/reject"
            form_data = {'reason': reason}
            response = requests.post(
                url,
                data=form_data,
                headers=headers
            )
            
            print(f"URL: {url}")
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                return True, response_data
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
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
        # Create a simple test file
        file_content = b"This is a test file for document upload API testing."
        files = {
            'file': ('test_document.txt', BytesIO(file_content), 'text/plain')
        }
        
        # Set up headers without Content-Type (will be set by requests for multipart)
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        print(f"\n🔍 Testing Document Upload ({document_type})...")
        
        try:
            url = f"{self.base_url}/api/documents/upload"
            response = requests.post(
                url,
                files=files,
                data={'document_type': document_type},
                headers=headers
            )
            
            print(f"URL: {url}")
            print(f"Status Code: {response.status_code}")
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"Response: {response.text}")
            
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.document_id = response_data.get('document_id')
                return True, response_data
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}
    
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
    
    def test_get_user_documents(self, user_id):
        """Test retrieving documents for a specific user (manager/teacher only)"""
        success, response = self.run_test(
            f"Get User Documents (ID: {user_id})",
            "GET",
            f"documents/{user_id}",
            200
        )
        
        if success:
            print(f"✅ Retrieved {len(response)} documents for user")
            return True, response
        else:
            print("❌ Failed to retrieve user documents")
            return False, []
    
    def test_verify_document(self, document_id):
        """Test verifying a document (manager only)"""
        success, response = self.run_test(
            f"Verify Document (ID: {document_id})",
            "POST",
            f"documents/{document_id}/verify",
            200
        )
        
        if success:
            print(f"✅ Document verified successfully")
            return True
        else:
            print("❌ Failed to verify document")
            return False

def test_existing_email_registration(tester):
    """Test registration with an existing email (should fail with 400)"""
    test_user_data = {
        "email": "student@example.com",  # Using the sample data email
        "password": "testpass123",
        "first_name": "Test",
        "last_name": "User",
        "phone": "1234567890",
        "address": "Test Address",
        "date_of_birth": "1990-01-01",
        "gender": "male",
        "role": "student"
    }
    
    # Try to register with an email that should already exist - should fail with 400
    success, response = tester.run_test(
        "Duplicate Email Registration",
        "POST",
        "auth/register",
        400,  # Expecting 400 Bad Request
        data=test_user_data
    )
    
    if success:
        print("✅ Duplicate email registration correctly rejected with 400 status")
        if 'detail' in response and response['detail'] == "Email already registered":
            print("✅ Correct error message: 'Email already registered'")
        else:
            print("❌ Expected error message 'Email already registered' not found")
            success = False
    else:
        print("❌ Duplicate email registration test failed")
    
    return success

def test_new_email_registration(tester, role="student"):
    """Test registration with a new email (should succeed)"""
    random_suffix = f"{random.randint(1000, 9999)}"
    test_user_data = {
        "email": f"test{role}{random_suffix}@example.com",
        "password": "testpass123",
        "first_name": f"Test{role.capitalize()}",
        "last_name": f"User{random_suffix}",
        "phone": "1234567890",
        "address": "Test Address",
        "date_of_birth": "1990-01-01",
        "gender": "male" if random.random() > 0.5 else "female",
        "role": role
    }
    
    success, response = tester.run_test(
        f"New {role.capitalize()} Registration",
        "POST",
        "auth/register",
        200,
        data=test_user_data
    )
    
    if success and 'access_token' in response:
        tester.token = response['access_token']
        tester.user_data = response['user']
        print(f"✅ New {role} registered successfully with ID: {response['user']['id']}")
        return True, test_user_data
    else:
        print(f"❌ New {role} registration failed")
        return False, None

def test_manager_workflow(tester):
    """Test the complete manager workflow"""
    print("\n" + "="*50)
    print("TESTING MANAGER WORKFLOW")
    print("="*50)
    
    # 1. Login as manager
    if not tester.test_login("manager@example.com", "testpass123"):
        # If login fails, try to register a new manager
        success, manager_data = test_new_email_registration(tester, "manager")
        if not success:
            print("❌ Could not login or register as manager")
            return False
    
    # 2. Get manager dashboard (might be empty if no school yet)
    tester.test_get_dashboard_data("manager")
    
    # 3. Create a driving school
    school_data = {
        "name": f"Test Driving School {tester.test_timestamp}",
        "address": "123 Test Street",
        "state": "Alger",
        "phone": "0555123456",
        "email": f"school{tester.test_timestamp}@example.com",
        "description": "A test driving school for API testing",
        "price": 25000.0
    }
    
    if not tester.test_create_driving_school(school_data):
        print("❌ Manager workflow failed at school creation")
        return False
    
    # 4. Get school details
    if tester.created_school_id:
        tester.test_get_driving_school_details(tester.created_school_id)
    
    # 5. Add a teacher to the school
    teacher_email = f"teacher{tester.test_timestamp}@example.com"
    success, teacher_data = tester.test_add_teacher(teacher_email)
    
    # 6. Get pending teachers
    success, pending_teachers = tester.test_get_pending_teachers()
    
    # 7. Get pending enrollments
    success, pending_enrollments = tester.test_get_pending_enrollments()
    
    # 8. Approve a teacher if any are pending
    if pending_teachers and len(pending_teachers) > 0:
        teacher_id = pending_teachers[0]['id']
        tester.test_approve_teacher(teacher_id)
    
    # 9. Approve an enrollment if any are pending
    if pending_enrollments and len(pending_enrollments) > 0:
        enrollment_id = pending_enrollments[0]['id']
        tester.test_approve_enrollment(enrollment_id)
    
    # 10. Test document verification if we have a document ID
    if tester.document_id:
        tester.test_verify_document(tester.document_id)
    
    # 11. Get manager dashboard again (should now have updated data)
    tester.test_get_dashboard_data("manager")
    
    print("✅ Manager workflow completed successfully")
    return True

def test_student_workflow(tester):
    """Test the complete student workflow"""
    print("\n" + "="*50)
    print("TESTING STUDENT WORKFLOW")
    print("="*50)
    
    # 1. Login as student
    if not tester.test_login("student@example.com", "testpass123"):
        # If login fails, try to register a new student
        success, student_data = test_new_email_registration(tester, "student")
        if not success:
            print("❌ Could not login or register as student")
            return False
    
    # 2. Get student dashboard
    tester.test_get_dashboard_data("student")
    
    # 3. Get available driving schools
    success, schools = tester.test_get_driving_schools()
    if not success or not schools:
        print("❌ No driving schools available for enrollment")
        return False
    
    # 4. Enroll in a driving school
    school_id = schools[0]['id']
    if not tester.test_student_enrollment(school_id):
        print("❌ Student workflow failed at enrollment")
        return False
    
    # 5. Get student enrollments
    success, enrollments = tester.test_get_student_enrollments()
    
    # 6. Complete payment (if enrollment was successful)
    if tester.enrollment_id:
        tester.test_complete_payment(tester.enrollment_id)
    
    # 7. Upload required documents
    for doc_type in ["profile_photo", "id_card", "medical_certificate"]:
        tester.test_upload_document(doc_type)
        time.sleep(1)  # Add a small delay between uploads
    
    # 8. Get student documents
    tester.test_get_my_documents()
    
    # 9. Get student enrollments again (should now show pending approval)
    tester.test_get_student_enrollments()
    
    # 10. Get student courses
    success, courses = tester.test_get_student_courses()
    if success and courses:
        # Store a course ID for later testing
        tester.course_id = courses[0]['id']
    
    # 11. Get student dashboard again (should now have enrollment data)
    tester.test_get_dashboard_data("student")
    
    print("✅ Student workflow completed successfully")
    return True

def test_teacher_workflow(tester):
    """Test the complete teacher workflow"""
    print("\n" + "="*50)
    print("TESTING TEACHER WORKFLOW")
    print("="*50)
    
    # 1. Login as teacher
    if not tester.test_login("teacher@example.com", "testpass123"):
        # If login fails, try to register a new teacher
        success, teacher_data = test_new_email_registration(tester, "teacher")
        if not success:
            print("❌ Could not login or register as teacher")
            return False
    
    # 2. Get teacher dashboard
    tester.test_get_dashboard_data("teacher")
    
    # 3. Test video room creation if we have a course ID
    if tester.course_id:
        tester.test_create_video_room(tester.course_id)
        tester.test_get_course_video_rooms(tester.course_id)
        
        # Test joining a session if one was created
        if tester.session_id:
            tester.test_join_video_session(tester.session_id)
    
    print("✅ Teacher workflow completed successfully")
    return True

def test_video_api(tester):
    """Test the video calling APIs"""
    print("\n" + "="*50)
    print("TESTING VIDEO CALLING APIs")
    print("="*50)
    
    # Need to be logged in as a teacher or manager to create rooms
    if not tester.token or tester.user_data['role'] not in ['teacher', 'manager']:
        if not tester.test_login("teacher@example.com", "testpass123"):
            print("❌ Could not login as teacher for video API testing")
            return False
    
    # Need a course ID to test with
    if not tester.course_id:
        # Get student courses to find a course ID
        if tester.user_data['role'] == 'student':
            success, courses = tester.test_get_student_courses()
            if success and courses:
                tester.course_id = courses[0]['id']
        else:
            # For teacher/manager, we need to find a course differently
            # This is simplified for testing purposes
            print("⚠️ No course ID available for video API testing")
            return False
    
    # Test video room creation
    success, room_data = tester.test_create_video_room(tester.course_id)
    if not success:
        print("❌ Failed to create video room")
        return False
    
    # Test getting rooms for a course
    tester.test_get_course_video_rooms(tester.course_id)
    
    # Test joining a session
    if tester.session_id:
        tester.test_join_video_session(tester.session_id)
    
    print("✅ Video API tests completed successfully")
    return True

def test_document_api(tester):
    """Test the document upload APIs"""
    print("\n" + "="*50)
    print("TESTING DOCUMENT UPLOAD APIs")
    print("="*50)
    
    # Need to be logged in to upload documents
    if not tester.token:
        if not tester.test_login("student@example.com", "testpass123"):
            print("❌ Could not login for document API testing")
            return False
    
    # Test document upload
    success, doc_data = tester.test_upload_document("profile_photo")
    if not success:
        print("❌ Failed to upload document")
        return False
    
    # Test getting my documents
    tester.test_get_my_documents()
    
    # If manager, test document verification
    if tester.user_data['role'] == 'manager' and tester.document_id:
        tester.test_verify_document(tester.document_id)
    
    # If manager/teacher, test getting another user's documents
    if tester.user_data['role'] in ['manager', 'teacher']:
        # For testing, we'd need a student ID
        # This is simplified for testing purposes
        print("⚠️ Skipping test_get_user_documents as we need a specific user ID")
    
    print("✅ Document API tests completed successfully")
    return True

def main():
    tester = AlgerianDrivingSchoolTester()
    
    # Test basic endpoints
    print("\n" + "="*50)
    print("TESTING BASIC ENDPOINTS")
    print("="*50)
    tester.test_health_endpoint()
    tester.test_get_states()
    
    # Test authentication
    print("\n" + "="*50)
    print("TESTING AUTHENTICATION")
    print("="*50)
    test_existing_email_registration(tester)
    
    # Test role-specific workflows
    test_manager_workflow(tester)
    test_student_workflow(tester)
    test_teacher_workflow(tester)
    
    # Test new APIs specifically
    test_video_api(tester)
    test_document_api(tester)
    
    # Print test results
    print("\n" + "="*50)
    print(f"📊 SUMMARY: Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("="*50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
