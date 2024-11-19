from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from .serializers import UserSerializer
from .models import GolfClub
from .serializers import GolfClubSerializer


class UserViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        # Handle user registration
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)

    def get_permissions(self):
        if self.action == 'list':
            # Only admin users can list all users
            return [permissions.IsAdminUser()]
        return super().get_permissions()

class AdminViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['get'])
    def users(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)


class GolfClubViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing golf clubs.
    """
    serializer_class = GolfClubSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Restrict golf clubs to those belonging to the authenticated user
        return GolfClub.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Automatically assign the authenticated user as the owner
        serializer.save(user=self.request.user)

