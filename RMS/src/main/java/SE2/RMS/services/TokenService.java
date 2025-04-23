package SE2.RMS.services;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final JwtEncoder encoder;

    private final JwtDecoder decoder;

    public TokenService(JwtEncoder encoder, JwtDecoder decoder) {
        this.encoder = encoder;
        this.decoder = decoder;
    }

    public String generateToken(Authentication authentication) {
        Instant now = Instant.now();
        String scope = authentication
                .getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(" "));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("self")
                .issuedAt(now)
                .expiresAt(now.plus(1, ChronoUnit.HOURS))
                .subject(authentication.getName())
                .claim("scope", scope)
                .build();

        return this.encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
    }

    public Authentication extractAuthentication(String token) {
        try {
            Jwt jwt = this.decoder.decode(token); // Decode the JWT token
            String username = jwt.getSubject(); // Extract the subject (email or username)
            // You can also extract authorities or roles from the JWT if needed
            return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(username, "",
                    null);
        } catch (JwtException e) {
            // If token is invalid, return null or throw an exception depending on your
            // security strategy
            return null;
        }
    }

    public boolean validateToken(String token) {
        try {
            this.decoder.decode(token); // Try to decode the token
            return true; // If decoding is successful, the token is valid
        } catch (JwtException e) {
            return false; // If an exception is thrown, the token is invalid
        }
    }

}
