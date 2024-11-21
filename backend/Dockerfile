# Use the official Python image.
FROM python:3.11

RUN apt-get update && apt-get install -y tzdata
RUN pip install psycopg2-binary
RUN pip install django-cors-headers

# Set the working directory in the container.
WORKDIR /app

# Copy the requirements file into the container.
COPY requirements.txt /app/

# Install the required dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app.
COPY . /app

# Expose port 8000 for Django.
EXPOSE 8000

# Run the Django development server.
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
