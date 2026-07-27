package fr.vitegourmand.menu.entity;
import jakarta.persistence.*;
@Entity @Table(name="menu_image")
public class MenuImage {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false,fetch=FetchType.LAZY) @JoinColumn(name="menu_id") private Menu menu;
 @Column(name="image_url",nullable=false,length=500) private String imageUrl;
 @Column(name="alt_text",nullable=false) private String altText;
 @Column(name="display_order",nullable=false) private int displayOrder;
 public Long getId(){return id;} public String getImageUrl(){return imageUrl;} public String getAltText(){return altText;} public int getDisplayOrder(){return displayOrder;}
 public void setMenu(Menu v){menu=v;} public void setImageUrl(String v){imageUrl=v;} public void setAltText(String v){altText=v;} public void setDisplayOrder(int v){displayOrder=v;}
}
