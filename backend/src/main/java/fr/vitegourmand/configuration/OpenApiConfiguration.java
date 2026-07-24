package fr.vitegourmand.configuration;
import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.components.Components;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;
@Configuration
public class OpenApiConfiguration {
 @Bean OpenAPI openApi(){
  return new OpenAPI().info(new Info().title("API Vite & Gourmand").version("v1")
   .description("API du catalogue, des commandes et des espaces équipe. Utiliser un access token JWT pour les routes protégées."))
   .components(new Components().addSecuritySchemes("bearerAuth",new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")))
   .addSecurityItem(new SecurityRequirement().addList("bearerAuth"));
 }
}
