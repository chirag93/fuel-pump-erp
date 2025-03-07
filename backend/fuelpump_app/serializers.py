
from rest_framework import serializers
from .models import User, Customer, Vehicle, Staff, Shift, Reading, Indent, Transaction, FuelPump

class FuelPumpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuelPump
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    fuel_pump_name = serializers.CharField(source='fuel_pump.name', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'fuel_pump', 'fuel_pump_name']
        extra_kwargs = {'password': {'write_only': True}}

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'

class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'

class ShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shift
        fields = '__all__'

class ReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reading
        fields = '__all__'

class IndentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Indent
        fields = '__all__'
        read_only_fields = ['indent_id']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['transaction_id']
