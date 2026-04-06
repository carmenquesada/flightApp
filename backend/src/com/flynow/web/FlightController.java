package com.flynow.web;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.flynow.domain.Flight;
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
            @RequestParam(required = false) String destination) {

        boolean hasOrigin = origin != null && !origin.isBlank();
        boolean hasDestination = destination != null && !destination.isBlank();

        if (hasOrigin && hasDestination) {
            return flightRepository.findByRoute(origin.trim(), destination.trim());
        }

        if (hasOrigin || hasDestination) {
            return List.of();
        }

        return flightRepository.findAll();
    }

    @GetMapping("/options")
    public Map<String, List<String>> getFlightSearchOptions() {
        return Map.of(
                "locations", flightRepository.findDistinctRoutePoints(),
                "origins", flightRepository.findDistinctOrigins(),
                "destinations", flightRepository.findDistinctDestinations());
    }
}
