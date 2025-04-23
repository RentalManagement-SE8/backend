package SE2.RMS.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import SE2.RMS.model.Account;
import SE2.RMS.payload.AccountDTO;
import SE2.RMS.payload.LoginDTO;
import SE2.RMS.services.AccountService;
import SE2.RMS.services.EmailService;
import SE2.RMS.services.TokenService;
import SE2.RMS.services.VerificationService;
import io.swagger.v3.oas.annotations.Operation;
import java.util.Collections;
import java.util.Map;
import java.util.Random;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

@RestController
public class AuthController {

    private final AccountService accountService;
    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String googleClientId;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private VerificationService verificationService;

    @Autowired
    private EmailService emailService;

    private TokenService tokenService;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String googleClientSecret;

    AuthController(AccountService accountService, TokenService tokenservice) {
        this.accountService = accountService;
        this.tokenService = tokenservice;
    }

    @GetMapping("/")
    public String home() {
        return "Welcome to auth controller";
    }

    // @PostMapping(value = "/register", produces = "application/json")
    // @ResponseStatus(HttpStatus.CREATED)
    // @Operation(summary = "Add a new User")
    // public ResponseEntity<String> addUser(@Valid @RequestBody AccountDTO
    // accountDTO) {
    // try {
    // System.out.println("here");
    // Account account = new Account();
    // account.setEmail(accountDTO.getEmail());
    // account.setPassword(accountDTO.getPassword());
    // account.setFirstname(accountDTO.getFirstname());
    // account.setLastname(accountDTO.getLastname());
    // String role = "ROLE_USER";
    // account.setAuthorities(role);
    // String type = "MANUAL";
    // account.setType(type);
    // System.out.println("Saving account: " + account);

    // accountService.save(account);
    // return ResponseEntity.ok("USER_ADDED");

    // } catch (Exception e) {
    // e.printStackTrace();
    // return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
    // }

    // }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AccountDTO accountDTO) {
        if (accountService.findByEmail(accountDTO.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Collections.singletonMap("message", "Email already exists"));
        }

        // Generate 6-digit OTP
        // System.out.println("till here is fine");
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Save OTP + account temporarily
        // System.out.println("till here is also fine");
        verificationService.storeOtp(accountDTO.getEmail(), accountDTO, otp);

        // Send OTP via email
        // System.out.println("till here is also also fine");
        emailService.sendOtp(accountDTO.getEmail(), otp);

        System.out.println("till here is also also also fine");

        return ResponseEntity.ok(Collections.singletonMap("message", "OTP sent to email"));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");

        if (!verificationService.verifyOtp(email, otp)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Invalid or expired OTP"));
        }

        AccountDTO dto = verificationService.getAccount(email);
        if (dto == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Collections.singletonMap("message", "Account data not found"));
        }

        Account account = new Account();
        account.setEmail(dto.getEmail());
        account.setFirstname(dto.getFirstname());
        account.setLastname(dto.getLastname());
        account.setPassword(dto.getPassword()); // will be encoded in service
        account.setAuthorities("ROLE_USER");
        account.setType("MANUAL");

        accountService.save(account);
        verificationService.clear(email); // cleanup

        return ResponseEntity.ok(Collections.singletonMap("message", "Email verified and account created"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO customer) {
        System.out.println("Trying to authenticate: " + customer.getEmail());

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(customer.getEmail(), customer.getPassword()));
            System.out.println("Authentication successful for: " + customer.getEmail());
            String token = tokenService.generateToken(authentication);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            System.out.println("Authentication failed: " + e.getMessage());

            // Return 401 Unauthorized with JSON body
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Collections.singletonMap("message", "Bad credentials"));
        }
    }

    @GetMapping("/profile")
    @Operation(summary = "Get user profile information")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authorizationHeader) {
        try {
            String token = authorizationHeader.replace("Bearer ", "");

            if (!tokenService.validateToken(token)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired token");
            }

            Authentication authentication = tokenService.extractAuthentication(token);
            if (authentication == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication failed");
            }

            String username = authentication.getName();
            Account account = accountService.findByEmail(username).orElse(null);
            if (account == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
            return ResponseEntity.ok(account);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error processing token");
        }
    }

    @PostMapping("/auth/google")
    public ResponseEntity<String> googleLogin(@RequestBody String googleToken) {
        try {
            System.out.println("I am here0");

            // ✅ Directly append token — DO NOT use {credential}
            String url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + googleToken;

            RestTemplate restTemplate = new RestTemplate();
            System.out.println("I am here1");

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(url, Map.class); // ✅ not String.class

            System.out.println("I am here2");

            if (response != null && response.containsKey("email")) {
                String email = (String) response.get("email");
                System.out.println("I am here3");

                Account account = accountService.findByEmail(email).orElse(null);
                if (account == null) {
                    account = new Account();
                    account.setEmail(email);
                    account.setAuthorities("ROLE_USER");
                    account.setType("GOOGLE");
                    accountService.save(account);
                }

                System.out.println("I am here4");
                return ResponseEntity.ok("USER_LOGGED_IN");
            }

            System.out.println("I am here5");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid token");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing token");
        }
    }

}
