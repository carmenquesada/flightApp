package com.flynow.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

import com.flynow.domain.enums.BookingStatus;
import com.flynow.domain.enums.CurrencyCode;

public record BookingDetails(
        Long bookingId,
        String bookingCode,
        BookingStatus status,
        Integer passengersCount,
        BigDecimal totalPrice,
        CurrencyCode currency,
        Instant createdAt,
        Long flightId,
        String flightNumber,
        String airlineName,
        String originIata,
        String destinationIata,
        LocalDateTime departureTime,
        LocalDateTime arrivalTime) {
}
