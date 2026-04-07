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
('LHR', 'Heathrow Airport', 'London', 'United Kingdom');

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
('VY1102', 'VY', 'Vueling', 'MAD', 'OPO', '2026-03-20 16:30:00', '2026-03-20 17:40:00', 70, 0, 59.95, 'EUR', 98);

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
