package com.flynow.repository;

import java.sql.Timestamp;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.flynow.domain.Flight;
import com.flynow.domain.enums.CurrencyCode;

@Repository
public class FlightRepository {

    private final JdbcTemplate jdbcTemplate;

    public FlightRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Flight> findAll() {
        String sql = """
                SELECT
                    id,
                    flight_number,
                    airline_code,
                    airline_name,
                    origin_iata,
                    destination_iata,
                    departure_time,
                    arrival_time,
                    duration_minutes,
                    stops,
                    base_price,
                    currency,
                    available_seats
                FROM flights
                ORDER BY departure_time ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> Flight.builder()
                .id(rs.getLong("id"))
                .flightNumber(rs.getString("flight_number"))
                .airlineCode(rs.getString("airline_code"))
                .airlineName(rs.getString("airline_name"))
                .originIata(rs.getString("origin_iata"))
                .destinationIata(rs.getString("destination_iata"))
                .departureTime(rs.getObject("departure_time", Timestamp.class).toLocalDateTime())
                .arrivalTime(rs.getObject("arrival_time", Timestamp.class).toLocalDateTime())
                .durationMinutes(rs.getInt("duration_minutes"))
                .stops(rs.getInt("stops"))
                .basePrice(rs.getBigDecimal("base_price"))
                .currency(CurrencyCode.valueOf(rs.getString("currency")))
                .availableSeats(rs.getInt("available_seats"))
                .build());
    }
}
