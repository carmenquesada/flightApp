package com.flynow.repository;

import java.sql.Timestamp;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.flynow.domain.BookingDetails;
import com.flynow.domain.enums.BookingStatus;
import com.flynow.domain.enums.CurrencyCode;

@Repository
public class BookingRepository {

    private final JdbcTemplate jdbcTemplate;

    public BookingRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<BookingDetails> findByUserId(Long userId) {
        String sql = """
                SELECT
                    b.id AS booking_id,
                    b.booking_code,
                    b.status,
                    b.passengers_count,
                    b.total_price,
                    b.currency,
                    b.created_at,
                    f.id AS flight_id,
                    f.flight_number,
                    f.airline_name,
                    f.origin_iata,
                    f.destination_iata,
                    f.departure_time,
                    f.arrival_time
                FROM bookings b
                INNER JOIN flights f ON f.id = b.flight_id
                WHERE b.user_id = ?
                ORDER BY b.created_at DESC
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new BookingDetails(
            rs.getLong("booking_id"),
            rs.getString("booking_code"),
            BookingStatus.valueOf(rs.getString("status")),
            rs.getInt("passengers_count"),
            rs.getBigDecimal("total_price"),
            CurrencyCode.valueOf(rs.getString("currency")),
            rs.getObject("created_at", Timestamp.class).toInstant(),
            rs.getLong("flight_id"),
            rs.getString("flight_number"),
            rs.getString("airline_name"),
            rs.getString("origin_iata"),
            rs.getString("destination_iata"),
            rs.getObject("departure_time", Timestamp.class).toLocalDateTime(),
            rs.getObject("arrival_time", Timestamp.class).toLocalDateTime()), userId);
    }
}
