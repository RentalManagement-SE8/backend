package SE2.RMS.services;

import org.springframework.stereotype.Service;
import java.util.List;
import SE2.RMS.model.ServiceOffering;
import SE2.RMS.repository.ServiceOfferingRepository;

@Service
public class ServiceCatalogService {
    private final ServiceOfferingRepository repo;

    public ServiceCatalogService(ServiceOfferingRepository repo) {
        this.repo = repo;
    }

    /** Return all offerings. Later you can add filtering here. */
    public List<ServiceOffering> getAllOfferings() {
        return repo.findAll();
    }
}
