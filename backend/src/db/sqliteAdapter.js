const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'marketplace.db');

let sqliteDb = null;

function getSqliteDb() {
  if (!sqliteDb) {
    sqliteDb = new sqlite3.Database(dbPath);
  }
  return sqliteDb;
}

function runSqlite(sql, params = []) {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ insertId: this.lastID, affectedRows: this.changes });
    });
  });
}

function querySqlite(sql, params = []) {
  const db = getSqliteDb();
  return new Promise((resolve, reject) => {
    // Strip MySQL-specific syntax if any
    let cleanedSql = sql
      .replace(/FOR UPDATE/gi, '')
      .replace(/FIELD\([^)]+\)/gi, 'slot_id ASC');

    db.all(cleanedSql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

async function initSqliteSchemaAndSeed() {
  const db = getSqliteDb();

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = OFF');

      db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        status TEXT NOT NULL DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS areas (
        area_id INTEGER PRIMARY KEY AUTOINCREMENT,
        area_name TEXT NOT NULL UNIQUE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS languages (
        language_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS experts (
        expert_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        photo_url TEXT DEFAULT NULL,
        occupation TEXT DEFAULT NULL,
        intro TEXT,
        years_in_city INTEGER DEFAULT 1,
        verification_status TEXT NOT NULL DEFAULT 'pending',
        rating_sum REAL NOT NULL DEFAULT 0.00,
        rating_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS expert_languages (
        expert_id INTEGER NOT NULL,
        language_id INTEGER NOT NULL,
        PRIMARY KEY (expert_id, language_id),
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id),
        FOREIGN KEY (language_id) REFERENCES languages(language_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS expert_areas (
        expert_id INTEGER NOT NULL,
        area_id INTEGER NOT NULL,
        PRIMARY KEY (expert_id, area_id),
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id),
        FOREIGN KEY (area_id) REFERENCES areas(area_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS services (
        service_id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        service_name TEXT NOT NULL,
        description TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS expert_services (
        expert_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        price REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'per_hour',
        PRIMARY KEY (expert_id, service_id),
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id),
        FOREIGN KEY (service_id) REFERENCES services(service_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS availability_slots (
        slot_id INTEGER PRIMARY KEY AUTOINCREMENT,
        expert_id INTEGER NOT NULL,
        weekday TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        UNIQUE (expert_id, weekday, time_slot),
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS bookings (
        booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        expert_id INTEGER NOT NULL,
        service_id INTEGER NOT NULL,
        booking_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'requested',
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        amount REAL NOT NULL,
        commission REAL NOT NULL,
        expert_earning REAL NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id),
        FOREIGN KEY (service_id) REFERENCES services(service_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL UNIQUE,
        user_id INTEGER NOT NULL,
        expert_id INTEGER NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT,
        is_hidden INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS verifications (
        verification_id INTEGER PRIMARY KEY AUTOINCREMENT,
        expert_id INTEGER NOT NULL,
        admin_id INTEGER NULL,
        id_doc_url TEXT NOT NULL,
        doc_status TEXT NOT NULL DEFAULT 'submitted',
        admin_status TEXT NOT NULL DEFAULT 'pending',
        remarks TEXT,
        reviewed_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expert_id) REFERENCES experts(expert_id),
        FOREIGN KEY (admin_id) REFERENCES users(user_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS reports (
        report_id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        reported_user_id INTEGER NOT NULL,
        booking_id INTEGER NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(user_id),
        FOREIGN KEY (reported_user_id) REFERENCES users(user_id),
        FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
      )`);

      // Check if data is already seeded
      db.get('SELECT COUNT(*) as count FROM areas', (err, row) => {
        if (err) return reject(err);
        if (row && row.count > 0) {
          return resolve();
        }

        // Seed areas
        const areas = [
          'Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'BTM Layout',
          'Malleshwaram', 'Jayanagar', 'Electronic City', 'Marathahalli', 'Bellandur',
          'Rajajinagar', 'Banashankari', 'Hebbal', 'Yelahanka', 'Frazer Town',
          'Richmond Town', 'Basavanagudi', 'Sarjapur Road', 'Kalyan Nagar', 'Domlur',
          'JP Nagar', 'RT Nagar', 'Bannerghatta Road', 'Vijayanagar', 'Shanthi Nagar'
        ];
        const stmtArea = db.prepare('INSERT INTO areas (area_name) VALUES (?)');
        areas.forEach(a => stmtArea.run(a));
        stmtArea.finalize();

        // Seed languages
        const langs = ['Kannada', 'English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Bengali', 'Marathi'];
        const stmtLang = db.prepare('INSERT INTO languages (name) VALUES (?)');
        langs.forEach(l => stmtLang.run(l));
        stmtLang.finalize();

        // Seed services
        const services = [
          [1, 'housing_relocation', 'PG & Hostel Discovery Walk', 'Personal walkthrough of verified PGs, food hygiene check, security check and rent negotiation help.'],
          [2, 'housing_relocation', 'Rental Neighborhood Due-Diligence', 'Accompanied neighborhood survey, water availability check, distance to metro/bus, and lease agreement review.'],
          [3, 'housing_relocation', 'Owner Negotiations & Deposit Advisory', 'Advice on standard Bengaluru rental deposit practices and accompanying during owner meetings.'],
          [4, 'city_exploration', 'First-Week Essentials Orientation', 'Introduction to local markets, grocery stores, pharmacies, doctors, and safe commute routes.'],
          [5, 'city_exploration', 'Bengaluru Heritage & Hidden Eateries Walk', 'Half-day insider tour exploring historic localities, iconic South Indian darshinis, and cultural spots.'],
          [6, 'city_exploration', 'Cultural & Community Intro', 'Connecting newcomers with community clubs, libraries, parks, and language basics.'],
          [7, 'transport_guidance', 'Metro & BMTC Bus Pass Route Planning', 'Personal route trial from residence to college/workplace, smart card acquisition, and bus pass assistance.'],
          [8, 'transport_guidance', 'Daily Commute Optimization', 'Comparing auto vs metro vs bus options, safety assessment for late hours, and peak-hour bypass tips.'],
          [9, 'government_guidance', 'Aadhaar / Voter Address Update Assistance', 'Guidance on required paperwork, Bangalore One center navigation, and queue management tips.'],
          [10, 'government_guidance', 'Bescom Electricity & Water Service Setup', 'Explaining bill transfer processes, meter inspection appointments, and sub-division office visits.'],
          [11, 'government_guidance', 'Police Station Verification & NOC Guidance', 'Step-by-step guidance on domestic helper/tenant verification and police clearance certificate procedures.']
        ];
        const stmtService = db.prepare('INSERT INTO services (service_id, category, service_name, description) VALUES (?, ?, ?, ?)');
        services.forEach(s => stmtService.run(s));
        stmtService.finalize();

        // Seed users (Password@123 hash)
        const hash = '$2a$10$0YICA.E3G5AtFeUt4OxhEe/4FY79c4/A4N/Dq8n.ep0VlmufEtyce';
        const users = [
          [1, 'Bengaluru Safety Admin', 'admin@bengaluruhelp.in', '9845012340', hash, 'admin', 'active'],
          [2, 'Kavitha Rao', 'kavitha.relocation@gmail.com', '9845011111', hash, 'expert', 'active'],
          [3, 'Rahul Sharma', 'rahul.studenthelp@gmail.com', '9845022222', hash, 'expert', 'active'],
          [4, 'Arun Kumar', 'arun.busyheritage@gmail.com', '9845033333', hash, 'expert', 'active'],
          [5, 'Deepa Murthy', 'deepa.civicguide@gmail.com', '9845044444', hash, 'expert', 'active'],
          [6, 'Vikram Hegde', 'vikram.metrotrans@gmail.com', '9845055555', hash, 'expert', 'active'],
          [7, 'Suresh Gowda', 'suresh.applicant@gmail.com', '9845066666', hash, 'expert', 'active'],
          [8, 'Rohit Verma', 'rohit.student@gmail.com', '9845077777', hash, 'user', 'active'],
          [9, 'Ananya Sen', 'ananya.tech@outlook.com', '9845088888', hash, 'user', 'active'],
          [10, 'Priya Nair', 'priya.relocating@gmail.com', '9845099999', hash, 'user', 'active']
        ];
        const stmtUser = db.prepare('INSERT INTO users (user_id, name, email, phone, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
        users.forEach(u => stmtUser.run(u));
        stmtUser.finalize();

        // Seed experts
        const experts = [
          [1, 2, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400', 'Independent Relocation Specialist', '10+ years resident in Bengaluru. Helping newcomers find genuine PGs and rental flats without falling for broker scams.', 10, 'verified', 240.0, 50],
          [2, 3, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', 'Postgrad Student & Youth Mentor', 'Living in Koramangala & BTM for 3 years. Specialist in student-friendly food spots, safe budget hostels, and study hubs.', 3, 'verified', 5.0, 1],
          [3, 4, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', 'City Historian & Walking Tour Host', 'Native Bangalorean for 25 years. Offering deep historical insights, iconic food walks, and heritage preservation tours.', 25, 'verified', 147.0, 30],
          [4, 5, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400', 'Retired Civic Services Officer', 'Assisting families and senior newcomers navigate Bangalore One, Bescom, and local municipal documentation.', 18, 'verified', 65.8, 14],
          [5, 6, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', 'Urban Commute Consultant', 'Bengaluru traffic survivor for 12 years. Master of Namma Metro connectivity, suburban trains, and BMTC feeder lines.', 12, 'verified', 36.8, 8],
          [6, 7, 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400', 'Local Explorer & Freelancer', 'Eager to help people settle down in West Bengaluru and Malleshwaram.', 5, 'pending', 0.0, 0]
        ];
        const stmtExpert = db.prepare('INSERT INTO experts (expert_id, user_id, photo_url, occupation, intro, years_in_city, verification_status, rating_sum, rating_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        experts.forEach(e => stmtExpert.run(e));
        stmtExpert.finalize();

        // Seed expert languages
        const expLangs = [
          [1, 1], [1, 2], [1, 3], [1, 4],
          [2, 2], [2, 3],
          [3, 1], [3, 2], [3, 4],
          [4, 1], [4, 2], [4, 3], [4, 5],
          [5, 1], [5, 2], [5, 3],
          [6, 1], [6, 2]
        ];
        const stmtExpLang = db.prepare('INSERT INTO expert_languages (expert_id, language_id) VALUES (?, ?)');
        expLangs.forEach(el => stmtExpLang.run(el));
        stmtExpLang.finalize();

        // Seed expert areas
        const expAreas = [
          [1, 1], [1, 2], [1, 3], [1, 5],
          [2, 1], [2, 5], [2, 3],
          [3, 6], [3, 17], [3, 15],
          [4, 7], [4, 12], [4, 1],
          [5, 4], [5, 9], [5, 10], [5, 8],
          [6, 11], [6, 6]
        ];
        const stmtExpArea = db.prepare('INSERT INTO expert_areas (expert_id, area_id) VALUES (?, ?)');
        expAreas.forEach(ea => stmtExpArea.run(ea));
        stmtExpArea.finalize();

        // Seed expert services
        const expServices = [
          [1, 1, 499.00, 'per_hour'], [1, 2, 899.00, 'per_visit'], [1, 3, 600.00, 'per_visit'],
          [2, 1, 350.00, 'per_hour'], [2, 2, 600.00, 'per_visit'], [2, 4, 400.00, 'per_hour'],
          [3, 2, 1200.00, 'per_visit'], [3, 5, 800.00, 'per_hour'], [3, 6, 500.00, 'per_hour'],
          [4, 9, 450.00, 'per_visit'], [4, 10, 600.00, 'per_visit'], [4, 11, 500.00, 'per_visit'],
          [5, 7, 300.00, 'per_hour'], [5, 8, 450.00, 'per_visit'],
          [6, 1, 300.00, 'per_hour']
        ];
        const stmtExpService = db.prepare('INSERT INTO expert_services (expert_id, service_id, price, unit) VALUES (?, ?, ?, ?)');
        expServices.forEach(es => stmtExpService.run(es));
        stmtExpService.finalize();

        // Seed slots
        const expSlots = [
          [1, 'Saturday', 'morning'], [1, 'Saturday', 'afternoon'], [1, 'Sunday', 'morning'],
          [2, 'Saturday', 'morning'], [2, 'Sunday', 'evening'],
          [3, 'Sunday', 'evening'], [3, 'Wednesday', 'morning'],
          [4, 'Monday', 'morning'], [4, 'Friday', 'morning'],
          [5, 'Saturday', 'morning'], [5, 'Saturday', 'evening']
        ];
        const stmtSlot = db.prepare('INSERT INTO availability_slots (expert_id, weekday, time_slot) VALUES (?, ?, ?)');
        expSlots.forEach(s => stmtSlot.run(s));
        stmtSlot.finalize();

        // Seed verifications
        const vers = [
          [1, 1, 1, '/uploads/id_docs/sample_aadhaar_kavitha.pdf', 'verified', 'verified', 'Govt ID verified against profile details. Approved.'],
          [2, 2, 1, '/uploads/id_docs/sample_college_id_rahul.pdf', 'verified', 'verified', 'Student ID card and address proof confirmed. Approved.'],
          [3, 3, 1, '/uploads/id_docs/sample_passport_arun.pdf', 'verified', 'verified', 'Passport document verified. Approved.'],
          [4, 4, 1, '/uploads/id_docs/sample_pension_deepa.pdf', 'verified', 'verified', 'Government identity and local address verified. Approved.'],
          [5, 5, 1, '/uploads/id_docs/sample_license_vikram.pdf', 'verified', 'verified', 'Driving licence verified. Approved.'],
          [6, 6, null, '/uploads/id_docs/sample_aadhaar_suresh.pdf', 'submitted', 'pending', 'Awaiting administrative document review.']
        ];
        const stmtVer = db.prepare('INSERT INTO verifications (verification_id, expert_id, admin_id, id_doc_url, doc_status, admin_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)');
        vers.forEach(v => stmtVer.run(v));
        stmtVer.finalize();

        // Seed bookings
        const bookings = [
          [1, 8, 2, 1, '2026-10-10', 'morning', 'completed', 'paid', 500.00, 100.00, 400.00, 'Need help checking 2 PGs near Christ University main gate.'],
          [2, 8, 1, 2, '2026-10-12', 'afternoon', 'completed', 'paid', 899.00, 179.80, 719.20, '1BHK rental inspection in Koramangala 4th block.'],
          [3, 9, 5, 7, '2026-10-17', 'morning', 'accepted', 'unpaid', 450.00, 90.00, 360.00, 'Relocating to Bellandur. Need best bus route to Manyata Tech Park.'],
          [4, 10, 4, 9, '2026-10-19', 'morning', 'requested', 'unpaid', 450.00, 90.00, 360.00, 'Need assistance changing Aadhaar address at Jayanagar Bangalore One.']
        ];
        const stmtBook = db.prepare('INSERT INTO bookings (booking_id, user_id, expert_id, service_id, booking_date, time_slot, status, payment_status, amount, commission, expert_earning, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        bookings.forEach(b => stmtBook.run(b));
        stmtBook.finalize();

        // Seed reviews
        const reviews = [
          [1, 1, 8, 2, 5, 'Rahul was super helpful! Saved me from a shady PG contract in BTM. Highly recommended for students.', 0],
          [2, 2, 8, 1, 5, 'Kavitha knows every lane in Koramangala. She spotted water supply issues in one building that I would have missed.', 0]
        ];
        const stmtRev = db.prepare('INSERT INTO reviews (review_id, booking_id, user_id, expert_id, rating, comment, is_hidden) VALUES (?, ?, ?, ?, ?, ?, ?)');
        reviews.forEach(r => stmtRev.run(r));
        stmtRev.finalize();

        // Seed reports
        const reports = [
          [1, 9, 7, null, 'User sent unsolicited commercial broker messages outside platform.', 'open', 'Requires review by admin. Check communication log.']
        ];
        const stmtRep = db.prepare('INSERT INTO reports (report_id, reporter_id, reported_user_id, booking_id, reason, status, admin_notes) VALUES (?, ?, ?, ?, ?, ?, ?)');
        reports.forEach(rp => stmtRep.run(rp));
        stmtRep.finalize();

        resolve();
      });
    });
  });
}

module.exports = {
  getSqliteDb,
  runSqlite,
  querySqlite,
  initSqliteSchemaAndSeed
};
