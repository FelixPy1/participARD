import sys
sys.path.append('c:\\Users\\felix\\OneDrive\\Desktop\\participARD')
import app

client = app.app.test_client()

email = 'felixalexandersilverio@gmail.com'

# Reset attempts first using the DB connection from app
print("Resetting attempts for user to starts clean...")
conn = app.get_db_connection()
cursor = conn.cursor()
cursor.execute("UPDATE tblUsuarios SET IntentosFallidos = 0, BloqueadoHasta = NULL WHERE Email = ?", (email,))
conn.commit()

for i in range(1, 5):
    print(f"\n--- ATTEMPT #{i} ---")
    response = client.post('/api/auth/login', json={
        'email': email,
        'password': 'incorrect_password_here'
    })
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.get_json()}")

# Clean up reset
cursor.execute("UPDATE tblUsuarios SET IntentosFallidos = 0, BloqueadoHasta = NULL WHERE Email = ?", (email,))
conn.commit()
conn.close()
