HOSTED AT: https://wad2-utso.onrender.com

# Yoga Booking System

A web application developed for the **Web Application Development 2** practical coursework.  
The system allows users to browse yoga courses and classes, register and log in, make bookings, and enables organisers to manage courses, sessions, and users.

---

## Tech Stack

- Node.js
- Express
- NeDB (nedb-promises)
- Mustache (server-side rendering)

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-folder>
```

---

### 2. Install Dependencies

From the project root directory, run:

```bash
npm install
```

---

## Environment Variables

This project uses environment variables for configuration.

The `.env` file is **not included** in the repository to avoid committing secrets.

### Local Development

An example environment file is provided:

```
.env.example
```

To run the project locally, create your own `.env` file based on this example:

```bash
cp .env.example .env
```

Then update the values as needed (for example, setting a local `JWT_SECRET`).

### Deployment

In production (e.g. on Render), environment variables such as `NODE_ENV`, `PORT`, and `JWT_SECRET` are provided by the deployment platform and are **not stored in the repository**.

---

### 3. Seed the Database

Populate the database with demo users, courses, and sessions:

```bash
npm run seed
```

**Important notes:**
- Ensure the application is **not running** before seeding.
- The seed script wipes existing data and recreates a clean dataset.
- If you encounter file permission issues on Windows, stop the app and re-run the seed command.

---

### 4. Run the Application Locally

Start the application using:

```bash
node index.js
```

---

### 5. Access the Application

Open a browser and navigate to:

```
http://localhost:3000
```

---

## Demo Login Accounts

The seed script creates the following test accounts:

### Student User
- Email: `fiona@student.local`
- Password: `Password1!`

### Organiser User
- Email: `organiser@local`
- Password: `Password1!`

---

## Features Implemented

- Public browsing of courses and class details
- User registration and login
- Course enrolment and individual class booking
- Role-based access control (user / organiser)
- Organiser functionality:
  - Add and update courses
  - Add and update sessions
  - View class participant lists
  - Add and remove users and organisers

---
