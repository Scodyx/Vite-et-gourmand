package fr.vitegourmand.dish.entity;
import fr.vitegourmand.allergen.entity.Allergen;
import jakarta.persistence.*;
import java.util.*;
@Entity @Table(name="dish")
public class Dish {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(nullable=false,length=160) private String name;
 @Column(columnDefinition="text") private String description;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private DishType type;
 @Column(nullable=false) private boolean active=true;
 @ManyToMany @JoinTable(name="dish_allergen",joinColumns=@JoinColumn(name="dish_id"),inverseJoinColumns=@JoinColumn(name="allergen_id"))
 private Set<Allergen> allergens=new HashSet<>();
 public Long getId(){return id;} public String getName(){return name;} public String getDescription(){return description;}
 public DishType getType(){return type;} public boolean isActive(){return active;} public Set<Allergen> getAllergens(){return allergens;}
 public void setName(String v){name=v;} public void setDescription(String v){description=v;} public void setType(DishType v){type=v;}
 public void setActive(boolean v){active=v;} public void setAllergens(Set<Allergen> v){allergens=v;}
}
