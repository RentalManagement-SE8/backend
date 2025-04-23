package SE2.RMS.services;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import SE2.RMS.model.Ordertable;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class PaymentService {

        @Value("${stripe.api.key}")
        private String stripeApiKey;

        @PostConstruct
        public void init() {
                Stripe.apiKey = stripeApiKey;
        }

        public Session createCheckoutSession(Ordertable order) throws StripeException {
                SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder()
                                .setQuantity(1L)
                                .setPriceData(
                                                SessionCreateParams.LineItem.PriceData.builder()
                                                                .setCurrency("usd")
                                                                .setUnitAmount((long) (order.getTotalPrice() * 100)) // in
                                                                // cents
                                                                .setProductData(
                                                                                SessionCreateParams.LineItem.PriceData.ProductData
                                                                                                .builder()
                                                                                                .setName("Delivery: "
                                                                                                                + order.getServiceName())
                                                                                                .build())
                                                                .build())
                                .build();

                SessionCreateParams params = SessionCreateParams.builder()
                                .setMode(SessionCreateParams.Mode.PAYMENT)
                                .setSuccessUrl("http://localhost:3000/payment-success?session_id={CHECKOUT_SESSION_ID}")
                                .setCancelUrl("http://localhost:3000/payment-cancel")
                                .addLineItem(lineItem)
                                .putMetadata("orderId", String.valueOf(order.getId())) // ✅ here
                                .build();

                return Session.create(params);
        }

}
