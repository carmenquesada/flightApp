package com.flynow.domain;

import com.flynow.domain.enums.CurrencyCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flight {
    private Long id;

    private String flightNumber;   // e.g., IB1234
    private String airlineCode;    // e.g., IB
    private String airlineName;    // e.g., Iberia

    private String originIata;     // e.g., MAD
    private String destinationIata;// e.g., OPO

    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;

    private Integer durationMinutes;
    private Integer stops;         // 0 direct, 1 one-stop, etc.

    private BigDecimal basePrice;
    private CurrencyCode currency;

    private Integer availableSeats;
}