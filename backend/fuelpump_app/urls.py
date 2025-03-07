
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'fuelpumps', views.FuelPumpViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'vehicles', views.VehicleViewSet)
router.register(r'staff', views.StaffViewSet)
router.register(r'shifts', views.ShiftViewSet)
router.register(r'readings', views.ReadingViewSet)
router.register(r'indents', views.IndentViewSet)
router.register(r'transactions', views.TransactionViewSet)

urlpatterns = [
    # Make sure the login URL is properly defined and accessible
    path('login/', views.login, name='login'),
    path('', include(router.urls)),
]
