
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'customers', views.CustomerViewSet)
router.register(r'vehicles', views.VehicleViewSet)
router.register(r'staff', views.StaffViewSet)
router.register(r'shifts', views.ShiftViewSet)
router.register(r'readings', views.ReadingViewSet)
router.register(r'inventory', views.InventoryViewSet)
router.register(r'consumables', views.ConsumableViewSet)
router.register(r'indents', views.IndentViewSet)
router.register(r'transactions', views.TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]
