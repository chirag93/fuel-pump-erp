
from django.db import models
import uuid
from django.utils import timezone

class User(models.Model):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=100)  # In production, use Django's auth system
    role = models.CharField(max_length=20, choices=[('admin', 'Admin'), ('staff', 'Staff')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.username

class Customer(models.Model):
    name = models.CharField(max_length=100)
    contact = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=100, blank=True, null=True)
    gst = models.CharField(max_length=20, blank=True, null=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Vehicle(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='vehicles')
    number = models.CharField(max_length=20)
    type = models.CharField(max_length=50)
    capacity = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.number

class Staff(models.Model):
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(max_length=100, blank=True, null=True)
    role = models.CharField(max_length=50)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    joining_date = models.DateField()
    assigned_pumps = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Shift(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name='shifts')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('completed', 'Completed')])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.staff.name} - {self.date} - {self.start_time}"

class Reading(models.Model):
    pump_id = models.CharField(max_length=20)
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='readings')
    opening_reading = models.DecimalField(max_digits=12, decimal_places=2)
    closing_reading = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.pump_id} - {self.date}"

class Indent(models.Model):
    indent_id = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    fuel_type = models.CharField(max_length=20)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.indent_id:
            self.indent_id = f"IND{timezone.now().strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.indent_id

class Transaction(models.Model):
    transaction_id = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    fuel_type = models.CharField(max_length=20)
    payment_method = models.CharField(max_length=20)
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    indent = models.ForeignKey(Indent, on_delete=models.SET_NULL, null=True, blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.transaction_id:
            self.transaction_id = f"TRX{timezone.now().strftime('%Y%m%d%H%M%S')}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.transaction_id
