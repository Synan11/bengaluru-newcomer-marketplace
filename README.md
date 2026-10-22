# Verified Local Assistance Marketplace for City Newcomers (Bengaluru MVP)

Mobile-first peer-to-peer assistance platform where newcomers (students, relocating professionals, families) book identity-verified Bengaluru residents for housing due-diligence, commute route trials, government civic guidance, and neighborhood discovery.

---

## 🏛️ System Architecture

- **Backend API (`backend/`)**: Node.js, Express, MySQL2, JWT authentication, bcrypt, multer, transaction concurrency control, Bayesian trust rating algorithm.
- **Admin Web Console (`admin-web/`)**: React 18, Vite, Tailwind CSS dashboard for identity document inspection, safety investigations, commission tracking, and live Viva sensitivity analysis.
- **Mobile Client (`app/`)**: React Native (Expo) supporting dual role-based tab navigation (Newcomer Experience & Expert Experience).

---

## 🚀 Quick Start Guide

### 1. Start Backend API
```bash
cd backend
npm install
npm start
```
*API runs at `http://localhost:5000`*.
- **Database**: Out of the box, the server loads a pre-seeded zero-config database containing 25 Bengaluru areas, 8 languages, 11 services, 6 verified & benchmark experts, bookings and reviews.
- **Using MySQL 8.0/9.6 directly**: Put your root password into `backend/.env` (`DB_PASSWORD=your_password`) and run:
  ```bash
  npm run init-db
  ```

### 2. Run Algorithm Unit Tests
Verifies the exact Section 7 worked example (Expert A, B, C scores and sensitivity stability):
```bash
cd backend
npm test
```

### 3. Start Admin Web Console
```bash
cd admin-web
npm install
npm run dev
```
*Access in browser at `http://localhost:3000`*.
- **Admin Credentials**: `admin@bengaluruhelp.in` / `Password@123`
- Inspect pending applicant ID documents, approve/reject/suspend experts, resolve abuse reports, view 20% platform commission, and run live algorithm sensitivity checks.

### 4. Start Mobile App (Expo)
```bash
cd app
npm install
npx expo start
```
- Scan QR code with **Expo Go** on Android/iOS, or press `a` for Android emulator, or `w` for Web preview.
- **Pre-seeded Accounts for instant demo**:
  - **Newcomer**: `rohit.student@gmail.com` / `Password@123`
  - **Established Expert (4.8 rating)**: `kavitha.relocation@gmail.com` / `Password@123`
  - **New Expert (5.0 rating)**: `rahul.studenthelp@gmail.com` / `Password@123`

---

## 📐 Matching & Trust Algorithm (Section 7)

$$\text{Score} = 0.40 \cdot S + 0.20 \cdot L + 0.20 \cdot T + 0.10 \cdot G + 0.10 \cdot A$$

| Factor | Name | Weight | Calculation |
| :--- | :--- | :--- | :--- |
| **S** | Service Coverage | 0.40 | $\frac{\text{needs offered by expert}}{\text{needs selected by user}}$ (Set coverage prevents penalizing versatile experts) |
| **L** | Area Coverage | 0.20 | 1 if expert knows requested area, else 0 |
| **T** | Trust Score | 0.20 | Bayesian smoothed rating rescaled to 0..1 |
| **G** | Language Match | 0.10 | $\frac{\text{matching languages}}{\text{requested languages}}$ |
| **A** | Availability | 0.10 | 1 if free at requested weekday & slot, else 0 |

### Bayesian Smoothing (Ma et al.)
$$\text{Smoothed Rating} = \frac{C \cdot m + \sum \text{ratings}}{C + n}, \quad T = \frac{\text{Smoothed Rating} - 1}{4}$$
- $C = 5$ (prior strength)
- $m = 4.0$ (platform baseline)
- Protects established experts from being outranked by a brand-new expert with a single 5.0 review.

---

## 💼 Business Model & Commission Split
- Every booking calculates a 20% platform commission and 80% expert earning:
  - $\text{Commission} = \text{Amount} \times 0.20$
  - $\text{Expert Earning} = \text{Amount} - \text{Commission}$
- Mock Payment Gateway in mobile app marks booking paid and dispatches receipt details.

---

## 🛡️ Trust & Safety Rules
1. **One review per booking**: `reviews.booking_id` is unique.
2. **Review eligibility**: Review accepted only when booking status is `completed` and user is the actual customer.
3. **No double booking**: Concurrency check validates slot availability (`SELECT ... FOR UPDATE`).
4. **Never delete records**: `ON DELETE RESTRICT` on foreign keys; suspension mechanism disables bad actors without breaking audit records.
