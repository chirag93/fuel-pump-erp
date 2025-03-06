
# Fuel Pump Management System - Backend

This is the Python Flask backend for the Fuel Pump Management System. It provides a simple file-based data store and API endpoints for the frontend.

## Setup

1. Make sure you have Python installed (Python 3.8+ recommended)
2. Install required dependencies:

```bash
pip install flask flask-cors
```

3. Run the server:

```bash
python app.py
```

The server will start on http://localhost:5000.

## API Endpoints

### Authentication
- POST `/api/login` - Authenticate a user

### Customers
- GET `/api/customers` - Get all customers
- GET `/api/customers/<id>` - Get a specific customer
- POST `/api/customers` - Create a new customer
- PUT `/api/customers/<id>` - Update a customer

### Vehicles
- GET `/api/vehicles` - Get all vehicles (can filter by customer_id)
- POST `/api/vehicles` - Create a new vehicle

### Staff
- GET `/api/staff` - Get all staff
- GET `/api/staff/<id>` - Get a specific staff member
- POST `/api/staff` - Create a new staff member

### Indents
- GET `/api/indents` - Get all indents (can filter by customer_id)
- POST `/api/indents` - Create a new indent

### Readings
- GET `/api/readings` - Get all readings (can filter by date)
- POST `/api/readings` - Create a new reading

### Transactions
- GET `/api/transactions` - Get all transactions (can filter by date)
- POST `/api/transactions` - Create a new transaction

## Data Storage

All data is stored in JSON files in the `data` directory. The following files are used:

- `users.json` - User accounts
- `customers.json` - Customer information
- `vehicles.json` - Vehicle information
- `staff.json` - Staff information
- `shifts.json` - Shift information
- `readings.json` - Pump readings
- `inventory.json` - Inventory information
- `consumables.json` - Consumables sales
- `indents.json` - Customer indents
- `transactions.json` - Fuel transactions

## Notes

- This is a simple file-based backend for demonstration purposes.
- In a production environment, you would use a proper database.
- Authentication is very basic - in production, use proper authentication with JWT tokens.
