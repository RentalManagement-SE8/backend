package SE2.RMS.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;

import SE2.RMS.model.Ordertable;
import SE2.RMS.services.OrderService;
import SE2.RMS.services.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:3000")
public class PaymentController {

    private final PaymentService paymentService;
    private final OrderService orderService;

    public PaymentController(PaymentService paymentService, OrderService orderService) {
        this.paymentService = paymentService;
        this.orderService = orderService;
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckoutSession(@RequestBody Ordertable orderRequest) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();

            // ✅ Construct a clean order
            Ordertable order = new Ordertable();
            order.setServiceName(orderRequest.getServiceName());
            order.setTotalPrice(orderRequest.getTotalPrice());
            order.setCustomerEmail(userEmail);
            order.setPaid(true); // ✅ Always false initially

            // ✅ Save it, and DB will auto-generate ID
            Ordertable savedOrder = orderService.save(order);

            // ✅ Create Stripe checkout session
            Session session = paymentService.createCheckoutSession(savedOrder);

            // ✅ Return only the Stripe URL
            return ResponseEntity.ok().body(new java.util.HashMap<>() {
                {
                    put("url", session.getUrl());
                }
            });
        } catch (StripeException e) {
            return ResponseEntity.status(500).body("Stripe error: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        String endpointSecret = "whsec_..."; // Copy from Stripe dashboard

        try {
            Event event = Webhook.constructEvent(payload, sigHeader, endpointSecret);

            if ("checkout.session.completed".equals(event.getType())) {
                Session session = (Session) event.getDataObjectDeserializer().getObject().orElse(null);

                if (session != null) {
                    String orderIdStr = session.getMetadata().get("orderId");
                    Long orderId = Long.parseLong(orderIdStr);

                    Ordertable order = orderService.findById(orderId).orElse(null);
                    if (order != null && !order.isPaid()) {
                        order.setPaid(true);
                        orderService.save(order);
                        System.out.println("✅ Order " + orderId + " marked as paid.");
                    }
                }
            }

            return ResponseEntity.ok("Webhook received");
        } catch (SignatureVerificationException e) {
            return ResponseEntity.status(400).body("Invalid signature");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body("Webhook error");
        }
    }
}
