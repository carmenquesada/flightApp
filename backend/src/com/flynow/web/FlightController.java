package com.flynow.web;

import java.util.List;
import java.util.Map;
import java.time.LocalDate;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import com.flynow.domain.Flight;
import com.flynow.domain.enums.TravelClass;
import com.flynow.repository.FlightRepository;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "*")
public class FlightController {

    private final FlightRepository flightRepository;

    public FlightController(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    @GetMapping
    public List<Flight> findAllFlights(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) String departureDate,
            @RequestParam(required = false) String returnDate,
            @RequestParam(required = false) Integer passengers,
            @RequestParam(required = false) String travelClass) {

        boolean hasOrigin = origin != null && !origin.isBlank();
        boolean hasDestination = destination != null && !destination.isBlank();

        if (hasOrigin != hasDestination) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Origen y destino son obligatorios");
        }

        if (!hasOrigin && !hasDestination) {
            return flightRepository.findAll();
        }

        LocalDate parsedDepartureDate = parseDateOrNull(departureDate, "departureDate");
        LocalDate parsedReturnDate = parseDateOrNull(returnDate, "returnDate");

        if (parsedDepartureDate != null && parsedReturnDate != null && parsedReturnDate.isBefore(parsedDepartureDate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "returnDate no puede ser anterior a departureDate");
        }

        if (passengers != null && passengers <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "passengers debe ser mayor que cero");
        }

        TravelClass parsedTravelClass = parseTravelClassOrNull(travelClass);

        return flightRepository.findBySearchCriteria(
                origin.trim(),
                destination.trim(),
                parsedDepartureDate,
                parsedReturnDate,
                passengers,
                parsedTravelClass);
    }

    private LocalDate parseDateOrNull(String value, String paramName) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Formato invalido para " + paramName + " (usa yyyy-MM-dd)");
        }
    }

    private TravelClass parseTravelClassOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return TravelClass.valueOf(value.trim().toUpperCase());
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "travelClass invalida. Usa economy, premium o business");
        }
    }

    @GetMapping("/options")
    public Map<String, List<String>> getFlightSearchOptions() {
        return Map.of(
                "locations", flightRepository.findDistinctRoutePoints(),
                "origins", flightRepository.findDistinctOrigins(),
                "destinations", flightRepository.findDistinctDestinations());
    }
}
