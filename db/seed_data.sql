-- ============================================
-- Badminton Court Booking System
-- Seed Data
-- ============================================


-- ============================================
-- Court Data
-- ============================================

INSERT INTO courts (
    court_name,
    court_type,
    price_per_hour
)
VALUES
    (
        'Court 1',
        'Standard Court',
        120.00
    ),
    (
        'Court 2',
        'Standard Court',
        120.00
    ),
    (
        'Court 3',
        'Premium Court',
        150.00
    ),
    (
        'Court 4',
        'Premium Court',
        150.00
    );