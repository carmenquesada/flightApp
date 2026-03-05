package com.flynow.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Airport {
    private Long id;
    private String iataCode; // e.g., MAD
    private String name;
    private String city;
    private String country;
}