-- Verified Local Assistance Marketplace for City Newcomers (Bengaluru MVP)
-- Database Schema for MySQL 8.0+

CREATE DATABASE IF NOT EXISTS newcomer_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE newcomer_marketplace;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'expert', 'admin') NOT NULL DEFAULT 'user',
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- 2. AREAS TABLE
CREATE TABLE IF NOT EXISTS areas (
    area_id INT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 3. LANGUAGES TABLE
CREATE TABLE IF NOT EXISTS languages (
    language_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- 4. EXPERTS TABLE
CREATE TABLE IF NOT EXISTS experts (
    expert_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    photo_url VARCHAR(255) DEFAULT NULL,
    occupation VARCHAR(100) DEFAULT NULL,
    intro TEXT,
    years_in_city INT DEFAULT 1,
    verification_status ENUM('pending', 'under_review', 'verified', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
    rating_sum DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    rating_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_expert_verification (verification_status)
) ENGINE=InnoDB;

-- 5. EXPERT_LANGUAGES LINK TABLE
CREATE TABLE IF NOT EXISTS expert_languages (
    expert_id INT NOT NULL,
    language_id INT NOT NULL,
    PRIMARY KEY (expert_id, language_id),
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT,
    FOREIGN KEY (language_id) REFERENCES languages(language_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. EXPERT_AREAS LINK TABLE
CREATE TABLE IF NOT EXISTS expert_areas (
    expert_id INT NOT NULL,
    area_id INT NOT NULL,
    PRIMARY KEY (expert_id, area_id),
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT,
    FOREIGN KEY (area_id) REFERENCES areas(area_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    category ENUM('housing_relocation', 'city_exploration', 'transport_guidance', 'government_guidance') NOT NULL,
    service_name VARCHAR(150) NOT NULL,
    description TEXT,
    INDEX idx_service_category (category)
) ENGINE=InnoDB;

-- 8. EXPERT_SERVICES LINK TABLE
CREATE TABLE IF NOT EXISTS expert_services (
    expert_id INT NOT NULL,
    service_id INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    unit ENUM('per_hour', 'per_visit') NOT NULL DEFAULT 'per_hour',
    PRIMARY KEY (expert_id, service_id),
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 9. AVAILABILITY_SLOTS TABLE
CREATE TABLE IF NOT EXISTS availability_slots (
    slot_id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id INT NOT NULL,
    weekday ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    time_slot ENUM('morning', 'afternoon', 'evening') NOT NULL,
    UNIQUE KEY uq_expert_slot (expert_id, weekday, time_slot),
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    expert_id INT NOT NULL,
    service_id INT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot ENUM('morning', 'afternoon', 'evening') NOT NULL,
    status ENUM('requested', 'accepted', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'requested',
    payment_status ENUM('unpaid', 'paid') NOT NULL DEFAULT 'unpaid',
    amount DECIMAL(10,2) NOT NULL,
    commission DECIMAL(10,2) NOT NULL,
    expert_earning DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE RESTRICT,
    INDEX idx_booking_user (user_id),
    INDEX idx_booking_expert (expert_id),
    INDEX idx_booking_date_slot (booking_date, time_slot)
) ENGINE=InnoDB;

-- 11. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    expert_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT,
    INDEX idx_review_expert (expert_id)
) ENGINE=InnoDB;

-- 12. VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS verifications (
    verification_id INT AUTO_INCREMENT PRIMARY KEY,
    expert_id INT NOT NULL,
    admin_id INT NULL,
    id_doc_url VARCHAR(255) NOT NULL,
    doc_status ENUM('submitted', 'verified', 'rejected') NOT NULL DEFAULT 'submitted',
    admin_status ENUM('pending', 'under_review', 'verified', 'rejected', 'suspended') NOT NULL DEFAULT 'pending',
    remarks TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expert_id) REFERENCES experts(expert_id) ON DELETE RESTRICT,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_verification_status (admin_status)
) ENGINE=InnoDB;

-- 13. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    reporter_id INT NOT NULL,
    reported_user_id INT NOT NULL,
    booking_id INT NULL,
    reason TEXT NOT NULL,
    status ENUM('open', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (reported_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE RESTRICT,
    INDEX idx_report_status (status)
) ENGINE=InnoDB;
