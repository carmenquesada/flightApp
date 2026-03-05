package com.flynow.domain;

import com.flynow.domain.enums.BookingStatus;
import com.flynow.domain.enums.CurrencyCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    private Long id;

    private String bookingCode;     // e.g., PNR-like: FN8K2Q
    private BookingStatus status;

    private Long userId;
    private Long flightId;

    private Integer passengersCount;

    private BigDecimal totalPrice;
    private CurrencyCode currency;

    private Instant createdAt;
}