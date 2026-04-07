package com.flynow.repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.flynow.domain.Booking;
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

    public Booking create(String bookingCode, Long userId, Long flightId, Integer passengersCount, BigDecimal totalPrice, CurrencyCode currency) {
        String sql = """
                INSERT INTO bookings (booking_code, status, user_id, flight_id, passengers_count, total_price, currency, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """;

        Instant now = Instant.now();

        try {
            jdbcTemplate.update(sql,
                    bookingCode,
                    BookingStatus.CONFIRMED.toString(),
                    userId,
                    flightId,
                    passengersCount,
                    totalPrice,
                    currency.toString(),
                    Timestamp.from(now));

            Long bookingId = jdbcTemplate.queryForObject(
                    "SELECT id FROM bookings WHERE booking_code = ?",
                    Long.class,
                    bookingCode);

            return new Booking(
                    bookingId,
                    bookingCode,
                    BookingStatus.CONFIRMED,
                    userId,
                    flightId,
                    passengersCount,
                    totalPrice,
                    currency,
                    now);
        } catch (Exception ex) {
            throw new RuntimeException("Error creating booking", ex);
        }
    }
    
    public Optional<Booking> findById(Long bookingId) {
    String sql = """
            SELECT
                id,
                booking_code,
                status,
                user_id,
                flight_id,
                passengers_count,
                total_price,
                currency,
                created_at
            FROM bookings
            WHERE id = ?
            """;

    try {
        Booking booking = jdbcTemplate.queryForObject(sql, (rs, rowNum) -> new Booking(
                rs.getLong("id"),
                rs.getString("booking_code"),
                BookingStatus.valueOf(rs.getString("status")),
                rs.getLong("user_id"),
                rs.getLong("flight_id"),
                rs.getInt("passengers_count"),
                rs.getBigDecimal("total_price"),
                CurrencyCode.valueOf(rs.getString("currency")),
                rs.getObject("created_at", Timestamp.class).toInstant()
        ), bookingId);

        return Optional.ofNullable(booking);
    } catch (Exception ex) {
        return Optional.empty();
    }
    }

    public void cancelBooking(Long bookingId) {
        String sql = """
                UPDATE bookings
                SET status = ?
                WHERE id = ?
                """;

        jdbcTemplate.update(sql, BookingStatus.CANCELLED.toString(), bookingId);
    }
}
