package SE2.RMS.repository;

import SE2.RMS.model.Ordertable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Ordertable, Long> {
}
