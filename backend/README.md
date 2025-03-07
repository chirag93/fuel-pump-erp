
# Fuel Pump Management System - Django Backend

This is the Django backend for the Fuel Pump Management System. It provides a RESTful API for the frontend.

## Setup

1. Make sure you have Python installed (Python 3.8+ recommended)
2. Install required dependencies:

```bash
pip install -r requirements.txt
```

3. Apply migrations to create the database:

```bash
python manage.py migrate
```

4. Create a superuser for admin access (optional):

```bash
python manage.py createsuperuser
```

5. Run the server:

```bash
python manage.py runserver
```

The server will start on http://localhost:8000.

## API Endpoints

### Authentication
- POST `/api/login/` - Authenticate a user

### Customers
- GET `/api/customers/` - Get all customers
- GET `/api/customers/<id>/` - Get a specific customer
- POST `/api/customers/` - Create a new customer
- PUT `/api/customers/<id>/` - Update a customer
- DELETE `/api/customers/<id>/` - Delete a customer

### Vehicles
- GET `/api/vehicles/` - Get all vehicles (can filter by customer_id)
- GET `/api/vehicles/<id>/` - Get a specific vehicle
- POST `/api/vehicles/` - Create a new vehicle
- PUT `/api/vehicles/<id>/` - Update a vehicle
- DELETE `/api/vehicles/<id>/` - Delete a vehicle

### Staff
- GET `/api/staff/` - Get all staff
- GET `/api/staff/<id>/` - Get a specific staff member
- POST `/api/staff/` - Create a new staff member
- PUT `/api/staff/<id>/` - Update a staff member
- DELETE `/api/staff/<id>/` - Delete a staff member

### Shifts
- GET `/api/shifts/` - Get all shifts
- POST `/api/shifts/` - Create a new shift

### Readings
- GET `/api/readings/` - Get all readings (can filter by date)
- POST `/api/readings/` - Create a new reading

### Indents
- GET `/api/indents/` - Get all indents (can filter by customer_id)
- POST `/api/indents/` - Create a new indent

### Transactions
- GET `/api/transactions/` - Get all transactions (can filter by date)
- POST `/api/transactions/` - Create a new transaction

## Admin Panel

Django provides an admin panel at http://localhost:8000/admin/ where you can manage all the data.

## Notes

- This is a Django-powered backend with a SQLite database for development.
- In a production environment, you would use a more robust database like PostgreSQL.
- Authentication is very basic - in production, use Django's built-in authentication system with token-based authentication.
