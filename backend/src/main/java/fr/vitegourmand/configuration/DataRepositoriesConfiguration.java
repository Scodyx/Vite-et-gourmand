package fr.vitegourmand.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@Configuration
@EnableJpaRepositories(
        basePackages = {
            "fr.vitegourmand.allergen.repository",
            "fr.vitegourmand.auth.repository",
            "fr.vitegourmand.contact.repository",
            "fr.vitegourmand.dish.repository",
            "fr.vitegourmand.menu.repository",
            "fr.vitegourmand.openinghours.repository",
            "fr.vitegourmand.order.repository",
            "fr.vitegourmand.review.repository",
            "fr.vitegourmand.user.repository"
        })
@EnableMongoRepositories(basePackages = "fr.vitegourmand.statistics.repository")
public class DataRepositoriesConfiguration {}
