package com.flynow.web;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.flynow.domain.User;
import com.flynow.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public PublicUser register(@RequestBody RegisterRequest request) {
        String name = sanitize(request.name());
        String email = sanitize(request.email()).toLowerCase();
        String password = sanitize(request.password());
        String phone = sanitize(request.phone());

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nombre, email y password son obligatorios");
        }

        if (!email.contains("@")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El email no tiene formato valido");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya existe un usuario con ese email");
        }

        User created = userRepository.create(name, email, hashPassword(password), phone.isBlank() ? null : phone);
        return PublicUser.from(created);
    }

    @PostMapping("/login")
    public PublicUser login(@RequestBody LoginRequest request) {
        String email = sanitize(request.email()).toLowerCase();
        String password = sanitize(request.password());

        if (email.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email y password son obligatorios");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas"));

        if (!verifyPassword(password, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciales invalidas");
        }

        return PublicUser.from(user);
    }

    private String sanitize(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean verifyPassword(String rawPassword, String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return false;
        }

        String rawHash = hashPassword(rawPassword);
        return storedValue.equals(rawHash) || storedValue.equals(rawPassword);
    }

    private String hashPassword(String rawPassword) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("No se pudo aplicar hash a la password", ex);
        }
    }

    public record RegisterRequest(String name, String email, String password, String phone) {
    }

    public record LoginRequest(String email, String password) {
    }

    public record PublicUser(Long id, String name, String email, String phone, java.time.Instant createdAt) {
        static PublicUser from(User user) {
            return new PublicUser(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getCreatedAt());
        }
    }
}
