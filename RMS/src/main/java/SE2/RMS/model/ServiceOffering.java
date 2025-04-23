package SE2.RMS.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class ServiceOffering {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    @Column(length = 1000)
    private String description;
    private BigDecimal pricePerDay;
    private String imageUrl;

    // Constructors
    public ServiceOffering() {}
    public ServiceOffering(String name, String desc, BigDecimal price, String imageUrl) {
        this.name         = name;
        this.description  = desc;
        this.pricePerDay  = price;
        this.imageUrl     = imageUrl;
    }

    // Getters & setters…
    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String n) { this.name = n; }
    // …and so on for description, pricePerDay, imageUrl
}
