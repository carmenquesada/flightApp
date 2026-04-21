package com.flynow.web;

import com.flynow.domain.City;
import com.flynow.repository.CityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cities")
@CrossOrigin(origins = "*")
public class CityController {

    @Autowired
    private CityRepository cityRepository;

    /**
     * Obtiene todas las ciudades disponibles
     */
    @GetMapping
    public ResponseEntity<List<City>> getAllCities() {
        return ResponseEntity.ok(cityRepository.findAll());
    }

    /**
     * Obtiene una ciudad por su código IATA
     * @param iataCode Código IATA de 3 letras (ej: MAD, BCN)
     */
    @GetMapping("/by-iata/{iataCode}")
    public ResponseEntity<City> getCityByIataCode(@PathVariable String iataCode) {
        Optional<City> city = cityRepository.findByIataCode(iataCode.toUpperCase());
        return city.map(ResponseEntity::ok)
                   .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
