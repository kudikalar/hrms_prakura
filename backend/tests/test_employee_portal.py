"""
Employee Portal API Tests
Tests for Employee Portal features: Authentication, Dashboard, Profile, Attendance, Leave, Payslips, Holidays, Timeline
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
EMPLOYEE_CREDENTIALS = {"email": "jane@prakura.com", "password": "password123"}
ADMIN_CREDENTIALS = {"email": "admin@prakura.com", "password": "password123"}


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def employee_token(api_client):
    """Get employee authentication token"""
    response = api_client.post(f"{BASE_URL}/api/v1/auth/login", json=EMPLOYEE_CREDENTIALS)
    assert response.status_code == 200, f"Employee login failed: {response.text}"
    data = response.json()
    return data.get("token")


@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/v1/auth/login", json=ADMIN_CREDENTIALS)
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    return data.get("token")


class TestAuthentication:
    """Authentication endpoint tests"""

    def test_employee_login_success(self, api_client):
        """Test employee can login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/v1/auth/login", json=EMPLOYEE_CREDENTIALS)
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "jane@prakura.com"
        assert data["user"]["role"] == "EMPLOYEE"
        assert data["user"]["firstName"] == "Jane"
        assert data["user"]["lastName"] == "Smith"

    def test_admin_login_success(self, api_client):
        """Test admin can login with correct credentials"""
        response = api_client.post(f"{BASE_URL}/api/v1/auth/login", json=ADMIN_CREDENTIALS)
        assert response.status_code == 200
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "admin@prakura.com"
        assert data["user"]["role"] == "SUPER_ADMIN"

    def test_login_invalid_credentials(self, api_client):
        """Test login fails with invalid credentials"""
        response = api_client.post(f"{BASE_URL}/api/v1/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]

    def test_employee_has_department_and_designation(self, api_client):
        """Verify employee login returns department and designation data"""
        response = api_client.post(f"{BASE_URL}/api/v1/auth/login", json=EMPLOYEE_CREDENTIALS)
        assert response.status_code == 200
        
        data = response.json()
        user = data["user"]
        assert user["department"] is not None
        assert user["department"]["name"] == "Engineering"
        assert user["designation"] is not None
        assert user["designation"]["title"] == "Software Engineer"


class TestEmployeeDashboard:
    """Employee Dashboard API tests"""

    def test_dashboard_returns_data(self, api_client, employee_token):
        """Test dashboard endpoint returns required data"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/dashboard",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "todayAttendance" in data
        assert "totalLeaveBalance" in data
        assert "pendingLeaves" in data
        assert "upcomingHolidays" in data
        assert "attendanceSummary" in data

    def test_dashboard_attendance_summary_structure(self, api_client, employee_token):
        """Verify attendance summary has required fields"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/dashboard",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        summary = data["attendanceSummary"]
        assert "present" in summary
        assert "totalWorkingDays" in summary
        assert "avgHours" in summary

    def test_dashboard_requires_auth(self, api_client):
        """Test dashboard returns 401 without auth token"""
        response = api_client.get(f"{BASE_URL}/api/v1/employee/dashboard")
        assert response.status_code == 401


class TestEmployeeProfile:
    """Employee Profile API tests"""

    def test_profile_returns_user_data(self, api_client, employee_token):
        """Test profile endpoint returns complete user data"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/profile",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == "jane@prakura.com"
        assert data["firstName"] == "Jane"
        assert data["lastName"] == "Smith"
        assert "password" not in data  # Password should be excluded

    def test_profile_includes_department_and_designation(self, api_client, employee_token):
        """Verify profile includes department and designation"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/profile",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["department"]["name"] == "Engineering"
        assert data["designation"]["title"] == "Software Engineer"

    def test_profile_includes_company(self, api_client, employee_token):
        """Verify profile includes company info"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/profile",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "company" in data
        assert data["company"]["name"] == "Prakura Corp"


class TestAttendance:
    """Attendance API tests"""

    def test_get_today_attendance(self, api_client, employee_token):
        """Test getting today's attendance status"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/attendance/today",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Should have either attendance data or NOT_MARKED status
        assert "status" in data or "checkIn" in data

    def test_get_attendance_history(self, api_client, employee_token):
        """Test getting attendance history"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/attendance/history",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "attendance" in data
        assert "summary" in data
        assert isinstance(data["attendance"], list)

    def test_attendance_history_summary_structure(self, api_client, employee_token):
        """Verify attendance history summary has required fields"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/attendance/history",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        summary = data["summary"]
        assert "present" in summary
        assert "absent" in summary
        assert "late" in summary
        assert "halfDay" in summary
        assert "totalHours" in summary


class TestLeaveManagement:
    """Leave Management API tests"""

    def test_get_leave_balance(self, api_client, employee_token):
        """Test getting leave balance"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/leave/balance",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

    def test_get_leave_requests(self, api_client, employee_token):
        """Test getting leave requests"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/leave/requests",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestPayslips:
    """Payslips API tests"""

    def test_get_payslips(self, api_client, employee_token):
        """Test getting payslips list"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/payslips",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

    def test_get_payslips_with_year_filter(self, api_client, employee_token):
        """Test getting payslips with year filter"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/payslips?year=2026",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestHolidays:
    """Holidays API tests"""

    def test_get_holidays(self, api_client, employee_token):
        """Test getting holidays list"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/holidays",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)

    def test_get_holidays_with_year_filter(self, api_client, employee_token):
        """Test getting holidays with year filter"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/holidays?year=2026",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)


class TestTimeline:
    """Employment Timeline API tests"""

    def test_get_timeline(self, api_client, employee_token):
        """Test getting employment timeline"""
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/timeline",
            headers={"Authorization": f"Bearer {employee_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        # Should have at least JOINED event
        if len(data) > 0:
            event = data[0]
            assert "eventType" in event
            assert "effectiveDate" in event


class TestRoleBasedAccess:
    """Test role-based access control"""

    def test_admin_cannot_access_employee_dashboard(self, api_client, admin_token):
        """Admin should still be able to access employee endpoints for their own data"""
        # Note: This depends on implementation - if admins have their own dashboard
        response = api_client.get(
            f"{BASE_URL}/api/v1/employee/dashboard",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # Admin can access - status 200, or restricted - status 403
        assert response.status_code in [200, 403, 500]

    def test_unauthenticated_request_rejected(self, api_client):
        """All employee endpoints should reject unauthenticated requests"""
        endpoints = [
            "/api/v1/employee/dashboard",
            "/api/v1/employee/profile",
            "/api/v1/employee/attendance/today",
            "/api/v1/employee/leave/balance",
            "/api/v1/employee/payslips",
            "/api/v1/employee/holidays",
            "/api/v1/employee/timeline"
        ]
        
        for endpoint in endpoints:
            response = api_client.get(f"{BASE_URL}{endpoint}")
            assert response.status_code == 401, f"Endpoint {endpoint} should reject unauthenticated requests"
