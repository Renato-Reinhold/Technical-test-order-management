# Stage 1: Build with Gradle
FROM gradle:8.5-jdk17 AS build

WORKDIR /app

# Copy Gradle configuration files
COPY build.gradle settings.gradle ./
COPY gradle gradle/

# Copy source code
COPY src src/

# Build the application (skip tests for faster builds)
RUN gradle build -x test --no-daemon

# Stage 2: Run with JRE
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy the built JAR from build stage
COPY --from=build /app/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Set environment variables (can be overridden by docker-compose)
ENV SPRING_PROFILES_ACTIVE=docker

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
