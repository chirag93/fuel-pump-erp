
# Fuel Pump Management System - Django Backend

This is the Django backend for the Fuel Pump Management System. It provides a RESTful API for the frontend.

## Setup for Development

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

## Deploying to PythonAnywhere

### 1. Setting up PythonAnywhere

1. Sign up for a [PythonAnywhere account](https://www.pythonanywhere.com/)
2. Once logged in, go to the "Web" tab and click "Add a new web app"
3. Choose "Manual configuration" and select the latest Python version (3.8+)

### 2. Setting up the Django Project

1. Open a Bash console from the PythonAnywhere dashboard
2. Clone your repository:
   ```bash
   git clone https://github.com/your-username/your-repo.git fuel_pump
   ```
3. Create a virtual environment:
   ```bash
   cd fuel_pump
   python -m venv venv
   source venv/bin/activate
   ```
4. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
5. Create your .env file in the backend directory with production settings:
   ```bash
   cd backend
   nano .env
   ```
   Add your environment variables as specified in .env.example

### 3. Configure the Web App

1. Go back to the "Web" tab in PythonAnywhere
2. In the "Code" section, set:
   - Source code: `/home/yourusername/fuel_pump/backend`
   - Working directory: `/home/yourusername/fuel_pump/backend`
   
3. In the "WSGI configuration file" section, click on the WSGI file link to edit it
4. Replace the content with:
   ```python
   import os
   import sys
   import dotenv
   
   # Load environment variables from .env file
   dotenv.load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
   
   # Add your project directory to the sys.path
   path = '/home/yourusername/fuel_pump/backend'
   if path not in sys.path:
       sys.path.append(path)
   
   # Set environment variable to tell Django where your settings.py is
   os.environ['DJANGO_SETTINGS_MODULE'] = 'fuel_pump_project.settings'
   
   # Set up Django
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

5. In the "Virtualenv" section, set the virtualenv path:
   ```
   /home/yourusername/fuel_pump/venv
   ```

6. In the "Static files" section, add:
   - URL: /static/
   - Directory: /home/yourusername/fuel_pump/backend/staticfiles/

### 4. Setup Supabase Database

1. Create a new project in Supabase
2. Get your database connection details from Supabase dashboard:
   - Go to Project Settings > Database
   - Find your connection string or individual parameters (host, database, user, password)
3. Update your .env file with these details:
   ```
   DATABASE_URL=postgres://postgres.svuritdhlgaonfefphkz:your-db-password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_KEY=your-supabase-service-role-key
   ```

### 5. Run Migrations and Create a Superuser

1. In the PythonAnywhere bash console:
   ```bash
   cd ~/fuel_pump/backend
   source ../venv/bin/activate
   python manage.py migrate
   python manage.py collectstatic --noinput
   python manage.py createsuperuser
   ```

### 6. Configure the Frontend

1. Update your frontend environment variables to point to your PythonAnywhere domain:
   ```
   VITE_API_URL=https://yourusername.pythonanywhere.com
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```
2. Build your frontend:
   ```bash
   npm run build
   ```
3. Deploy the built files to a static hosting service like Vercel, Netlify, or Firebase Hosting

### 7. Reload your Web App

1. Go back to the "Web" tab in PythonAnywhere
2. Click the "Reload" button for your web app

Your Django backend should now be running on PythonAnywhere with a Supabase database, and your frontend can connect to it using the PythonAnywhere URL.

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
