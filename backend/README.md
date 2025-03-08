
# Fuel Pump Management System - Django Backend

This is the Django backend for the Fuel Pump Management System. It provides a RESTful API for the frontend.

## Setup

1. Make sure you have Python installed (Python 3.8+ recommended)
2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install required dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables (copy .env.example to .env and edit):

```bash
cp .env.example .env
# Edit .env file with your settings
```

5. Run database migrations:

```bash
python manage.py migrate
```

6. Create a superuser:

```bash
python manage.py createsuperuser
```

7. Run the server:

```bash
python manage.py runserver
```

The server will start on http://localhost:8000.

## API Endpoints

### Authentication
- POST `/api/login/` - Authenticate a user
- POST `/api/logout/` - Log out the current user

### Customers
- GET `/api/customers/` - Get all customers
- GET `/api/customers/{id}/` - Get a specific customer
- POST `/api/customers/` - Create a new customer
- PUT `/api/customers/{id}/` - Update a customer
- DELETE `/api/customers/{id}/` - Delete a customer

### Vehicles
- GET `/api/vehicles/` - Get all vehicles (can filter by customer_id)
- GET `/api/vehicles/{id}/` - Get a specific vehicle
- POST `/api/vehicles/` - Create a new vehicle
- PUT `/api/vehicles/{id}/` - Update a vehicle
- DELETE `/api/vehicles/{id}/` - Delete a vehicle

### Staff
- GET `/api/staff/` - Get all staff
- GET `/api/staff/{id}/` - Get a specific staff member
- POST `/api/staff/` - Create a new staff member
- PUT `/api/staff/{id}/` - Update a staff member
- DELETE `/api/staff/{id}/` - Delete a staff member

### Shifts
- GET `/api/shifts/` - Get all shifts
- GET `/api/shifts/{id}/` - Get a specific shift
- POST `/api/shifts/` - Create a new shift
- PUT `/api/shifts/{id}/` - Update a shift
- DELETE `/api/shifts/{id}/` - Delete a shift

### Readings
- GET `/api/readings/` - Get all readings (can filter by date)
- GET `/api/readings/{id}/` - Get a specific reading
- POST `/api/readings/` - Create a new reading
- PUT `/api/readings/{id}/` - Update a reading
- DELETE `/api/readings/{id}/` - Delete a reading

### Indents
- GET `/api/indents/` - Get all indents (can filter by customer_id)
- GET `/api/indents/{id}/` - Get a specific indent
- POST `/api/indents/` - Create a new indent
- PUT `/api/indents/{id}/` - Update an indent
- DELETE `/api/indents/{id}/` - Delete an indent

### Transactions
- GET `/api/transactions/` - Get all transactions (can filter by date)
- GET `/api/transactions/{id}/` - Get a specific transaction
- POST `/api/transactions/` - Create a new transaction
- PUT `/api/transactions/{id}/` - Update a transaction
- DELETE `/api/transactions/{id}/` - Delete a transaction

## Deployment on Heroku

See the deployment instructions in the main README.
