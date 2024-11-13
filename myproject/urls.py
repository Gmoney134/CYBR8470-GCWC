from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views  

urlpatterns = [
    path('GCWC/register/', views.RegisterView.as_view(), name='register'),
    path('GCWC/login/', TokenObtainPairView.as_view(), name='login'),
    path('GCWC/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('GCWC/account/', views.AccountDataView.as_view(), name='account_data'),
]

