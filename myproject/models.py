from django.contrib.auth.models import User
from django.db import models

# class is the felids for the golf clubs that the user can input along with distances
class GolfClub(models.Model):
    CLUB_CHOICES = [
        ("Driver", "Driver"),
        ("3 wood", "3 wood"),
        ("5 wood", "5 wood"),
        ("7 wood", "7 wood"),
        ("1i", "1i"),
        ("2i", "2i"),
        ("3i", "3i"),
        ("4i", "4i"),
        ("5i", "5i"),
        ("6i", "6i"),
        ("7i", "7i"),
        ("8i", "8i"),
        ("9i", "9i"),
        ("PW", "PW"),
        ("50 degree", "50 degree"),
        ("52 degree", "52 degree"),
        ("54 degree", "54 degree"),
        ("56 degree", "56 degree"),
        ("58 degree", "58 degree"),
        ("60 degree", "60 degree"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="golf_clubs", null=True, blank=True)
    club_name = models.CharField(max_length=20, choices=CLUB_CHOICES)
    distance = models.PositiveIntegerField(help_text="Distance in yards")

    def __str__(self):
        return f"{self.user.username}'s {self.club_name}: {self.distance} yards"
