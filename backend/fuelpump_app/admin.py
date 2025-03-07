
from django.contrib import admin
from .models import User, Customer, Vehicle, Staff, Shift, Reading, Indent, Transaction

admin.site.register(User)
admin.site.register(Customer)
admin.site.register(Vehicle)
admin.site.register(Staff)
admin.site.register(Shift)
admin.site.register(Reading)
admin.site.register(Indent)
admin.site.register(Transaction)
