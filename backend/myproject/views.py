from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework import status # type: ignore
from .serializers import UserSerializer, GolfClubSerializer, UserProfileSerializer
from .models import GolfClub
import math


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

def calculate_wind_adjustment(wind_speed, wind_direction, facing_direction):
    direction_map = {
        "N": 0, "NE": 45, "E": 90, "SE": 135,
        "S": 180, "SW": 225, "W": 270, "NW": 315
    }

    wind_deg = direction_map.get(wind_direction.upper(), None)
    facing_deg = direction_map.get(facing_direction.upper(), None)

    if wind_deg is None or facing_deg is None:
        raise ValueError("Invalid wind or facing direction. Use N, NE, E, SE, S, SW, W, NW.")

    angle_diff = abs(wind_deg - facing_deg)
    angle_diff = min(angle_diff, 360 - angle_diff)

    if angle_diff == 180:
        impact_factor = -1.5
    elif angle_diff == 0:
        impact_factor = 1.5
    else:
        impact_factor = math.cos(math.radians(angle_diff)) * 1.5

    return wind_speed * impact_factor

def calculate_adjusted_distance(base_distance, temperature, wind_speed, wind_direction, facing_direction, humidity):
    temperature_adjustment = (temperature - 70) * 0.2
    humidity_adjustment = (humidity - 50) * 0.02
    wind_adjustment = calculate_wind_adjustment(wind_speed, wind_direction, facing_direction)
    total_adjustment = temperature_adjustment + humidity_adjustment + wind_adjustment
    adjusted_distance = base_distance + total_adjustment
    return adjusted_distance

class CalculationsViewSet(ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """
        Calculate adjusted distances for the user's golf clubs.
        Input:
        - temperature (float): Current temperature (°F).
        - wind_speed (float): Wind speed (mph).
        - wind_direction (str): Direction the wind is blowing (e.g., 'N', 'NE').
        - facing_direction (str): Direction the golfer is facing (e.g., 'N', 'NE').
        - humidity (float): Relative humidity as a percentage (0-100).

        Returns:
        - List of golf clubs with original and adjusted distances.
        """
        user = request.user
        golf_clubs = GolfClub.objects.filter(user=user)

        if not golf_clubs.exists():
            return Response({"detail": "No golf clubs found for this user."}, status=status.HTTP_404_NOT_FOUND)

        # Input weather conditions
        temperature = request.data.get('temperature')
        wind_speed = request.data.get('wind_speed')
        wind_direction = request.data.get('wind_direction')
        facing_direction = request.data.get('facing_direction')
        humidity = request.data.get('humidity')

        if not all([temperature, wind_speed, wind_direction, facing_direction, humidity]):
            return Response({"detail": "All weather inputs are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            temperature = float(temperature)
            wind_speed = float(wind_speed)
            humidity = float(humidity)

            adjusted_clubs = []
            for club in golf_clubs:
                adjusted_distance = calculate_adjusted_distance(
                    club.distance, temperature, wind_speed, wind_direction, facing_direction, humidity
                )
                adjusted_clubs.append({
                    "club_name": club.club_name,
                    "original_distance": club.distance,
                    "adjusted_distance": round(adjusted_distance, 2),
                })

            return Response({"golf_clubs": adjusted_clubs}, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
