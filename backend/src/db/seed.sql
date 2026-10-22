-- Seed Data for Verified Local Assistance Marketplace for City Newcomers (Bengaluru MVP)
USE newcomer_marketplace;

-- Disable foreign key checks for clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE reports;
TRUNCATE TABLE reviews;
TRUNCATE TABLE bookings;
TRUNCATE TABLE availability_slots;
TRUNCATE TABLE expert_services;
TRUNCATE TABLE expert_areas;
TRUNCATE TABLE expert_languages;
TRUNCATE TABLE verifications;
TRUNCATE TABLE experts;
TRUNCATE TABLE services;
TRUNCATE TABLE languages;
TRUNCATE TABLE areas;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. SEED BENGALURU AREAS (25 prominent neighborhoods)
INSERT INTO areas (area_id, area_name) VALUES
(1, 'Koramangala'),
(2, 'Indiranagar'),
(3, 'HSR Layout'),
(4, 'Whitefield'),
(5, 'BTM Layout'),
(6, 'Malleshwaram'),
(7, 'Jayanagar'),
(8, 'Electronic City'),
(9, 'Marathahalli'),
(10, 'Bellandur'),
(11, 'Rajajinagar'),
(12, 'Banashankari'),
(13, 'Hebbal'),
(14, 'Yelahanka'),
(15, 'Frazer Town'),
(16, 'Richmond Town'),
(17, 'Basavanagudi'),
(18, 'Sarjapur Road'),
(19, 'Kalyan Nagar'),
(20, 'Domlur'),
(21, 'JP Nagar'),
(22, 'RT Nagar'),
(23, 'Bannerghatta Road'),
(24, 'Vijayanagar'),
(25, 'Shanthi Nagar');

-- 2. SEED SPOKEN LANGUAGES
INSERT INTO languages (language_id, name) VALUES
(1, 'Kannada'),
(2, 'English'),
(3, 'Hindi'),
(4, 'Tamil'),
(5, 'Telugu'),
(6, 'Malayalam'),
(7, 'Bengali'),
(8, 'Marathi');

-- 3. SEED SERVICES ACROSS 4 CORE NEWCOMER CATEGORIES
-- Housing / Relocation
INSERT INTO services (service_id, category, service_name, description) VALUES
(1, 'housing_relocation', 'PG & Hostel Discovery Walk', 'Personal walkthrough of verified PGs, food hygiene check, security check and rent negotiation help.'),
(2, 'housing_relocation', 'Rental Neighborhood Due-Diligence', 'Accompanied neighborhood survey, water availability check, distance to metro/bus, and lease agreement review.'),
(3, 'housing_relocation', 'Owner Negotiations & Deposit Advisory', 'Advice on standard Bengaluru rental deposit practices and accompanying during owner meetings.');

-- City Exploration & Local Living
INSERT INTO services (service_id, category, service_name, description) VALUES
(4, 'city_exploration', 'First-Week Essentials Orientation', 'Introduction to local markets, grocery stores, pharmacies, doctors, and safe commute routes.'),
(5, 'city_exploration', 'Bengaluru Heritage & Hidden Eateries Walk', 'Half-day insider tour exploring historic localities, iconic South Indian darshinis, and cultural spots.'),
(6, 'city_exploration', 'Cultural & Community Intro', 'Connecting newcomers with community clubs, libraries, parks, and language basics.');

-- Transport & Daily Commute
INSERT INTO services (service_id, category, service_name, description) VALUES
(7, 'transport_guidance', 'Metro & BMTC Bus Pass Route Planning', 'Personal route trial from residence to college/workplace, smart card acquisition, and bus pass assistance.'),
(8, 'transport_guidance', 'Daily Commute Optimization', 'Comparing auto vs metro vs bus options, safety assessment for late hours, and peak-hour bypass tips.');

-- Government & Civic Procedures
INSERT INTO services (service_id, category, service_name, description) VALUES
(9, 'government_guidance', 'Aadhaar / Voter Address Update Assistance', 'Guidance on required paperwork, Bangalore One center navigation, and queue management tips.'),
(10, 'government_guidance', 'Bescom Electricity & Water Service Setup', 'Explaining bill transfer processes, meter inspection appointments, and sub-division office visits.'),
(11, 'government_guidance', 'Police Station Verification & NOC Guidance', 'Step-by-step guidance on domestic helper/tenant verification and police clearance certificate procedures.');

-- 4. SEED USERS (Password for all accounts: "Password@123")
-- Hash: $2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce
INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES
(1, 'Bengaluru Safety Admin', 'admin@bengaluruhelp.in', '9845012340', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'admin', 'active'),

-- Benchmark Expert B (Established): 50 reviews, avg 4.8 -> rating_sum = 240.00
(2, 'Kavitha Rao', 'kavitha.relocation@gmail.com', '9845011111', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'expert', 'active'),

-- Benchmark Expert A (New): 1 review of 5.0 -> rating_sum = 5.00
(3, 'Rahul Sharma', 'rahul.studenthelp@gmail.com', '9845022222', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'expert', 'active'),

-- Benchmark Expert C (Busy): 30 reviews, avg 4.9 -> rating_sum = 147.00
(4, 'Arun Kumar', 'arun.busyheritage@gmail.com', '9845033333', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'expert', 'active'),

-- Civic & Government Guide: 14 reviews, avg 4.7 -> rating_sum = 65.80
(5, 'Deepa Murthy', 'deepa.civicguide@gmail.com', '9845044444', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'expert', 'active'),

-- Transport Specialist: 8 reviews, avg 4.6 -> rating_sum = 36.80
(6, 'Vikram Hegde', 'vikram.metrotrans@gmail.com', '9845055555', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'expert', 'active'),

-- Pending Applicant Expert (for Admin verification testing)
(7, 'Suresh Gowda', 'suresh.applicant@gmail.com', '9845066666', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'expert', 'active'),

-- Newcomer Users
(8, 'Rohit Verma', 'rohit.student@gmail.com', '9845077777', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'user', 'active'),
(9, 'Ananya Sen', 'ananya.tech@outlook.com', '9845088888', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'user', 'active'),
(10, 'Priya Nair', 'priya.relocating@gmail.com', '9845099999', '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce', 'user', 'active');

-- 5. SEED EXPERTS
INSERT INTO experts (expert_id, user_id, photo_url, occupation, intro, years_in_city, verification_status, rating_sum, rating_count) VALUES
-- Expert 1 (Kavitha Rao - Established Benchmark B)
(1, 2, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400', 'Independent Relocation Specialist', '10+ years resident in Bengaluru. Helping newcomers find genuine PGs and rental flats without falling for broker scams.', 10, 'verified', 240.00, 50),

-- Expert 2 (Rahul Sharma - New Benchmark A)
(2, 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Postgrad Student & Youth Mentor', 'Living in Koramangala & BTM for 3 years. Specialist in student-friendly food spots, safe budget hostels, and study hubs.', 3, 'verified', 5.00, 1),

-- Expert 3 (Arun Kumar - Busy Heritage Guide Benchmark C)
(3, 4, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'City Historian & Walking Tour Host', 'Native Bangalorean for 25 years. Offering deep historical insights, iconic food walks, and heritage preservation tours.', 25, 'verified', 147.00, 30),

-- Expert 4 (Deepa Murthy)
(4, 5, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400', 'Retired Civic Services Officer', 'Assisting families and senior newcomers navigate Bangalore One, Bescom, and local municipal documentation.', 18, 'verified', 65.80, 14),

-- Expert 5 (Vikram Hegde)
(5, 6, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Urban Commute Consultant', 'Bengaluru traffic survivor for 12 years. Master of Namma Metro connectivity, suburban trains, and BMTC feeder lines.', 12, 'verified', 36.80, 8),

-- Expert 6 (Suresh Gowda - Pending verification)
(6, 7, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400', 'Local Explorer & Freelancer', 'Eager to help people settle down in West Bengaluru and Malleshwaram.', 5, 'pending', 0.00, 0);

-- 6. SEED EXPERT LANGUAGES
-- Kavitha: Kannada, English, Hindi, Tamil
INSERT INTO expert_languages (expert_id, language_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 4),
-- Rahul: Hindi, English
(2, 2), (2, 3),
-- Arun: Kannada, English, Tamil
(3, 1), (3, 2), (3, 4),
-- Deepa: Kannada, English, Hindi, Telugu
(4, 1), (4, 2), (4, 3), (4, 5),
-- Vikram: Kannada, English, Hindi
(5, 1), (5, 2), (5, 3),
-- Suresh: Kannada, English
(6, 1), (6, 2);

-- 7. SEED EXPERT AREAS
-- Kavitha: Koramangala(1), Indiranagar(2), HSR Layout(3), BTM Layout(5)
INSERT INTO expert_areas (expert_id, area_id) VALUES
(1, 1), (1, 2), (1, 3), (1, 5),
-- Rahul: Koramangala(1), BTM Layout(5), HSR Layout(3)
(2, 1), (2, 5), (2, 3),
-- Arun: Malleshwaram(6), Basavanagudi(17), Frazer Town(15)
(3, 6), (3, 17), (3, 15),
-- Deepa: Jayanagar(7), Banashankari(12), Koramangala(1)
(4, 7), (4, 12), (4, 1),
-- Vikram: Whitefield(4), Marathahalli(9), Bellandur(10), Electronic City(8)
(5, 4), (5, 9), (5, 10), (5, 8),
-- Suresh: Rajajinagar(11), Malleshwaram(6)
(6, 11), (6, 6);

-- 8. SEED EXPERT SERVICES & PRICING
-- Kavitha: PG Search (1), Rental Survey (2), Owner Negotiation (3)
INSERT INTO expert_services (expert_id, service_id, price, unit) VALUES
(1, 1, 499.00, 'per_hour'),
(1, 2, 899.00, 'per_visit'),
(1, 3, 600.00, 'per_visit'),
-- Rahul: PG Search (1), Rental Survey (2), First-Week Essentials (4)
(2, 1, 350.00, 'per_hour'),
(2, 2, 600.00, 'per_visit'),
(2, 4, 400.00, 'per_hour'),
-- Arun: Rental Survey (2), Heritage Walk (5), Cultural Intro (6) -- Notice does NOT offer PG search (1), offers only 1 of benchmark needs!
(3, 2, 1200.00, 'per_visit'),
(3, 5, 800.00, 'per_hour'),
(3, 6, 500.00, 'per_hour'),
-- Deepa: Aadhaar/Voter (9), Bescom (10), Police NOC (11)
(4, 9, 450.00, 'per_visit'),
(4, 10, 600.00, 'per_visit'),
(4, 11, 500.00, 'per_visit'),
-- Vikram: Metro Planning (7), Commute Optimization (8)
(5, 7, 300.00, 'per_hour'),
(5, 8, 450.00, 'per_visit'),
-- Suresh: PG Search (1)
(6, 1, 300.00, 'per_hour');

-- 9. SEED AVAILABILITY SLOTS
-- Kavitha: Free Saturday morning, Saturday afternoon, Sunday morning
INSERT INTO availability_slots (expert_id, weekday, time_slot) VALUES
(1, 'Saturday', 'morning'),
(1, 'Saturday', 'afternoon'),
(1, 'Sunday', 'morning'),
-- Rahul: Free Saturday morning, Sunday evening
(2, 'Saturday', 'morning'),
(2, 'Sunday', 'evening'),
-- Arun: Free Sunday evening (NOT free Saturday morning in benchmark!)
(3, 'Sunday', 'evening'),
(3, 'Wednesday', 'morning'),
-- Deepa: Monday morning, Friday morning
(4, 'Monday', 'morning'),
(4, 'Friday', 'morning'),
-- Vikram: Saturday morning, Saturday evening
(5, 'Saturday', 'morning'),
(5, 'Saturday', 'evening');

-- 10. SEED VERIFICATION APPLICATIONS
INSERT INTO verifications (verification_id, expert_id, admin_id, id_doc_url, doc_status, admin_status, remarks, reviewed_at) VALUES
(1, 1, 1, '/uploads/id_docs/sample_aadhaar_kavitha.pdf', 'verified', 'verified', 'Govt ID verified against profile details. Approved.', NOW()),
(2, 2, 1, '/uploads/id_docs/sample_college_id_rahul.pdf', 'verified', 'verified', 'Student ID card and address proof confirmed. Approved.', NOW()),
(3, 3, 1, '/uploads/id_docs/sample_passport_arun.pdf', 'verified', 'verified', 'Passport document verified. Approved.', NOW()),
(4, 4, 1, '/uploads/id_docs/sample_pension_deepa.pdf', 'verified', 'verified', 'Government identity and local address verified. Approved.', NOW()),
(5, 5, 1, '/uploads/id_docs/sample_license_vikram.pdf', 'verified', 'verified', 'Driving licence verified. Approved.', NOW()),
(6, 6, NULL, '/uploads/id_docs/sample_aadhaar_suresh.pdf', 'submitted', 'pending', 'Awaiting administrative document review.', NULL);

-- 11. SEED BOOKINGS (Demonstrating all statuses)
-- Booking 1: Rohit booked Rahul Sharma (completed & reviewed)
INSERT INTO bookings (booking_id, user_id, expert_id, service_id, booking_date, time_slot, status, payment_status, amount, commission, expert_earning, notes) VALUES
(1, 8, 2, 1, '2026-10-10', 'morning', 'completed', 'paid', 500.00, 100.00, 400.00, 'Need help checking 2 PGs near Christ University main gate.');

-- Booking 2: Rohit booked Kavitha Rao (completed & reviewed)
INSERT INTO bookings (booking_id, user_id, expert_id, service_id, booking_date, time_slot, status, payment_status, amount, commission, expert_earning, notes) VALUES
(2, 8, 1, 2, '2026-10-12', 'afternoon', 'completed', 'paid', 899.00, 179.80, 719.20, '1BHK rental inspection in Koramangala 4th block.');

-- Booking 3: Ananya booked Vikram Hegde (accepted, unpaid -> ready for Mock Pay demo!)
INSERT INTO bookings (booking_id, user_id, expert_id, service_id, booking_date, time_slot, status, payment_status, amount, commission, expert_earning, notes) VALUES
(3, 9, 5, 7, '2026-10-17', 'morning', 'accepted', 'unpaid', 450.00, 90.00, 360.00, 'Relocating to Bellandur. Need best bus route to Manyata Tech Park.');

-- Booking 4: Priya Nair booked Deepa Murthy (requested -> ready for Expert Accept/Reject demo!)
INSERT INTO bookings (booking_id, user_id, expert_id, service_id, booking_date, time_slot, status, payment_status, amount, commission, expert_earning, notes) VALUES
(4, 10, 4, 9, '2026-10-19', 'morning', 'requested', 'unpaid', 450.00, 90.00, 360.00, 'Need assistance changing Aadhaar address at Jayanagar Bangalore One.');

-- 12. SEED REVIEWS
INSERT INTO reviews (review_id, booking_id, user_id, expert_id, rating, comment, is_hidden) VALUES
(1, 1, 8, 2, 5, 'Rahul was super helpful! Saved me from a shady PG contract in BTM. Highly recommended for students.', FALSE),
(2, 2, 8, 1, 5, 'Kavitha knows every lane in Koramangala. She spotted water supply issues in one building that I would have missed.', FALSE);

-- 13. SEED SAFETY REPORT (for Admin Safety & Suspension demo)
INSERT INTO reports (report_id, reporter_id, reported_user_id, booking_id, reason, status, admin_notes) VALUES
(1, 9, 7, NULL, 'User sent unsolicited commercial broker messages outside platform.', 'open', 'Requires review by admin. Check communication log.');
