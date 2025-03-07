
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import User, Customer, Vehicle, Staff, Shift, Reading, Indent, Transaction
from .serializers import (
    UserSerializer, CustomerSerializer, VehicleSerializer, StaffSerializer,
    ShiftSerializer, ReadingSerializer, IndentSerializer, TransactionSerializer
)
import json
import os
from django.conf import settings
import datetime

# Initialize data directory and files for backward compatibility
DATA_DIR = 'data'
os.makedirs(DATA_DIR, exist_ok=True)

def load_default_data():
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
            role="staff"
        )
    
    # Check if we have customers, if not, create default customers
    if Customer.objects.count() == 0:
        customer1 = Customer.objects.create(
            name="Rajesh Enterprises",
            contact="Rajesh Kumar",
            phone="9876543210",
            email="rajesh@example.com",
            gst="GSTIN12345678901",
            balance=15000
        )
        customer2 = Customer.objects.create(
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
            name="Rahul Sharma",
            phone="9876543210",
            email="rahul@example.com",
            role="Pump Operator",
            salary=15000,
            joining_date="2023-01-15",
            assigned_pumps=["Pump-1", "Pump-2"]
        )
        Staff.objects.create(
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

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

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

class ShiftViewSet(viewsets.ModelViewSet):
    queryset = Shift.objects.all()
    serializer_class = ShiftSerializer

class ReadingViewSet(viewsets.ModelViewSet):
    queryset = Reading.objects.all()
    serializer_class = ReadingSerializer
    
    def get_queryset(self):
        queryset = Reading.objects.all()
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset

class IndentViewSet(viewsets.ModelViewSet):
    queryset = Indent.objects.all()
    serializer_class = IndentSerializer
    
    def get_queryset(self):
        queryset = Indent.objects.all()
        customer_id = self.request.query_params.get('customer_id')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        queryset = Transaction.objects.all()
        date = self.request.query_params.get('date')
        if date:
            queryset = queryset.filter(date=date)
        return queryset
