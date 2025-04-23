package SE2.RMS.services;

import SE2.RMS.model.Ordertable;
import SE2.RMS.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Optional<Ordertable> findById(Long id) {
        return orderRepository.findById(id);
    }

    // ✅ Add this method
    public Ordertable save(Ordertable order) {
        return orderRepository.save(order);
    }
}
