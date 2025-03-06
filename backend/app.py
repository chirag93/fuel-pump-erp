
from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Data storage paths
DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
CUSTOMERS_FILE = os.path.join(DATA_DIR, 'customers.json')
VEHICLES_FILE = os.path.join(DATA_DIR, 'vehicles.json')
STAFF_FILE = os.path.join(DATA_DIR, 'staff.json')
SHIFTS_FILE = os.path.join(DATA_DIR, 'shifts.json')
READINGS_FILE = os.path.join(DATA_DIR, 'readings.json')
INVENTORY_FILE = os.path.join(DATA_DIR, 'inventory.json')
CONSUMABLES_FILE = os.path.join(DATA_DIR, 'consumables.json')
INDENTS_FILE = os.path.join(DATA_DIR, 'indents.json')
TRANSACTIONS_FILE = os.path.join(DATA_DIR, 'transactions.json')

# Initialize data directory
os.makedirs(DATA_DIR, exist_ok=True)

# Function to initialize data files with default data if they don't exist
def initialize_data_files():
    # Default users (admin and staff)
    if not os.path.exists(USERS_FILE):
        users = [
            {
                "id": "1",
                "username": "admin",
                "email": "admin@example.com",
                "password": "admin123",  # In a real app, this would be hashed
                "role": "admin"
            },
            {
                "id": "2",
                "username": "staff",
                "email": "staff@example.com",
                "password": "staff123",  # In a real app, this would be hashed
                "role": "staff"
            }
        ]
        save_data(USERS_FILE, users)
    
    # Default customers
    if not os.path.exists(CUSTOMERS_FILE):
        customers = [
            {
                "id": "1",
                "name": "Rajesh Enterprises",
                "contact": "Rajesh Kumar",
                "phone": "9876543210",
                "email": "rajesh@example.com",
                "gst": "GSTIN12345678901",
                "balance": 15000,
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "2",
                "name": "ABC Logistics",
                "contact": "Amit Singh",
                "phone": "8765432109",
                "email": "amit@abclogistics.com",
                "gst": "GSTIN23456789012",
                "balance": 8500,
                "created_at": datetime.now().isoformat()
            }
        ]
        save_data(CUSTOMERS_FILE, customers)
    
    # Default vehicles
    if not os.path.exists(VEHICLES_FILE):
        vehicles = [
            {
                "id": "1",
                "customer_id": "1",
                "number": "KA-01-AB-1234",
                "type": "Truck",
                "capacity": "12 Ton",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "2",
                "customer_id": "1",
                "number": "KA-01-CD-5678",
                "type": "Truck",
                "capacity": "16 Ton",
                "created_at": datetime.now().isoformat()
            },
            {
                "id": "3",
                "customer_id": "2",
                "number": "MH-12-GH-3456",
                "type": "Truck",
                "capacity": "20 Ton",
                "created_at": datetime.now().isoformat()
            }
        ]
        save_data(VEHICLES_FILE, vehicles)
    
    # Default staff
    if not os.path.exists(STAFF_FILE):
        staff = [
            {
                "id": "1",
                "name": "Rahul Sharma",
                "phone": "9876543210",
                "email": "rahul@example.com",
                "role": "Pump Operator",
                "salary": 15000,
                "joining_date": "2023-01-15",
                "assigned_pumps": ["Pump-1", "Pump-2"]
            },
            {
                "id": "2",
                "name": "Priya Patel",
                "phone": "8765432109",
                "email": "priya@example.com",
                "role": "Cashier",
                "salary": 18000,
                "joining_date": "2022-11-10",
                "assigned_pumps": ["Pump-3"]
            }
        ]
        save_data(STAFF_FILE, staff)
    
    # Other empty data files
    empty_files = [
        SHIFTS_FILE, READINGS_FILE, INVENTORY_FILE, 
        CONSUMABLES_FILE, INDENTS_FILE, TRANSACTIONS_FILE
    ]
    for file in empty_files:
        if not os.path.exists(file):
            save_data(file, [])

# Helper functions for data handling
def load_data(file_path):
    try:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading data from {file_path}: {e}")
        return []

def save_data(file_path, data):
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving data to {file_path}: {e}")
        return False

# Initialize data files when the app starts
initialize_data_files()

# Authentication routes
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    users = load_data(USERS_FILE)
    
    for user in users:
        if user['username'] == username and user['password'] == password:
            # In a real app, we would use JWT tokens and not return the password
            user_data = {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
            return jsonify({'success': True, 'user': user_data})
    
    return jsonify({'success': False, 'message': 'Invalid username or password'}), 401

# Customer routes
@app.route('/api/customers', methods=['GET'])
def get_customers():
    customers = load_data(CUSTOMERS_FILE)
    return jsonify(customers)

@app.route('/api/customers/<customer_id>', methods=['GET'])
def get_customer(customer_id):
    customers = load_data(CUSTOMERS_FILE)
    customer = next((c for c in customers if c['id'] == customer_id), None)
    
    if customer:
        return jsonify(customer)
    return jsonify({'message': 'Customer not found'}), 404

@app.route('/api/customers', methods=['POST'])
def create_customer():
    data = request.json
    customers = load_data(CUSTOMERS_FILE)
    
    new_customer = {
        'id': str(uuid.uuid4()),
        'name': data.get('name'),
        'contact': data.get('contact'),
        'phone': data.get('phone'),
        'email': data.get('email'),
        'gst': data.get('gst'),
        'balance': data.get('balance', 0),
        'created_at': datetime.now().isoformat()
    }
    
    customers.append(new_customer)
    save_data(CUSTOMERS_FILE, customers)
    
    return jsonify({'success': True, 'customer': new_customer})

@app.route('/api/customers/<customer_id>', methods=['PUT'])
def update_customer(customer_id):
    data = request.json
    customers = load_data(CUSTOMERS_FILE)
    
    for i, customer in enumerate(customers):
        if customer['id'] == customer_id:
            customers[i].update({
                'name': data.get('name', customer['name']),
                'contact': data.get('contact', customer['contact']),
                'phone': data.get('phone', customer['phone']),
                'email': data.get('email', customer['email']),
                'gst': data.get('gst', customer['gst']),
                'balance': data.get('balance', customer['balance'])
            })
            save_data(CUSTOMERS_FILE, customers)
            return jsonify({'success': True, 'customer': customers[i]})
    
    return jsonify({'message': 'Customer not found'}), 404

# Vehicle routes
@app.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    vehicles = load_data(VEHICLES_FILE)
    customer_id = request.args.get('customer_id')
    
    if customer_id:
        vehicles = [v for v in vehicles if v['customer_id'] == customer_id]
    
    return jsonify(vehicles)

@app.route('/api/vehicles', methods=['POST'])
def create_vehicle():
    data = request.json
    vehicles = load_data(VEHICLES_FILE)
    
    new_vehicle = {
        'id': str(uuid.uuid4()),
        'customer_id': data.get('customer_id'),
        'number': data.get('number'),
        'type': data.get('type'),
        'capacity': data.get('capacity'),
        'created_at': datetime.now().isoformat()
    }
    
    vehicles.append(new_vehicle)
    save_data(VEHICLES_FILE, vehicles)
    
    return jsonify({'success': True, 'vehicle': new_vehicle})

# Staff routes
@app.route('/api/staff', methods=['GET'])
def get_staff():
    staff = load_data(STAFF_FILE)
    return jsonify(staff)

@app.route('/api/staff/<staff_id>', methods=['GET'])
def get_staff_member(staff_id):
    staff = load_data(STAFF_FILE)
    staff_member = next((s for s in staff if s['id'] == staff_id), None)
    
    if staff_member:
        return jsonify(staff_member)
    return jsonify({'message': 'Staff member not found'}), 404

@app.route('/api/staff', methods=['POST'])
def create_staff():
    data = request.json
    staff = load_data(STAFF_FILE)
    
    new_staff = {
        'id': str(uuid.uuid4()),
        'name': data.get('name'),
        'phone': data.get('phone'),
        'email': data.get('email'),
        'role': data.get('role'),
        'salary': data.get('salary'),
        'joining_date': data.get('joining_date'),
        'assigned_pumps': data.get('assigned_pumps', [])
    }
    
    staff.append(new_staff)
    save_data(STAFF_FILE, staff)
    
    return jsonify({'success': True, 'staff': new_staff})

# Indent routes
@app.route('/api/indents', methods=['GET'])
def get_indents():
    indents = load_data(INDENTS_FILE)
    customer_id = request.args.get('customer_id')
    
    if customer_id:
        indents = [i for i in indents if i['customer_id'] == customer_id]
    
    return jsonify(indents)

@app.route('/api/indents', methods=['POST'])
def create_indent():
    data = request.json
    indents = load_data(INDENTS_FILE)
    
    new_indent = {
        'id': f"IND{datetime.now().strftime('%Y%m%d%H%M%S')}",
        'customer_id': data.get('customer_id'),
        'vehicle_id': data.get('vehicle_id'),
        'fuel_type': data.get('fuel_type'),
        'quantity': data.get('quantity'),
        'amount': data.get('amount'),
        'status': data.get('status', 'Pending'),
        'created_at': datetime.now().isoformat()
    }
    
    indents.append(new_indent)
    save_data(INDENTS_FILE, indents)
    
    return jsonify({'success': True, 'indent': new_indent})

# Readings routes
@app.route('/api/readings', methods=['GET'])
def get_readings():
    readings = load_data(READINGS_FILE)
    date = request.args.get('date')
    
    if date:
        readings = [r for r in readings if r['date'] == date]
    
    return jsonify(readings)

@app.route('/api/readings', methods=['POST'])
def create_reading():
    data = request.json
    readings = load_data(READINGS_FILE)
    
    new_reading = {
        'id': str(uuid.uuid4()),
        'pump_id': data.get('pump_id'),
        'shift': data.get('shift'),
        'opening_reading': data.get('opening_reading'),
        'closing_reading': data.get('closing_reading'),
        'staff_id': data.get('staff_id'),
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'created_at': datetime.now().isoformat()
    }
    
    readings.append(new_reading)
    save_data(READINGS_FILE, readings)
    
    return jsonify({'success': True, 'reading': new_reading})

# Transaction routes
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = load_data(TRANSACTIONS_FILE)
    date = request.args.get('date')
    
    if date:
        transactions = [t for t in transactions if t['date'] == date]
    
    return jsonify(transactions)

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    data = request.json
    transactions = load_data(TRANSACTIONS_FILE)
    
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
        'date': data.get('date', datetime.now().strftime('%Y-%m-%d')),
        'created_at': datetime.now().isoformat()
    }
    
    transactions.append(new_transaction)
    save_data(TRANSACTIONS_FILE, transactions)
    
    return jsonify({'success': True, 'transaction': new_transaction})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
