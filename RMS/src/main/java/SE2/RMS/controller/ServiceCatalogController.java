package SE2.RMS.controller;

import org.springframework.web.bind.annotation.*;
import java.util.List;
import SE2.RMS.model.ServiceOffering;
import SE2.RMS.services.ServiceCatalogService;

@RestController
@RequestMapping("/api/services")
public class ServiceCatalogController {
    private final ServiceCatalogService service;

    public ServiceCatalogController(ServiceCatalogService service) {
        this.service = service;
    }

    /** GET /api/services → list all */
    @GetMapping
    public List<ServiceOffering> listAll() {
        return service.getAllOfferings();
    }
}
