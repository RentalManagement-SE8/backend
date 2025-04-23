package SE2.RMS.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.media.Schema.RequiredMode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class AccountDTO {

    @Size(min = 2, max = 20)
    @Schema(description = "firstname", example = "Dev", requiredMode = RequiredMode.REQUIRED, maxLength = 20, minLength = 2)
    private String firstname;

    @Size(min = 2, max = 20)
    @Schema(description = "lastname", example = "Patel", requiredMode = RequiredMode.REQUIRED, maxLength = 20, minLength = 2)
    private String lastname;

    @Email
    @Schema(description = "Email address", example = "dev0408patel@gmail.com", requiredMode = RequiredMode.REQUIRED)
    private String email;

    @Size(min = 6, max = 20)
    @Schema(description = "Password", example = "Password", requiredMode = RequiredMode.REQUIRED, maxLength = 20, minLength = 6)
    private String password;

}
