from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework import status # type: ignore
from .serializers import UserSerializer, GolfClubSerializer, UserProfileSerializer
from .models import GolfClub


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

class ProfileViewSet(ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get the user's profile information."""
        user = request.user
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    def create(self, request):
        """Add a new golf club to the user's bag."""
        serializer = GolfClubSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Edit an existing golf club in the user's bag."""
        try:
            golf_club = GolfClub.objects.get(pk=pk, user=request.user)
        except GolfClub.DoesNotExist:
            return Response({"detail": "Golf club not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = GolfClubSerializer(golf_club, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        """Remove a golf club from the user's bag."""
        try:
            golf_club = GolfClub.objects.get(pk=pk, user=request.user)
        except GolfClub.DoesNotExist:
            return Response({"detail": "Golf club not found."}, status=status.HTTP_404_NOT_FOUND)

        golf_club.delete()
        return Response({"detail": "Golf club removed."}, status=status.HTTP_204_NO_CONTENT)

