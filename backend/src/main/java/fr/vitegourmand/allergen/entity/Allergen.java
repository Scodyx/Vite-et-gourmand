package fr.vitegourmand.allergen.entity;
import jakarta.persistence.*;
@Entity @Table(name="allergen")
public class Allergen {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,unique=true,length=100) private String name;
 public Long getId(){return id;} public String getName(){return name;} public void setName(String value){name=value;}
}
