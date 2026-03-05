package com.flynow.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Passenger {
    private Long id;

    private Long bookingId;

    private String firstName;
    private String lastName;

    private String documentId; // DNI/Passport
    private LocalDate birthDate;
}