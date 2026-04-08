package com.flynow.web;

import java.math.BigDecimal;
import java.util.Random;

import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.flynow.domain.Booking;
import com.flynow.domain.Flight;
import com.flynow.domain.User;
import com.flynow.domain.enums.CurrencyCode;
import com.flynow.repository.BookingRepository;
import com.flynow.repository.FlightRepository;
import com.flynow.repository.UserRepository;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingRepository bookingRepository;
    private final FlightRepository flightRepository;
    private final UserRepository userRepository;
    private final Random random = new Random();

    public BookingController(BookingRepository bookingRepository, FlightRepository flightRepository, UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.flightRepository = flightRepository;
        this.userRepository = userRepository;
    }

    @PostMapping
    public BookingResponse create(@RequestBody CreateBookingRequest request) {
        // Validate inputs
        if (request.userId() == null || request.userId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuario invalido");
        }

        if (request.flightId() == null || request.flightId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vuelo invalido");
        }

        if (request.passengersCount() == null || request.passengersCount() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Numero de pasajeros debe ser al menos 1");
        }

        // Verify user exists
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado"));

        // Verify flight exists and has seats available
        Flight flight = flightRepository.findById(request.flightId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vuelo no encontrado"));

        if (flight.getAvailableSeats() == null || flight.getAvailableSeats() < request.passengersCount()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No hay suficientes asientos disponibles");
        }

        // Generate unique booking code
        String bookingCode = generateUniqueBookingCode();

        // Calculate total price: basePrice * passengersCount
        BigDecimal totalPrice = flight.getBasePrice().multiply(new BigDecimal(request.passengersCount()));

        // Create booking
        Booking booking = bookingRepository.create(
                bookingCode,
                request.userId(),
                request.flightId(),
                request.passengersCount(),
                totalPrice,
                flight.getCurrency());

        return new BookingResponse(
                booking.getId(),
                booking.getBookingCode(),
                booking.getStatus().toString(),
                booking.getPassengersCount(),
                booking.getTotalPrice(),
                booking.getCurrency().toString(),
                booking.getCreatedAt());
    }

    @PatchMapping("/{bookingId}/cancel")
    public BookingResponse cancel(@PathVariable Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        if (booking.getStatus().name().equals("CANCELLED")) {
            return new BookingResponse(
                    booking.getId(),
                    booking.getBookingCode(),
                    booking.getStatus().toString(),
                    booking.getPassengersCount(),
                    booking.getTotalPrice(),
                    booking.getCurrency().toString(),
                    booking.getCreatedAt()
            );
        }

        bookingRepository.cancelBooking(bookingId);

        Booking updatedBooking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reserva no encontrada"));

        return new BookingResponse(
                updatedBooking.getId(),
                updatedBooking.getBookingCode(),
                updatedBooking.getStatus().toString(),
                updatedBooking.getPassengersCount(),
                updatedBooking.getTotalPrice(),
                updatedBooking.getCurrency().toString(),
                updatedBooking.getCreatedAt());
    }

    private String generateUniqueBookingCode() {
        // Generate a booking code in format FN + 4 random alphanumeric characters
        // Example: FN9A2K
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder("FN");

        for (int i = 0; i < 4; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }

        return code.toString();
    }

    public record CreateBookingRequest(Long userId, Long flightId, Integer passengersCount) {
    }

    public record BookingResponse(Long id, String bookingCode, String status, Integer passengersCount, BigDecimal totalPrice, String currency, java.time.Instant createdAt) {
    }
}
