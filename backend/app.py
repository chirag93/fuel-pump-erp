from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import uuid
import requests
import hashlib
import secrets

app = Flask(__name__)
# Update CORS configuration to be more permissive for development
CORS(app)  # Enable CORS for all routes without restriction during development

# Supabase API details
SUPABASE_URL = os.environ.get('SUPABASE_URL', "https://svuritdhlgaonfefphkz.supabase.co")
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2dXJpdGRobGdhb25mZWZwaGt6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMzIxOTQsImV4cCI6MjA1NjkwODE5NH0.vJ7t3i8QEA0pJLPG5j78u4qOt4eF_KoNC8_VOx_OoMo")

# Supabase API helper functions
def supabase_get(table, params=None):
    """GET data from Supabase table"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    return []

def supabase_post(table, data):
    """POST data to Supabase table"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 201:
        return response.json()
    return None

def supabase_update(table, data, match_column, match_value):
    """UPDATE data in Supabase table"""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    params = {match_column: f"eq.{match_value}"}
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    response = requests.patch(url, headers=headers, params=params, json=data)
    if response.status_code == 200:
        return response.json()
    return None

# Helper function for password hashing
def hash_password(password, salt=None):
    """Hash a password using SHA-256 with a salt"""
    if salt is None:
        salt = secrets.token_hex(16)
    
    # Create a hash with salt
    hash_obj = hashlib.sha256((password + salt).encode('utf-8'))
    password_hash = hash_obj.hexdigest()
    
    return password_hash, salt

def verify_password(password, stored_hash, salt):
    """Verify a password against a stored hash"""
    new_hash, _ = hash_password(password, salt)
    return new_hash == stored_hash

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    # Query app_users table with username
    users = supabase_get('app_users', {'username': f'eq.{username}'})
    
    for user in users:
        # Verify password using salt and hash
        if verify_password(password, user['password_hash'], user['password_salt']):
            # Return user data without password
            user_data = {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
            return jsonify({'success': True, 'user': user_data})
    
    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

# Updated endpoint for password reset with improved logging and error handling
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    print("Reset password endpoint called")
    print(f"Request headers: {request.headers}")
    print(f"Request method: {request.method}")
    
    # Verify content type
    if not request.is_json:
        print("Error: Request content-type is not application/json")
        return jsonify({'success': False, 'error': 'Expected JSON data'}), 400
    
    data = request.json
    if not data:
        print("Error: No JSON data in request")
        return jsonify({'success': False, 'error': 'No data provided'}), 400
        
    email = data.get('email')
    new_password = data.get('newPassword')
    auth_token = request.headers.get('Authorization')
    
    print(f"Processing reset password for email: {email}")
    
    # Validate authorization
    if not auth_token or not auth_token.startswith('Bearer '):
        print("Error: Unauthorized request - invalid auth token")
        return jsonify({'success': False, 'error': 'Unauthorized'}), 401
    
    # Check for fuel pumps with status containing pending_reset
    fuel_pumps = supabase_get('fuel_pumps', {'email': f'eq.{email}'})
    
    if not fuel_pumps:
        print(f"Error: Fuel pump not found with email {email}")
        return jsonify({'success': False, 'error': 'Fuel pump not found'}), 404
    
    fuel_pump = fuel_pumps[0]
    
    # Check if status indicates a pending password reset
    status = fuel_pump.get('status', '')
    if not status.startswith('pending_reset:'):
        print(f"Error: No pending password reset for fuel pump with email {email}")
        return jsonify({'success': False, 'error': 'No pending password reset'}), 400
    
    # Extract the new password from the status
    stored_password = status.split(':', 1)[1] if ':' in status else ''
    
    if stored_password != new_password:
        print("Error: Password mismatch")
        return jsonify({'success': False, 'error': 'Password verification failed'}), 400
    
    # Find the user in app_users table
    users = supabase_get('app_users', {'email': f'eq.{email}'})
    
    if not users:
        print(f"Error: User not found with email {email}")
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    user = users[0]
    
    # Hash the new password
    password_hash, password_salt = hash_password(new_password)
    
    # Update the user's password
    update_data = {
        'password_hash': password_hash,
        'password_salt': password_salt,
        'updated_at': datetime.now().isoformat()
    }
    
    result = supabase_update('app_users', update_data, 'id', user['id'])
    
    # Reset the fuel pump status back to active
    fuel_pump_update = supabase_update('fuel_pumps', {'status': 'active'}, 'id', fuel_pump['id'])
    
    if result:
        print(f"Password reset successful for user with email {email}")
        return jsonify({
            'success': True, 
            'message': 'Password reset successfully'
        })
    
    print("Error: Failed to reset password in database")
    return jsonify({'success': False, 'error': 'Failed to reset password'}), 500

# Customer routes
@app.route('/api/customers', methods=['GET'])
def get_customers():
    customers = supabase_get('customers')
    return jsonify(customers)

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    customers = supabase_get('customers', {'id': f'eq.{customer_id}'})
    
    if customers and len(customers) > 0:
        return jsonify(customers[0])
    return jsonify({'message': 'Customer not found'}), 404

@app.route('/api/customers', methods=['POST'])
def create_customer():
    data = request.json
    
    new_customer = {
        'name': data.get('name'),
        'contact': data.get('contact'),
        'phone': data.get('phone'),
        'email': data.get('email'),
        'gst': data.get('gst'),
        'balance': data.get('balance', 0)
    }
    
    result = supabase_post('customers', new_customer)
    
    if result:
        return jsonify({'success': True, 'customer': result[0]})
    return jsonify({'success': False, 'message': 'Failed to create customer'}), 500

@app.route('/api/customers/<customer_id>', methods=['PUT'])
def update_customer(customer_id):
    data = request.json
    
    update_data = {
        'name': data.get('name'),
        'contact': data.get('contact'),
        'phone': data.get('phone'),
        'email': data.get('email'),
        'gst': data.get('gst'),
        'balance': data.get('balance')
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    result = supabase_update('customers', update_data, 'id', customer_id)
    
    if result and len(result) > 0:
        return jsonify({'success': True, 'customer': result[0]})
    return jsonify({'message': 'Customer not found or update failed'}), 404

# Vehicle routes
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    customer_id = request.args.get('customer_id')
    
    if customer_id:
        vehicles = supabase_get('vehicles', {'customer_id': f'eq.{customer_id}'})
    else:
        vehicles = supabase_get('vehicles')
    
    return jsonify(vehicles)

@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    data = request.json
    
    new_vehicle = {
        'customer_id': data.get('customer_id'),
        'number': data.get('number'),
        'type': data.get('type'),
        'capacity': data.get('capacity')
    }
    
    result = supabase_post('vehicles', new_vehicle)
    
    if result:
        return jsonify({'success': True, 'vehicle': result[0]})
    return jsonify({'success': False, 'message': 'Failed to create vehicle'}), 500

# Staff routes
@app.route('/api/staff', methods=['GET'])
def get_staff():
    staff = supabase_get('staff')
    return jsonify(staff)

@app.route('/api/staff/<staff_id>', methods=['GET'])
def get_staff_member(staff_id):
    staff = supabase_get('staff', {'id': f'eq.{staff_id}'})
    
    if staff and len(staff) > 0:
        return jsonify(staff[0])
    return jsonify({'message': 'Staff member not found'}), 404

@app.route('/api/staff', methods=['POST'])
def create_staff():
    data = request.json
    
    # Check for duplicate phone number
    existing_staff = supabase_get('staff', {'phone': f'eq.{data.get("phone")}'})
    if existing_staff and len(existing_staff) > 0:
        return jsonify({
            'success': False,
            'message': 'A staff member with this phone number already exists'
        }), 400
    
    new_staff = {
        'name': data.get('name'),
        'phone': data.get('phone'),
        'email': data.get('email'),
        'role': data.get('role'),
        'salary': data.get('salary'),
        'joining_date': data.get('joining_date'),
        'assigned_pumps': data.get('assigned_pumps', [])
    }
    
    result = supabase_post('staff', new_staff)
    
    if result:
        return jsonify({'success': True, 'staff': result[0]})
    return jsonify({'success': False, 'message': 'Failed to create staff member'}), 500

# Add this new route for shifts with cash remaining
@app.route('/api/shifts', methods=['PUT'])
def update_shift():
    data = request.json
    shift_id = data.get('id')
    
    update_data = {
        'end_time': data.get('end_time'),
        'status': data.get('status', 'completed'),
        'cash_remaining': data.get('cash_remaining', 0)
    }
    
    result = supabase_update('shifts', update_data, 'id', shift_id)
    
    if result and len(result) > 0:
        return jsonify({'success': True, 'shift': result[0]})
    return jsonify({'message': 'Shift not found or update failed'}), 404

# Indent routes
@app.route('/api/indents', methods=['GET'])
def get_indents():
    customer_id = request.args.get('customer_id')
    
    if customer_id:
        indents = supabase_get('indents', {'customer_id': f'eq.{customer_id}'})
    else:
        indents = supabase_get('indents')
    
    return jsonify(indents)

@app.route('/api/indents', methods=['POST'])
def create_indent():
    data = request.json
    
    new_indent = {
        'id': f"IND{datetime.now().strftime('%Y%m%d%H%M%S')}",
        'customer_id': data.get('customer_id'),
        'vehicle_id': data.get('vehicle_id'),
        'fuel_type': data.get('fuel_type'),
        'quantity': data.get('quantity'),
        'amount': data.get('amount'),
        'status': data.get('status', 'Pending')
    }
    
    result = supabase_post('indents', new_indent)
    
    if result:
        return jsonify({'success': True, 'indent': result[0]})
    return jsonify({'success': False, 'message': 'Failed to create indent'}), 500

# Readings routes
@app.route('/api/readings', methods=['GET'])
def get_readings():
    date = request.args.get('date')
    
    if date:
        readings = supabase_get('readings', {'date': f'eq.{date}'})
    else:
        readings = supabase_get('readings')
    
    return jsonify(readings)

@app.route('/api/readings', methods=['POST'])
def create_reading():
    data = request.json
    
    new_reading = {
        'pump_id': data.get('pump_id'),
        'shift_id': data.get('shift_id'),
        'opening_reading': data.get('opening_reading'),
        'closing_reading': None,  # Allow null for closing reading
        'staff_id': data.get('staff_id'),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'cash_given': data.get('cash_given', 0)
    }
    
    result = supabase_post('readings', new_reading)
    
    if result:
        return jsonify({'success': True, 'reading': result[0]})
    return jsonify({'success': False, 'message': 'Failed to create reading'}), 500

@app.route('/api/readings/<reading_id>', methods=['PUT'])
def update_reading(reading_id):
    data = request.json
    
    update_data = {
        'closing_reading': data.get('closing_reading')
    }
    
    result = supabase_update('readings', update_data, 'id', reading_id)
    
    if result and len(result) > 0:
        return jsonify({'success': True, 'reading': result[0]})
    return jsonify({'message': 'Reading not found or update failed'}), 404

# Transaction routes
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    date = request.args.get('date')
    
    if date:
        transactions = supabase_get('transactions', {'date': f'eq.{date}'})
    else:
        transactions = supabase_get('transactions')
    
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.json
    
    new_transaction = {
        'id': f"TRX{datetime.now().strftime('%Y%m%d%H%M%S')}",
        'customer_id': data.get('customer_id'),
        'vehicle_id': data.get('vehicle_id'),
        'amount': data.get('amount'),
        'quantity': data.get('quantity'),
        'fuel_type': data.get('fuel_type'),
        'payment_method': data.get('payment_method'),
        'staff_id': data.get('staff_id'),
        'indent_id': data.get('indent_id'),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d'))
    }
    
    result = supabase_post('transactions', new_transaction)
    
    if result:
        return jsonify({'success': True, 'transaction': result[0]})
    return jsonify({'success': False, 'message': 'Failed to create transaction'}), 500

if __name__ == '__main__':
    print("Starting Flask server on port 5000...")
    print("Available endpoints:")
    print("  - /api/login")
    print("  - /api/reset-password")
    print("  - /api/customers")
    print("  - /api/shifts")
    print("  - /api/readings")
    print("  - /api/indents")
    print("  - /api/transactions")
    # Print the full URL to make it clear where the API is running
    print(f"API running at: http://localhost:5000")
    print("Make sure this is accessible from your frontend application")
    app.run(debug=True, port=5000, host='0.0.0.0')  # Use host='0.0.0.0' to make it accessible outside localhost
