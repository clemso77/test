#!/usr/bin/env python3
"""
Integration test for the prediction system.
This script tests the full integration between the Flask API and the backend.
"""

import requests
import json
import sys

# Test configurations
FLASK_API_URL = "http://localhost:5000"
BACKEND_API_URL = "http://localhost:3000"

def test_flask_health():
    """Test Flask API health endpoint"""
    print("Testing Flask API health...")
    try:
        response = requests.get(f"{FLASK_API_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Flask API is healthy")
        return True
    except Exception as e:
        print(f"✗ Flask API health check failed: {e}")
        return False

def test_flask_prediction():
    """Test Flask API prediction endpoint"""
    print("\nTesting Flask API prediction...")
    test_data = {
        "ROUTE": 91,
        "LOCAL_TIME": "08:00:00",
        "WEEK_DAY": "Monday",
        "INCIDENT": "Safety",
        "LOCAL_MONTH": 6,
        "LOCAL_DAY": 15,
        "TEMP": 20.0,
        "DEW_POINT_TEMP": 15.0,
        "HUMIDEX": 22.0,
        "PRECIP_AMOUNT": 0.0,
        "RELATIVE_HUMIDITY": 60.0,
        "STATION_PRESSURE": 101.3,
        "VISIBILITY": 20.0,
        "WEATHER_ENG_DESC": "Clear",
        "WIND_DIRECTION": 90.0,
        "WIND_SPEED": 5.0
    }
    
    try:
        response = requests.post(
            f"{FLASK_API_URL}/predict",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "prediction" in data
        assert isinstance(data["prediction"], (int, float))
        print(f"✓ Flask API prediction successful: {data['prediction']:.2f} minutes")
        return True
    except Exception as e:
        print(f"✗ Flask API prediction failed: {e}")
        return False

def test_backend_prediction():
    """Test Backend API prediction endpoint"""
    print("\nTesting Backend API prediction...")
    test_data = {
        "LOCAL_TIME": "14:30:00",
        "WEEK_DAY": "Tuesday",
        "INCIDENT": "External",
        "LOCAL_MONTH": 1,
        "LOCAL_DAY": 20,
        "TEMP": 5.0,
        "DEW_POINT_TEMP": 2.0,
        "HUMIDEX": 3.5,
        "PRECIP_AMOUNT": 2.5,
        "RELATIVE_HUMIDITY": 80.0,
        "STATION_PRESSURE": 100.5,
        "VISIBILITY": 10.0,
        "WEATHER_ENG_DESC": "Rain",
        "WIND_DIRECTION": 180.0,
        "WIND_SPEED": 15.0
    }
    
    try:
        response = requests.post(
            f"{BACKEND_API_URL}/lines/91/prediction",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "predictedDelay" in data
        assert data["lineId"] == "91"
        assert data["unit"] == "minutes"
        print(f"✓ Backend API prediction successful: {data['predictedDelay']:.2f} minutes for line {data['lineId']}")
        return True
    except Exception as e:
        print(f"✗ Backend API prediction failed: {e}")
        return False

def test_missing_fields():
    """Test that API properly validates required fields"""
    print("\nTesting validation of missing fields...")
    incomplete_data = {
        "LOCAL_TIME": "08:00:00",
        "WEEK_DAY": "Monday"
        # Missing other required fields
    }
    
    try:
        response = requests.post(
            f"{FLASK_API_URL}/predict",
            json=incomplete_data,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] == False
        assert "error" in data
        print(f"✓ Validation working correctly: {data['error']}")
        return True
    except Exception as e:
        print(f"✗ Validation test failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("=" * 60)
    print("PREDICTION SYSTEM INTEGRATION TESTS")
    print("=" * 60)
    
    results = []
    results.append(test_flask_health())
    results.append(test_flask_prediction())
    results.append(test_backend_prediction())
    results.append(test_missing_fields())
    
    print("\n" + "=" * 60)
    passed = sum(results)
    total = len(results)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n✓ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n✗ {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    main()
