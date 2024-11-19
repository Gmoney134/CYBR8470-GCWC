from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import UserViewSet, AdminViewSet

# Initialize the DefaultRouter
router = DefaultRouter()
router.register(r'GCWC/users', UserViewSet, basename='user')  # User registration and retrieval
router.register(r'GCWC/admin', AdminViewSet, basename='admin')  # Admin-only routes

urlpatterns = [
    path('admin/', admin.site.urls),  # Django admin site
    path('GCWC/login/', TokenObtainPairView.as_view(), name='login'),  # Login for JWT token
    path('GCWC/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),  # Refresh JWT token
    path('', include(router.urls)),  # Include routes from the DefaultRouter
]


