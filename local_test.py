
import requests
import sys
from datetime import datetime
import uuid
import time
import random

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

def main():
    tester = AlgerianDrivingSchoolTester()
    
    # Test basic endpoints
    print("\n" + "="*50)
    print("TESTING BASIC ENDPOINTS")
    print("="*50)
    tester.test_health_endpoint()
    tester.test_get_states()
    
    # Print test results
    print("\n" + "="*50)
    print(f"📊 SUMMARY: Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print("="*50)
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
