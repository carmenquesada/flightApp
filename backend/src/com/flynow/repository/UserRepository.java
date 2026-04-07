package com.flynow.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import com.flynow.domain.User;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbcTemplate;

    public UserRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<User> findById(Long id) {
        String sql = """
                SELECT id, name, email, password_hash, phone, created_at
                FROM users
                WHERE id = ?
                """;

        List<User> users = jdbcTemplate.query(sql, (rs, rowNum) -> mapUser(rs), id);
        return users.stream().findFirst();
    }

    public Optional<User> findByEmail(String email) {
        String sql = """
                SELECT id, name, email, password_hash, phone, created_at
                FROM users
                WHERE LOWER(email) = LOWER(?)
                """;

        List<User> users = jdbcTemplate.query(sql, (rs, rowNum) -> mapUser(rs), email);
        return users.stream().findFirst();
    }

    public boolean existsByEmail(String email) {
        String sql = """
                SELECT COUNT(*)
                FROM users
                WHERE LOWER(email) = LOWER(?)
                """;

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    public User create(String name, String email, String passwordHash, String phone) {
        String sql = """
                INSERT INTO users (name, email, password_hash, phone)
                VALUES (?, ?, ?, ?)
                """;

        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            var statement = connection.prepareStatement(sql, new String[] { "id" });
            statement.setString(1, name);
            statement.setString(2, email);
            statement.setString(3, passwordHash);
            statement.setString(4, phone);
            return statement;
        }, keyHolder);

        Number idNumber = keyHolder.getKey();
        if (idNumber == null) {
            throw new IllegalStateException("No se pudo recuperar el id del usuario creado");
        }

        return findById(idNumber.longValue())
                .orElseThrow(() -> new IllegalStateException("Usuario creado pero no recuperable"));
    }

    private User mapUser(java.sql.ResultSet rs) throws java.sql.SQLException {
        Timestamp createdAtTs = rs.getObject("created_at", Timestamp.class);
        Instant createdAt = createdAtTs != null ? createdAtTs.toInstant() : null;

        return User.builder()
                .id(rs.getLong("id"))
                .name(rs.getString("name"))
                .email(rs.getString("email"))
                .passwordHash(rs.getString("password_hash"))
                .phone(rs.getString("phone"))
                .createdAt(createdAt)
                .build();
    }
}
