package SE2.RMS.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import SE2.RMS.model.ServiceOffering;

public interface ServiceOfferingRepository
        extends JpaRepository<ServiceOffering, Long> { }
