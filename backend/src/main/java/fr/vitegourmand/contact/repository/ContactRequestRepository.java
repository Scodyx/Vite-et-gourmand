package fr.vitegourmand.contact.repository;
import fr.vitegourmand.contact.entity.ContactRequest;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ContactRequestRepository extends JpaRepository<ContactRequest,Long>{}
