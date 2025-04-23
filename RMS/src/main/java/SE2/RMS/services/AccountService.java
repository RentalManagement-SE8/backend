package SE2.RMS.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import SE2.RMS.model.Account;

@Service
public class AccountService implements UserDetailsService {
    @Autowired
    private SE2.RMS.repository.AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Account save(Account account) {
        System.out.println("Before encoding: " + account.getPassword());
        account.setPassword(passwordEncoder.encode(account.getPassword()));
        System.out.println("After encoding: " + account.getPassword());
        return accountRepository.save(account);
    }

    public List<Account> findall() {

        return accountRepository.findAll();

    }

    public Optional<Account> findByEmail(String email) {
        return accountRepository.findByEmail(email);

    }

    public Optional<Account> findByID(long id) {
        return accountRepository.findById(id);

    }

    public void deleteByID(long id) {
        accountRepository.deleteById(id);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<Account> optionaAccount = accountRepository.findByEmail(email);
        if (!optionaAccount.isPresent()) {
            throw new UsernameNotFoundException("Account not found");
        }
        Account account = optionaAccount.get();

        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        String role = (account.getAuthorities() != null) ? account.getAuthorities() : "ROLE_USER";
        grantedAuthorities.add(new SimpleGrantedAuthority(role));
        return new User(account.getEmail(), account.getPassword(), grantedAuthorities);
    }

}
