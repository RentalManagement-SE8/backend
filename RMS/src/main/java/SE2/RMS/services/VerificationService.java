
package SE2.RMS.services;

import org.springframework.stereotype.Service;
import SE2.RMS.payload.AccountDTO;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VerificationService {

    private static class OtpData {
        String otp;
        long timestamp; // stored in milliseconds
        AccountDTO accountDTO;

        OtpData(String otp, AccountDTO accountDTO) {
            this.otp = otp;
            this.timestamp = System.currentTimeMillis();
            this.accountDTO = accountDTO;
        }
    }

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    public void storeOtp(String email, AccountDTO dto, String otp) {
        otpStorage.put(email, new OtpData(otp, dto));
    }

    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStorage.get(email);
        if (data == null)
            return false;

        long currentTime = System.currentTimeMillis();
        long ageInSeconds = (currentTime - data.timestamp) / 1000;

        // Check if OTP matches AND is within 60 seconds
        return data.otp.equals(otp) && ageInSeconds <= 60;
    }

    public AccountDTO getAccount(String email) {
        OtpData data = otpStorage.get(email);
        return data != null ? data.accountDTO : null;
    }

    public void clear(String email) {
        otpStorage.remove(email);
    }
}
