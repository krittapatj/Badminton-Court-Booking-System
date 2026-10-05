-- ============================================
-- Badminton Court Booking System
-- Database Tables
-- ============================================


-- ============================================
-- Courts Table
-- ============================================

CREATE TABLE courts (
    id INT IDENTITY(1,1) PRIMARY KEY,

    court_name NVARCHAR(50) NOT NULL UNIQUE,

    court_type NVARCHAR(50) NOT NULL,

    price_per_hour DECIMAL(10,2) NOT NULL
);


-- ============================================
-- Bookings Table
-- ============================================

CREATE TABLE bookings (
    id INT IDENTITY(1,1) PRIMARY KEY,

    customer_name NVARCHAR(100) NOT NULL,

    court_number NVARCHAR(20) NOT NULL,

    booking_date DATE NOT NULL,

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    CONSTRAINT CK_bookings_valid_time
        CHECK (end_time > start_time)
);