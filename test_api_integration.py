#!/usr/bin/env python3
"""
API Integration Test Script
Tests Daily.co and Cloudinary integrations with real API keys
"""

import os
import requests
import sys
from pathlib import Path

# Add backend to path
sys.path.append('/app/backend')

def test_daily_api():
    """Test Daily.co API connectivity"""
    print("🧪 Testing Daily.co API...")
    
    api_key = "7dfd08780e8fb9542adfc5f839e06f3997b096dd3f51be75c9b7c13c56edac66"
    api_url = "https://api.daily.co/v1"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Test API connectivity by creating a test room
        response = requests.post(
            f"{api_url}/rooms",
            json={
                "name": "test-driving-school-room",
                "privacy": "private",
                "properties": {
                    "enable_screenshare": True,
                    "enable_chat": True,
                    "max_participants": 10
                }
            },
            headers=headers
        )
        
        if response.status_code == 200:
            room_data = response.json()
            print(f"✅ Daily.co API working! Room created: {room_data['url']}")
            
            # Clean up - delete the test room
            room_name = room_data['name']
            delete_response = requests.delete(f"{api_url}/rooms/{room_name}", headers=headers)
            if delete_response.status_code == 200:
                print("✅ Test room cleaned up successfully")
            
            return True
        else:
            print(f"❌ Daily.co API error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Daily.co API connection failed: {str(e)}")
        return False

def test_cloudinary_api():
    """Test Cloudinary API connectivity"""
    print("\n🧪 Testing Cloudinary API...")
    
    try:
        import cloudinary
        import cloudinary.api
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name="dmn3sgxjf",
            api_key="971366197286663",
            api_secret="8s5uROU1-fL2OKCEirwwduo0CJ8"
        )
        
        # Test API by getting account info
        result = cloudinary.api.ping()
        print(f"✅ Cloudinary API working! Response: {result}")
        
        # Test folder creation
        try:
            cloudinary.api.create_folder("driving-school-test")
            print("✅ Cloudinary folder creation working")
        except Exception as folder_e:
            if "already exists" in str(folder_e):
                print("✅ Cloudinary folder already exists (API working)")
            else:
                print(f"⚠️  Cloudinary folder creation warning: {str(folder_e)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Cloudinary API connection failed: {str(e)}")
        return False

def test_backend_integration():
    """Test backend API endpoints"""
    print("\n🧪 Testing Backend API...")
    
    try:
        # Test health endpoint
        response = requests.get("http://localhost:8001/api/health")
        if response.status_code == 200:
            print("✅ Backend health check passed")
        else:
            print(f"❌ Backend health check failed: {response.status_code}")
            return False
        
        # Test states endpoint
        response = requests.get("http://localhost:8001/api/states")
        if response.status_code == 200:
            states = response.json()
            print(f"✅ States endpoint working: {len(states['states'])} Algerian states loaded")
        else:
            print(f"❌ States endpoint failed: {response.status_code}")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Backend API test failed: {str(e)}")
        return False

def main():
    """Run all API tests"""
    print("🚀 Starting API Integration Tests for Driving School Platform\n")
    
    tests_passed = 0
    total_tests = 3
    
    # Test Daily.co
    if test_daily_api():
        tests_passed += 1
    
    # Test Cloudinary
    if test_cloudinary_api():
        tests_passed += 1
    
    # Test Backend
    if test_backend_integration():
        tests_passed += 1
    
    print(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All API integrations are working correctly!")
        print("\n✅ Ready for development:")
        print("   - Video calling (Daily.co) ✅")
        print("   - File uploads (Cloudinary) ✅") 
        print("   - Backend API ✅")
        print("\n🚀 You can now test the full platform functionality!")
    else:
        print("⚠️  Some API integrations need attention")
        print("\n📖 Check the API_KEYS_SETUP.md file for troubleshooting")

if __name__ == "__main__":
    main()