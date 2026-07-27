FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -ntp dependency:go-offline
COPY src src
RUN ./mvnw -B -ntp clean package

FROM eclipse-temurin:21-jre-jammy
RUN groupadd --system spring && useradd --system --gid spring --home-dir /app spring
WORKDIR /app
COPY --from=build --chown=spring:spring /workspace/target/vite-et-gourmand-api-0.1.0-SNAPSHOT.jar app.jar
USER spring:spring
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app/app.jar"]
