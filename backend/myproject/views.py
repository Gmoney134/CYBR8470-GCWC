#Portions of this were generated/referenced from Chatgpt

from django.contrib.auth.models import User
from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.viewsets import ViewSet
from rest_framework import status
from .serializers import UserSerializer, GolfClubSerializer, UserProfileSerializer, GolfClubCalculationSerializer
from .models import GolfClub
import math
import re


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
    
def parse_windSpeed(windSpeed_input):
    """
    Parse wind speed input and return the average wind speed as a float.

    Returns:
    - float: Average wind speed.
    """
    try:
        match = re.match(r"(\d+)(?:\s*to\s*(\d+))?\s*mph", windSpeed_input.lower())
        if not match:
            raise ValueError("Invalid wind speed format. Use formats like '12 mph' or '8 to 12 mph'.")

        lower_speed = float(match.group(1))
        upper_speed = float(match.group(2)) if match.group(2) else lower_speed
        return (lower_speed + upper_speed) / 2
    except Exception as e:
        raise ValueError(f"Error parsing wind speed: {e}")

def calculate_wind_adjustment(windSpeed, windDirection, facing_direction):
    direction_map = {
        "N": 0,
        "NNE": 22.5, 
        "NE": 45,
        "ENE": 67.5, 
        "E": 90,
        "ESE": 112.5, 
        "SE": 135,
        "SSE": 157.5,
        "S": 180,
        "SSW": 202.5, 
        "SW": 225,
        "WSW": 247.5, 
        "W": 270, 
        "WNW": 292.5,
        "NW": 315,
        "NNW": 337.5
    }

    wind_deg = direction_map.get(windDirection.upper(), None)
    facing_deg = direction_map.get(facing_direction.upper(), None)

    if wind_deg is None or facing_deg is None:
        raise ValueError("Invalid wind or facing direction. Use N, NNE, NE, ENE, E, ESE, SE, SSE, S, SSW, SW, WSW, W, WNW, NW, NNW.")

    angle_diff = abs(wind_deg - facing_deg)
    angle_diff = min(angle_diff, 360 - angle_diff)

    if angle_diff == 180:
        impact_factor = -1.5
    elif angle_diff == 0:
        impact_factor = 1.5
    else:
        impact_factor = math.cos(math.radians(angle_diff)) * 1.5

    return windSpeed * impact_factor

def calculate_adjusted_distance(base_distance, temperature, windSpeed, windDirection, facing_direction, humidity):
    temperature_adjustment = (temperature - 70) * 0.2
    humidity_adjustment = (humidity - 50) * 0.02
    wind_adjustment = calculate_wind_adjustment(windSpeed, windDirection, facing_direction)
    total_adjustment = temperature_adjustment + humidity_adjustment + wind_adjustment
    adjusted_distance = base_distance + total_adjustment
    return adjusted_distance

def calculate_adjusted_distances_for_all_directions(base_distance, temperature, windSpeed, windDirection, humidity):
    directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    results = {}

    for facing_direction in directions:
        adjusted_distance = calculate_adjusted_distance(
            base_distance, temperature, windSpeed, windDirection, facing_direction, humidity
        )
        results[facing_direction] = round(adjusted_distance, 2)

    return results

class CalculationsViewSet(ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request):
        """
        Calculate adjusted distances for the user's golf clubs.

        Returns:
        - List of golf clubs with original and adjusted distances.
        """
        user = request.user
        golf_clubs = GolfClub.objects.filter(user=user)

        if not golf_clubs.exists():
            return Response({"detail": "No golf clubs found for this user."}, status=status.HTTP_404_NOT_FOUND)

        # Input weather conditions
        temperature = request.data.get('temperature')
        windSpeed_input = request.data.get('windSpeed')
        windDirection = request.data.get('windDirection')
        humidity = request.data.get('humidity')

        if not all([temperature, windSpeed_input, windDirection, humidity]):
            return Response({"detail": "All weather inputs are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            temperature = float(temperature)
            windSpeed = parse_windSpeed(windSpeed_input)
            humidity = float(humidity)

            adjusted_clubs = []
            for club in golf_clubs:
                adjusted_distance = calculate_adjusted_distances_for_all_directions(
                    club.distance, temperature, windSpeed, windDirection, humidity
                )
                adjusted_clubs.append({
                    "club_name": club.club_name,
                    "original_distance": club.distance,
                    "adjusted_distance": adjusted_distance,
                })

            serializer = GolfClubCalculationSerializer(adjusted_clubs, many=True)
            return Response({"golf_clubs": adjusted_clubs}, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)
