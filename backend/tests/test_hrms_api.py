"""
HRMS API Tests for Prakura HRMS Admin Module
Tests: Authentication, Users, Employee Lifecycle, Departments, Designations
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prakura-hrms-admin.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@prakura.com"
ADMIN_PASSWORD = "password123"

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for admin user"""
    response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data
    return data["token"]

@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


class TestAuthentication:
    """Test authentication endpoints"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "SUPER_ADMIN"
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": "invalid@prakura.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_endpoint(self):
        """Test /api/health returns OK"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "OK"


class TestUserManagement:
    """Test user management endpoints"""
    
    def test_get_all_users(self, auth_headers):
        """Test GET /api/v1/admin/users returns user list"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
    
    def test_user_has_department_designation_fields(self, auth_headers):
        """Test users have department and designation fields"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/users", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Find Jane Smith who should have department and designation
        jane = next((u for u in data["users"] if u["email"] == "jane@prakura.com"), None)
        if jane:
            assert jane["departmentId"] is not None, "Jane should have departmentId"
            assert jane["designationId"] is not None, "Jane should have designationId"
            assert jane["department"]["name"] == "Engineering"
            assert jane["designation"]["title"] == "Software Engineer"
            assert jane["dateOfJoining"] is not None
    
    def test_create_user_with_doj_department_designation(self, auth_headers):
        """Test creating user with DOJ, Department, and Designation"""
        # First get departments and designations
        dept_resp = requests.get(f"{BASE_URL}/api/v1/admin/departments", headers=auth_headers)
        desig_resp = requests.get(f"{BASE_URL}/api/v1/admin/designations", headers=auth_headers)
        
        assert dept_resp.status_code == 200
        assert desig_resp.status_code == 200
        
        departments = dept_resp.json()
        designations = desig_resp.json()
        
        if departments and designations:
            dept_id = departments[0]["id"]
            desig_id = designations[0]["id"]
            
            # Create test user
            unique_email = f"TEST_user_{datetime.now().timestamp()}@prakura.com"
            user_data = {
                "email": unique_email,
                "password": "testpass123",
                "firstName": "TEST",
                "lastName": "User",
                "role": "EMPLOYEE",
                "dateOfJoining": "2025-01-15",
                "departmentId": dept_id,
                "designationId": desig_id
            }
            
            response = requests.post(f"{BASE_URL}/api/v1/admin/users", json=user_data, headers=auth_headers)
            assert response.status_code == 201, f"Create user failed: {response.text}"
            
            created_user = response.json()
            assert created_user["email"] == unique_email
            assert created_user["departmentId"] == dept_id
            assert created_user["designationId"] == desig_id
            assert "2025-01-15" in created_user["dateOfJoining"]
            
            # Cleanup - delete the test user
            user_id = created_user["id"]
            delete_resp = requests.delete(f"{BASE_URL}/api/v1/admin/users/{user_id}", headers=auth_headers)
            assert delete_resp.status_code == 200


class TestEmployeeLifecycle:
    """Test employee lifecycle endpoints"""
    
    def test_get_lifecycle_employees(self, auth_headers):
        """Test GET /api/v1/admin/lifecycle returns employees with tenure"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/lifecycle", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "employees" in data
        assert isinstance(data["employees"], list)
    
    def test_jane_smith_lifecycle_data(self, auth_headers):
        """Test Jane Smith shows correct lifecycle data"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/lifecycle", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Find Jane Smith
        jane = next((e for e in data["employees"] if e["email"] == "jane@prakura.com"), None)
        if jane:
            # Verify department
            assert jane["department"] is not None
            assert jane["department"]["name"] == "Engineering"
            
            # Verify designation
            assert jane["designation"] is not None
            assert jane["designation"]["title"] == "Software Engineer"
            
            # Verify DOJ is June 15, 2024
            assert jane["dateOfJoining"] is not None
            assert "2024-06-15" in jane["dateOfJoining"]
            
            # Verify tenure is calculated (should be about 1y 8m)
            assert jane["tenure"] is not None
            assert jane["tenure"] != "N/A"
            assert "1y" in jane["tenure"]  # Should be at least 1 year
    
    def test_employee_timeline(self, auth_headers):
        """Test getting employee timeline"""
        # First get an employee ID
        response = requests.get(f"{BASE_URL}/api/v1/admin/lifecycle", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if data["employees"]:
            employee_id = data["employees"][0]["id"]
            timeline_resp = requests.get(f"{BASE_URL}/api/v1/admin/lifecycle/{employee_id}", headers=auth_headers)
            assert timeline_resp.status_code == 200
            timeline_data = timeline_resp.json()
            assert "employee" in timeline_data
            assert "history" in timeline_data


class TestDepartments:
    """Test department endpoints"""
    
    def test_get_departments(self, auth_headers):
        """Test GET /api/v1/admin/departments returns department list"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/departments", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Should have Engineering department
        engineering = next((d for d in data if d["name"] == "Engineering"), None)
        assert engineering is not None


class TestDesignations:
    """Test designation endpoints"""
    
    def test_get_designations(self, auth_headers):
        """Test GET /api/v1/admin/designations returns designation list"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/designations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # Should have Software Engineer designation
        se = next((d for d in data if d["title"] == "Software Engineer"), None)
        assert se is not None
    
    def test_designation_linked_to_department(self, auth_headers):
        """Test designations have department information"""
        response = requests.get(f"{BASE_URL}/api/v1/admin/designations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        
        if data:
            designation = data[0]
            assert "departmentId" in designation
            assert "department" in designation
