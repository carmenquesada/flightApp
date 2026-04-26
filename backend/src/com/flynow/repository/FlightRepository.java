package com.flynow.repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.flynow.domain.Flight;
import com.flynow.domain.enums.CurrencyCode;
import com.flynow.domain.enums.TravelClass;

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
                    available_seats,
                    travel_class
                FROM flights
                ORDER BY departure_time ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> mapFlight(rs));
    }

    public List<Flight> findByRoute(String originIata, String destinationIata) {
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
                                        available_seats,
                                        travel_class
                FROM flights
                WHERE UPPER(origin_iata) = UPPER(?)
                  AND UPPER(destination_iata) = UPPER(?)
                ORDER BY departure_time ASC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> mapFlight(rs), originIata, destinationIata);
    }

    public List<String> findDistinctOrigins() {
        String sql = """
                SELECT DISTINCT origin_iata
                FROM flights
                ORDER BY origin_iata ASC
                """;

        return jdbcTemplate.queryForList(sql, String.class);
    }

    public List<String> findDistinctDestinations() {
        String sql = """
                SELECT DISTINCT destination_iata
                FROM flights
                ORDER BY destination_iata ASC
                """;

        return jdbcTemplate.queryForList(sql, String.class);
    }

    public List<String> findDistinctRoutePoints() {
        String sql = """
                SELECT iata FROM (
                    SELECT DISTINCT origin_iata AS iata FROM flights
                    UNION
                    SELECT DISTINCT destination_iata AS iata FROM flights
                ) route_points
                ORDER BY iata ASC
                """;

        return jdbcTemplate.queryForList(sql, String.class);
    }

    public Optional<Flight> findById(Long id) {
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
                    available_seats,
                    travel_class
                FROM flights
                WHERE id = ?
                """;

        try {
            Flight flight = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> mapFlight(rs), id);
            return Optional.of(flight);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public List<Flight> findBySearchCriteria(
            String originIata,
            String destinationIata,
            LocalDate departureDate,
            LocalDate returnDate,
            Integer passengers,
            TravelClass travelClass) {

        StringBuilder sql = new StringBuilder("""
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
                    available_seats,
                    travel_class
                FROM flights
                WHERE UPPER(origin_iata) = UPPER(?)
                  AND UPPER(destination_iata) = UPPER(?)
                """);

        List<Object> params = new ArrayList<>();
        params.add(originIata);
        params.add(destinationIata);

        if (departureDate != null) {
            sql.append(" AND DATE(departure_time) = ?");
            params.add(java.sql.Date.valueOf(departureDate));
        }

        if (returnDate != null) {
            sql.append(" AND departure_time <= ?");
            LocalDateTime endOfReturnDate = returnDate.plusDays(1).atStartOfDay();
            params.add(Timestamp.valueOf(endOfReturnDate));
        }

        if (passengers != null && passengers > 0) {
            sql.append(" AND available_seats >= ?");
            params.add(passengers);
        }

        if (travelClass != null) {
            sql.append(" AND travel_class = ?");
            params.add(travelClass.name());
        }

        sql.append(" ORDER BY departure_time ASC");

        return jdbcTemplate.query(sql.toString(), (rs, rowNum) -> mapFlight(rs), params.toArray());
    }

    private Flight mapFlight(java.sql.ResultSet rs) throws java.sql.SQLException {
        return Flight.builder()
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
                .travelClass(TravelClass.valueOf(rs.getString("travel_class")))
                .build();
    }
}
