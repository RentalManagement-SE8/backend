package SE2.RMS;

import java.math.BigDecimal;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import SE2.RMS.model.ServiceOffering;
import SE2.RMS.repository.ServiceOfferingRepository;

@SpringBootApplication
public class RmsApplication {

	public static void main(String[] args) {
		SpringApplication.run(RmsApplication.class, args);
	}

	@Bean
	CommandLineRunner seedData(ServiceOfferingRepository repo) {
		return args -> {
			// Optional: clear existing offerings
			repo.deleteAll();

			// Seed with sample offerings (note .jpeg extension)
			repo.save(new ServiceOffering(
					"Sedan Car",
					"Comfortable 4‑seater sedan",
					new BigDecimal("45.00"),
					"/images/sedan.jpeg"
			));

			repo.save(new ServiceOffering(
					"City Apartment",
					"Cozy 1‑bedroom downtown apartment",
					new BigDecimal("80.00"),
					"/images/apartment.jpeg"
			));

			repo.save(new ServiceOffering(
					"Luxury Yacht",
					"Experience a high‑end yacht cruise",
					new BigDecimal("500.00"),
					"/images/yacht.jpeg"
			));

			// You can add more here…
		};
	}
}
