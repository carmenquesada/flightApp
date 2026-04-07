package com.flynow.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.flynow.domain.BookingDetails;
import com.flynow.domain.User;
import com.flynow.repository.BookingRepository;
import com.flynow.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public UserController(UserRepository userRepository, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @GetMapping("/{userId}/profile")
    public PublicUser profile(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        return PublicUser.from(user);
    }

    @GetMapping("/{userId}/bookings")
    public List<BookingDetails> bookings(@PathVariable Long userId) {
        if (userRepository.findById(userId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }

        return bookingRepository.findByUserId(userId);
    }

    public record PublicUser(Long id, String name, String email, String phone, java.time.Instant createdAt) {
        static PublicUser from(User user) {
            return new PublicUser(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getCreatedAt());
        }
    }
}
