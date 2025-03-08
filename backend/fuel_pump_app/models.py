
from django.db import models
from django.contrib.auth.models import User
import uuid
from django.utils import timezone

class Customer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    contact = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    gst = models.CharField(max_length=20)
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class Vehicle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='vehicles')
    number = models.CharField(max_length=20)
    type = models.CharField(max_length=50)
    capacity = models.CharField(max_length=50)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.number

class Staff(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    role = models.CharField(max_length=50)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    joining_date = models.DateField()
    assigned_pumps = models.JSONField(default=list)

    def __str__(self):
        return self.name

class Shift(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='shifts')
    shift_type = models.CharField(max_length=20)  # Morning, Afternoon, Evening
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='active')  # active, completed
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.staff.name} - {self.shift_type} - {self.start_time.date()}"

class Reading(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pump_id = models.CharField(max_length=50)
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='readings')
    opening_reading = models.DecimalField(max_digits=10, decimal_places=2)
    closing_reading = models.DecimalField(max_digits=10, decimal_places=2)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='readings')
    date = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.pump_id} - {self.date}"

class Inventory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fuel_type = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    updated_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.fuel_type} - {self.date}"

class Consumable(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    quantity = models.IntegerField()
    price_per_unit = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.name

class Indent(models.Model):
    id = models.CharField(primary_key=True, max_length=50)  # e.g., IND20230615123456
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='indents')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='indents')
    fuel_type = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending')  # Pending, Completed, Cancelled
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.id

class Transaction(models.Model):
    id = models.CharField(primary_key=True, max_length=50)  # e.g., TRX20230615123456
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='transactions', null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    fuel_type = models.CharField(max_length=50)
    payment_method = models.CharField(max_length=50)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='transactions')
    indent = models.ForeignKey(Indent, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    date = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.id
