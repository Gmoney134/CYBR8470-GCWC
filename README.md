# Golf Club Weather Calculator:
The Golf club Weather Calculator is an application that makes weather based decisions in your golf game for you. The Golf Club Weather Calculator takes the user's input of what clubs they are using and how far the user hits those clubs in perfect conditions and makes calculations of how far the user will hit that club based on weather at the user's current location and direction the user is facing. This application makes it so there is no more guesswork when it comes to choosing what club to hit based on the weather.

## Installation/Getting started
First make sure that docker is running and you are in the CYBR8470-GCWC directory.
To install and run the Golf Club Calculator run the following commands:
```bash
docker compose build
docker compose up -d
docker-compose exec web python manage.py migrate
```
Once the commands have run successfully open http://localhost:8000 to see application.
See in-app menus for help imputing information or using specific features.

# License
The MIT License (MIT)

Copyright (c) Nichter J. Grant 2024
