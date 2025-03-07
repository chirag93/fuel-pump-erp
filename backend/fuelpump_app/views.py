
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User, Customer, Vehicle, Staff, Shift, Reading, Indent, Transaction, FuelPump
from .serializers import (
    UserSerializer, CustomerSerializer, VehicleSerializer, StaffSerializer,
    ShiftSerializer, ReadingSerializer, IndentSerializer, TransactionSerializer,
    FuelPumpSerializer
)
import json
import os
from django.conf import settings
import datetime
from django.db.models import Sum, Avg

# Initialize data directory and files for backward compatibility
DATA_DIR = 'data'
os.makedirs(DATA_DIR, exist_ok=True)

def load_default_data():
    # Check if we have fuel pumps, if not, create a default one
    if FuelPump.objects.count() == 0:
        default_pump = FuelPump.objects.create(
            name="Main Pump",
            location="Main Street",
            petrol_capacity=10000,
            diesel_capacity=10000,
            petrol_current_level=7500,
            diesel_current_level=8000
        )
    else:
        default_pump = FuelPump.objects.first()
    
    # Check if we have users, if not, create default users
    if User.objects.count() == 0:
        User.objects.create(
            username="admin",
            email="admin@example.com",
            password="admin123",  # In production, use Django's auth system
            role="admin"
        )
        User.objects.create(
            username="staff",
            email="staff@example.com",
            password="staff123",  # In production, use Django's auth system
            role="staff",
            fuel_pump=default_pump
        )
    
    # Check if we have customers, if not, create default customers
    if Customer.objects.count() == 0:
        customer1 = Customer.objects.create(
            fuel_pump=default_pump,
            name="Rajesh Enterprises",
            contact="Rajesh Kumar",
            phone="9876543210",
            email="rajesh@example.com",
            gst="GSTIN12345678901",
            balance=15000
        )
        customer2 = Customer.objects.create(
            fuel_pump=default_pump,
            name="ABC Logistics",
            contact="Amit Singh",
            phone="8765432109",
            email="amit@abclogistics.com",
            gst="GSTIN23456789012",
            balance=8500
        )
        
        # Create default vehicles
        Vehicle.objects.create(
            customer=customer1,
            number="KA-01-AB-1234",
            type="Truck",
            capacity="12 Ton"
        )
        Vehicle.objects.create(
            customer=customer1,
            number="KA-01-CD-5678",
            type="Truck",
            capacity="16 Ton"
        )
        Vehicle.objects.create(
            customer=customer2,
            number="MH-12-GH-3456",
            type="Truck",
            capacity="20 Ton"
        )
    
    # Check if we have staff, if not, create default staff
    if Staff.objects.count() == 0:
        Staff.objects.create(
            fuel_pump=default_pump,
            name="Rahul Sharma",
            phone="9876543210",
            email="rahul@example.com",
            role="Pump Operator",
            salary=15000,
            joining_date="2023-01-15",
            assigned_pumps=["Pump-1", "Pump-2"]
        )
        Staff.objects.create(
            fuel_pump=default_pump,
            name="Priya Patel",
            phone="8765432109",
            email="priya@example.com",
            role="Cashier",
            salary=18000,
            joining_date="2022-11-10",
            assigned_pumps=["Pump-3"]
        )

# Load default data when Django starts
load_default_data()

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(username=username, password=password)
        serializer = UserSerializer(user)
        return Response({
            'success': True,
            'user': serializer.data
        })
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

class FuelPumpViewSet(viewsets.ModelViewSet):
    queryset = FuelPump.objects.all()
    serializer_class = FuelPumpSerializer
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        pump = self.get_object()
        today = datetime.date.today()
        
        # Get today's transactions
        today_transactions = Transaction.objects.filter(
            fuel_pump=pump, 
            date=today
        )
        
        # Calculate total sales and volume by fuel type
        petrol_sales = today_transactions.filter(fuel_type='Petrol').aggregate(
            total_amount=Sum('amount'),
            total_quantity=Sum('quantity')
        )
        
        diesel_sales = today_transactions.filter(fuel_type='Diesel').aggregate(
            total_amount=Sum('amount'),
            total_quantity=Sum('quantity')
        )
        
        # Get active staff count
        active_staff_count = Staff.objects.filter(fuel_pump=pump).count()
        
        # Get transaction count
        transaction_count = today_transactions.count()
        
        return Response({
            'name': pump.name,
            'location': pump.location,
            'petrol_capacity': pump.petrol_capacity,
            'diesel_capacity': pump.diesel_capacity,
            'petrol_current_level': pump.petrol_current_level,
            'diesel_current_level': pump.diesel_current_level,
            'today_petrol_sales': petrol_sales['total_amount'] or 0,
            'today_petrol_volume': petrol_sales['total_quantity'] or 0,
            'today_diesel_sales': diesel_sales['total_amount'] or 0,
            'today_diesel_volume': diesel_sales['total_quantity'] or 0,
            'active_staff_count': active_staff_count,
            'today_transaction_count': transaction_count
        })

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    @action(detail=False, methods=['post'])
    def create_pump_user(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        pump_id = request.data.get('fuel_pump')
        
        try:
            fuel_pump = FuelPump.objects.get(id=pump_id)
            user = User.objects.create(
                username=username,
                email=email,
                password=password,
                role='staff',
                fuel_pump=fuel_pump
            )
            serializer = UserSerializer(user)
            return Response({
                'success': True,
                'user': serializer.data
            })
        except FuelPump.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Fuel pump not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        pump_id = self.request.query_params.get('fuel_pump_id')
        if pump_id:
            queryset = queryset.filter(fuel_pump_id=pump_id)
        return queryset

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    
    def get_queryset(self):
        queryset = Vehicle.objects.all()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    
    def get_queryset(self):
        queryset = Staff.objects.all()
        pump_id = self.request.query_params.get('fuel_pump_id')
        if pump_id:
            queryset = queryset.filter(fuel_pump_id=pump_id)
        return queryset

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer
    
    def get_queryset(self):
        queryset = Shift.objects.all()
        staff_id = self.request.query_params.get('staff_id')
        if staff_id:
            queryset = queryset.filter(staff_id=staff_id)
        return queryset

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    
    def get_queryset(self):
        queryset = Reading.objects.all()
        date = self.request.query_params.get('date')
        pump_id = self.request.query_params.get('fuel_pump_id')
        
        if date:
            queryset = queryset.filter(date=date)
        if pump_id:
            queryset = queryset.filter(fuel_pump_id=pump_id)
            
        return queryset

class IndentViewSet(viewsets.ModelViewSet):
    queryset = Indent.objects.all()
    serializer_class = IndentSerializer
    
    def get_queryset(self):
        queryset = Indent.objects.all()
        customer_id = self.request.query_params.get('customer_id')
        pump_id = self.request.query_params.get('fuel_pump_id')
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if pump_id:
            queryset = queryset.filter(fuel_pump_id=pump_id)
            
        return queryset

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        queryset = Transaction.objects.all()
        date = self.request.query_params.get('date')
        pump_id = self.request.query_params.get('fuel_pump_id')
        
        if date:
            queryset = queryset.filter(date=date)
        if pump_id:
            queryset = queryset.filter(fuel_pump_id=pump_id)
            
        return queryset
