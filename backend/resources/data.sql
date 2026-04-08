DROP TABLE IF EXISTS passengers;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS flights;
DROP TABLE IF EXISTS airports;

CREATE TABLE airports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    iata_code VARCHAR(3) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL
);

CREATE TABLE flights (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    airline_code VARCHAR(5) NOT NULL,
    airline_name VARCHAR(255) NOT NULL,
    origin_iata VARCHAR(3) NOT NULL,
    destination_iata VARCHAR(3) NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    duration_minutes INT NOT NULL,
    stops INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    available_seats INT NOT NULL,
    CONSTRAINT fk_flights_origin_iata FOREIGN KEY (origin_iata) REFERENCES airports(iata_code),
    CONSTRAINT fk_flights_destination_iata FOREIGN KEY (destination_iata) REFERENCES airports(iata_code)
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    user_id BIGINT NOT NULL,
    flight_id BIGINT NOT NULL,
    passengers_count INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user_id FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_flight_id FOREIGN KEY (flight_id) REFERENCES flights(id)
);

CREATE TABLE passengers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    document_id VARCHAR(50) NOT NULL,
    birth_date DATE,
    CONSTRAINT fk_passengers_booking_id FOREIGN KEY (booking_id) REFERENCES bookings(id)
);

INSERT INTO airports (iata_code, name, city, country) VALUES
('MAD', 'Adolfo Suarez Madrid-Barajas Airport', 'Madrid', 'Spain'),
('BCN', 'Josep Tarradellas Barcelona-El Prat Airport', 'Barcelona', 'Spain'),
('SVQ', 'Seville Airport', 'Seville', 'Spain'),
('OPO', 'Francisco Sa Carneiro Airport', 'Porto', 'Portugal'),
('LIS', 'Humberto Delgado Airport', 'Lisbon', 'Portugal'),
('CDG', 'Charles de Gaulle Airport', 'Paris', 'France'),
('FCO', 'Leonardo da Vinci International Airport', 'Rome', 'Italy'),
('LHR', 'Heathrow Airport', 'London', 'United Kingdom'),
('PMI', 'Palma de Mallorca Airport', 'Palma', 'Spain'),
('BIO', 'Bilbao Airport', 'Bilbao', 'Spain'),
('TFN', 'Tenerife North Airport', 'Tenerife', 'Spain'),
('AMS', 'Amsterdam Airport Schiphol', 'Amsterdam', 'Netherlands'),
('FRA', 'Frankfurt Airport', 'Frankfurt', 'Germany');

INSERT INTO flights (
    flight_number, airline_code, airline_name,
    origin_iata, destination_iata,
    departure_time, arrival_time,
    duration_minutes, stops, base_price, currency, available_seats
) VALUES
('IB1145', 'IB', 'Iberia', 'MAD', 'BCN', '2026-03-15 08:00:00', '2026-03-15 09:20:00', 80, 0, 64.90, 'EUR', 120),
('VY2210', 'VY', 'Vueling', 'BCN', 'SVQ', '2026-03-15 10:05:00', '2026-03-15 11:45:00', 100, 0, 52.50, 'EUR', 95),
('TP1021', 'TP', 'TAP Air Portugal', 'MAD', 'LIS', '2026-03-16 07:30:00', '2026-03-16 08:45:00', 75, 0, 71.00, 'EUR', 88),
('FR5030', 'FR', 'Ryanair', 'SVQ', 'OPO', '2026-03-16 14:10:00', '2026-03-16 15:20:00', 70, 0, 34.99, 'EUR', 140),
('AF1301', 'AF', 'Air France', 'MAD', 'CDG', '2026-03-17 09:15:00', '2026-03-17 11:20:00', 125, 0, 129.00, 'EUR', 76),
('AZ0058', 'AZ', 'ITA Airways', 'BCN', 'FCO', '2026-03-17 13:45:00', '2026-03-17 15:35:00', 110, 0, 119.40, 'EUR', 82),
('BA0471', 'BA', 'British Airways', 'LIS', 'LHR', '2026-03-18 06:50:00', '2026-03-18 09:35:00', 165, 0, 152.25, 'EUR', 64),
('IB3401', 'IB', 'Iberia', 'SVQ', 'MAD', '2026-03-18 18:25:00', '2026-03-18 19:35:00', 70, 0, 48.75, 'EUR', 110),
('TP1932', 'TP', 'TAP Air Portugal', 'OPO', 'BCN', '2026-03-19 12:20:00', '2026-03-19 14:05:00', 105, 0, 86.10, 'EUR', 73),
('VY1102', 'VY', 'Vueling', 'MAD', 'OPO', '2026-03-20 16:30:00', '2026-03-20 17:40:00', 70, 0, 59.95, 'EUR', 98),

('IB2201', 'IB', 'Iberia', 'MAD', 'SVQ', '2026-05-10 09:00:00', '2026-05-10 10:10:00', 70, 0, 49.90, 'EUR', 100),
('IB2202', 'IB', 'Iberia', 'SVQ', 'MAD', '2026-05-10 12:30:00', '2026-05-10 13:40:00', 70, 0, 52.90, 'EUR', 95),
('VY2203', 'VY', 'Vueling', 'MAD', 'LIS', '2026-05-11 08:15:00', '2026-05-11 09:30:00', 75, 0, 57.50, 'EUR', 90),
('TP2204', 'TP', 'TAP Air Portugal', 'LIS', 'MAD', '2026-05-11 18:10:00', '2026-05-11 19:25:00', 75, 0, 60.00, 'EUR', 88),
('FR2205', 'FR', 'Ryanair', 'MAD', 'OPO', '2026-05-12 07:20:00', '2026-05-12 08:30:00', 70, 0, 39.99, 'EUR', 120),
('FR2206', 'FR', 'Ryanair', 'OPO', 'MAD', '2026-05-12 21:15:00', '2026-05-12 22:25:00', 70, 0, 41.99, 'EUR', 115),
('VY2207', 'VY', 'Vueling', 'BCN', 'MAD', '2026-05-13 10:00:00', '2026-05-13 11:20:00', 80, 0, 58.90, 'EUR', 100),
('IB2208', 'IB', 'Iberia', 'MAD', 'BCN', '2026-05-13 15:40:00', '2026-05-13 17:00:00', 80, 0, 64.90, 'EUR', 105),
('AF2209', 'AF', 'Air France', 'MAD', 'CDG', '2026-05-14 06:45:00', '2026-05-14 08:55:00', 130, 0, 129.00, 'EUR', 70),
('AF2210', 'AF', 'Air France', 'CDG', 'MAD', '2026-05-14 19:10:00', '2026-05-14 21:20:00', 130, 0, 125.00, 'EUR', 68),
('AZ2211', 'AZ', 'ITA Airways', 'BCN', 'FCO', '2026-05-15 09:35:00', '2026-05-15 11:25:00', 110, 0, 89.90, 'EUR', 84),
('AZ2212', 'AZ', 'ITA Airways', 'FCO', 'BCN', '2026-05-15 17:20:00', '2026-05-15 19:10:00', 110, 0, 92.50, 'EUR', 82),
('BA2213', 'BA', 'British Airways', 'LIS', 'LHR', '2026-05-16 08:50:00', '2026-05-16 11:40:00', 170, 0, 149.90, 'EUR', 60),
('BA2214', 'BA', 'British Airways', 'LHR', 'LIS', '2026-05-16 14:25:00', '2026-05-16 17:15:00', 170, 0, 152.00, 'EUR', 58),
('IB2215', 'IB', 'Iberia', 'SVQ', 'BCN', '2026-05-17 11:15:00', '2026-05-17 12:55:00', 100, 0, 54.90, 'EUR', 110),
('VY2216', 'VY', 'Vueling', 'BCN', 'SVQ', '2026-05-17 20:05:00', '2026-05-17 21:45:00', 100, 0, 56.90, 'EUR', 108),
('TP2217', 'TP', 'TAP Air Portugal', 'OPO', 'BCN', '2026-05-18 13:00:00', '2026-05-18 14:45:00', 105, 0, 74.90, 'EUR', 72),
('TP2218', 'TP', 'TAP Air Portugal', 'BCN', 'OPO', '2026-05-18 16:20:00', '2026-05-18 18:05:00', 105, 0, 76.50, 'EUR', 70),
('FR2219', 'FR', 'Ryanair', 'SVQ', 'OPO', '2026-05-19 07:40:00', '2026-05-19 08:50:00', 70, 0, 34.99, 'EUR', 140),
('FR2220', 'FR', 'Ryanair', 'OPO', 'SVQ', '2026-05-19 22:10:00', '2026-05-19 23:20:00', 70, 0, 36.99, 'EUR', 138),
('IB2221', 'IB', 'Iberia', 'MAD', 'LHR', '2026-05-20 09:30:00', '2026-05-20 12:00:00', 150, 0, 134.90, 'EUR', 66),
('BA2222', 'BA', 'British Airways', 'LHR', 'MAD', '2026-05-20 18:35:00', '2026-05-20 21:05:00', 150, 0, 138.50, 'EUR', 64),
('UX2223', 'UX', 'Air Europa', 'MAD', 'PMI', '2026-05-21 08:10:00', '2026-05-21 09:30:00', 80, 0, 45.50, 'EUR', 120),
('UX2224', 'UX', 'Air Europa', 'PMI', 'MAD', '2026-05-21 20:15:00', '2026-05-21 21:35:00', 80, 0, 47.00, 'EUR', 118),
('VY2225', 'VY', 'Vueling', 'BCN', 'PMI', '2026-05-22 12:25:00', '2026-05-22 13:15:00', 50, 0, 29.99, 'EUR', 130),
('VY2226', 'VY', 'Vueling', 'PMI', 'BCN', '2026-05-22 18:45:00', '2026-05-22 19:35:00', 50, 0, 31.99, 'EUR', 128),
('IB2227', 'IB', 'Iberia', 'MAD', 'FCO', '2026-05-23 07:55:00', '2026-05-23 10:20:00', 145, 0, 119.00, 'EUR', 75),
('AZ2228', 'AZ', 'ITA Airways', 'FCO', 'MAD', '2026-05-23 16:10:00', '2026-05-23 18:35:00', 145, 0, 122.00, 'EUR', 73),
('LH2229', 'LH', 'Lufthansa', 'MAD', 'FRA', '2026-05-24 10:40:00', '2026-05-24 13:10:00', 150, 0, 139.00, 'EUR', 62),
('LH2230', 'LH', 'Lufthansa', 'FRA', 'MAD', '2026-05-24 17:20:00', '2026-05-24 19:50:00', 150, 0, 142.00, 'EUR', 60),
('KL2231', 'KL', 'KLM', 'BCN', 'AMS', '2026-05-25 06:50:00', '2026-05-25 09:20:00', 150, 0, 127.00, 'EUR', 65),
('KL2232', 'KL', 'KLM', 'AMS', 'BCN', '2026-05-25 14:30:00', '2026-05-25 17:00:00', 150, 0, 129.00, 'EUR', 63),
('IB2233', 'IB', 'Iberia', 'MAD', 'BIO', '2026-05-26 09:25:00', '2026-05-26 10:30:00', 65, 0, 42.00, 'EUR', 112),
('IB2234', 'IB', 'Iberia', 'BIO', 'MAD', '2026-05-26 19:10:00', '2026-05-26 20:15:00', 65, 0, 44.00, 'EUR', 110),
('VY2235', 'VY', 'Vueling', 'BCN', 'BIO', '2026-05-27 11:10:00', '2026-05-27 12:20:00', 70, 0, 39.50, 'EUR', 108),
('VY2236', 'VY', 'Vueling', 'BIO', 'BCN', '2026-05-27 21:00:00', '2026-05-27 22:10:00', 70, 0, 41.00, 'EUR', 106),
('FR2237', 'FR', 'Ryanair', 'SVQ', 'PMI', '2026-05-28 08:35:00', '2026-05-28 09:55:00', 80, 0, 32.99, 'EUR', 135),
('FR2238', 'FR', 'Ryanair', 'PMI', 'SVQ', '2026-05-28 19:40:00', '2026-05-28 21:00:00', 80, 0, 34.49, 'EUR', 132),
('UX2239', 'UX', 'Air Europa', 'MAD', 'TFN', '2026-05-29 07:10:00', '2026-05-29 09:20:00', 130, 0, 79.90, 'EUR', 98),
('UX2240', 'UX', 'Air Europa', 'TFN', 'MAD', '2026-05-29 17:50:00', '2026-05-29 20:00:00', 130, 0, 82.90, 'EUR', 96),
('IB2241', 'IB', 'Iberia', 'MAD', 'CDG', '2026-05-30 12:00:00', '2026-05-30 14:10:00', 130, 0, 118.00, 'EUR', 74),
('AF2242', 'AF', 'Air France', 'CDG', 'MAD', '2026-05-30 20:15:00', '2026-05-30 22:25:00', 130, 0, 121.00, 'EUR', 72),
('TP2243', 'TP', 'TAP Air Portugal', 'LIS', 'OPO', '2026-05-31 09:15:00', '2026-05-31 10:05:00', 50, 0, 24.99, 'EUR', 125),
('TP2244', 'TP', 'TAP Air Portugal', 'OPO', 'LIS', '2026-05-31 18:20:00', '2026-05-31 19:10:00', 50, 0, 26.99, 'EUR', 123);

INSERT INTO users (name, email, password_hash, phone) VALUES
('Ana Martinez', 'ana@flynow.test', 'demo123', '+34600111222'),
('Luis Romero', 'luis@flynow.test', 'demo123', '+34677123456'),
('Maria Silva', 'maria@flynow.test', 'demo123', '+351911223344'),
('John Carter', 'john@flynow.test', 'demo123', '+447700900123');

INSERT INTO bookings (
    booking_code, status, user_id, flight_id,
    passengers_count, total_price, currency
) VALUES
('FN9A2K', 'CONFIRMED', 1, 1, 2, 129.80, 'EUR'),
('FN7L8P', 'PENDING',   2, 4, 1,  34.99, 'EUR'),
('FN4Q1M', 'CONFIRMED', 3, 5, 1, 129.00, 'EUR'),
('FN5Z3R', 'CANCELLED', 4, 7, 3, 456.75, 'EUR');

INSERT INTO passengers (
    booking_id, first_name, last_name, document_id, birth_date
) VALUES
(1, 'Ana', 'Martinez', 'DNI123456A', '1998-04-10'),
(1, 'Carlos', 'Martinez', 'DNI456789B', '2000-09-23'),
(2, 'Luis', 'Romero', 'DNI654321C', '1996-11-02'),
(3, 'Maria', 'Silva', 'PT9988776', '1999-01-15'),
(4, 'John', 'Carter', 'UK1112223', '1994-07-04'),
(4, 'Emma', 'Carter', 'UK4445556', '1995-08-16'),
(4, 'Oliver', 'Carter', 'UK7778889', '2001-12-30');
