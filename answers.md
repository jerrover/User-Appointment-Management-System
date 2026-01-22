# Technical Answers

This document provides technical explanations regarding the implementation decisions and future improvements for the **Sari Tirta Appointment System**.

---

### 1. Timezone Conflicts
**Q: How would you handle timezone conflicts between participants in an appointment?**

**Answer:**
Timezone conflicts are handled using a **"Double-Sided Validation"** approach on the Server (Backend) to ensure strict compliance with working hours (08:00 - 17:00) for everyone involved.

1.  **Normalization:** All time inputs received from the client are treated as UTC timestamps.
2.  **Creator Validation:** The system first converts the appointment time to the **Creator's** local timezone using `date-fns-tz`. If the time falls outside their working hours, the request is rejected immediately.
3.  **Participant Loop Validation:** For every invited participant, the system fetches their `preferred_timezone` from the database. The system then converts the appointment time to **that specific participant's** local time.
    * If the converted time is outside the 08:00 - 17:00 range for *any* single participant (e.g., it is 02:00 AM for a colleague in London), the entire creation process is blocked.
    * The API returns a 400 error specifying exactly who has a conflict (e.g., *"Time is outside John's working hours"*).

This logic is implemented in `src/app/api/appointments/route.ts` using the `isWorkingHour` helper function.

---

### 2. Database Optimization
**Q: How can you optimize database queries to efficiently fetch user-specific appointments?**

**Answer:**
Currently, the application fetches appointments using a standard `findMany` query. To scale this for thousands of users, I would implement the following optimizations:

* **Indexing:**
    Add database indexes in the `schema.prisma` file, specifically on Foreign Keys and Date columns. This drastically speeds up lookup times.
    ```prisma
    model Appointment {
      // ...
      @@index([creatorId])       // Speed up filtering by creator
      @@index([start, end])      // Speed up date range filtering
    }
    ```
* **Pagination (Cursor/Offset):**
    Instead of loading *all* history and upcoming appointments at once, I would implement pagination (loading data in chunks of 10 or 20 items) using Prisma's `take` and `skip` arguments.
* **Selective Fetching:**
    Use Prisma's `select` to retrieve only the necessary fields (e.g., `id`, `title`, `start`) for the dashboard list, rather than fetching the entire object graph.

---

### 3. Additional Features
**Q: If this application were to become a real product, what additional features would you implement? Why?**

**Answer:**
Based on real-world usage scenarios, I would implement:

1.  **Customizable Notifications & Reminders**
    * *Feature:* Allow users to set specific reminder times (e.g., "Notify me 15 minutes before" or "1 hour before").
    * *Why:* To reduce "no-show" rates and ensure participants prepare on time.
2.  **RSVP System with Smart Rescheduling**
    * *Feature:* When invited, users can choose to "Accept" or "Decline". If they decline, they must provide a reason and the system will prompt them to suggest an alternative time slot using the existing Availability Logic.
    * *Why:* This reduces the back-and-forth communication friction when a proposed time doesn't work.
3.  **External Calendar Synchronization (Google Calendar)**
    * *Feature:* Two-way sync with Google Calendar.
    * *Why:* Users rarely use a standalone app for schedules. Integration ensures they don't get double-booked with external meetings and provides a seamless user experience.

---

### 4. Session Management
**Q: How would you manage user sessions securely while keeping them lightweight (e.g., avoiding large JWT payloads)?**

**Answer:**
The system implements **Stateless Authentication** using JWT (JSON Web Tokens) with a focus on security and performance:

* **Lightweight Payload:** The JWT payload is kept extremely minimal, containing **only** the user ID (`sub`).
    * *Strategy:* Instead of storing the username, email, or role inside the token (which bloats the header size), the application fetches fresh user data from the database using the ID whenever detailed profile info is needed.
* **HTTP-Only Cookies:** The token is stored in an `httpOnly` cookie.
    * *Security:* This prevents client-side JavaScript from accessing the token, effectively neutralizing XSS (Cross-Site Scripting) attacks.
* **Secure Attributes:** In production, the cookie is set with the `Secure` flag (HTTPS only) and `SameSite=Lax` to prevent CSRF attacks.

This implementation can be found in `src/lib/auth.ts`.
