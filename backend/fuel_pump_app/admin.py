
from django.contrib import admin
from .models import Customer, Vehicle, Staff, Shift, Reading, Inventory, Consumable, Indent, Transaction

admin.site.register(Customer)
admin.site.register(Vehicle)
admin.site.register(Staff)
admin.site.register(Shift)
admin.site.register(Reading)
admin.site.register(Inventory)
admin.site.register(Consumable)
admin.site.register(Indent)
admin.site.register(Transaction)
