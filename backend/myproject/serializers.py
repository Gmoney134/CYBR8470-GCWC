from django.contrib.auth.models import User
from rest_framework import serializers
from .models import GolfClub

# class for user creation and login
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email'),
            password=validated_data['password']
        )
        return user
    
class GolfClubSerializer(serializers.ModelSerializer):
    class Meta:
        model = GolfClub
        fields = ['id', 'club_name', 'distance',]

class UserProfileSerializer(serializers.ModelSerializer):
    golf_clubs = GolfClubSerializer(many=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'golf_clubs']
        