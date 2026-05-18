import requests

try:
    print("Testing /api/activities...")
    res = requests.get('http://127.0.0.1:5000/api/activities')
    print(f"Status: {res.status_code}")
    print(f"Length: {len(res.json())}")
    print(f"Sample: {res.json()[:2] if isinstance(res.json(), list) else res.json()}")
except Exception as e:
    print(f"Error testing activities: {e}")

try:
    print("\nTesting /api/provinces...")
    res = requests.get('http://127.0.0.1:5000/api/provinces')
    print(f"Status: {res.status_code}")
    print(f"Length: {len(res.json())}")
    print(f"Sample: {res.json()[:2] if isinstance(res.json(), list) else res.json()}")
except Exception as e:
    print(f"Error testing provinces: {e}")
