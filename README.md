# RecruitMate API

A comprehensive recruitment management API built with Node.js, Express, and PostgreSQL. This API provides functionality for job posting, resume processing with AI-powered scoring, candidate management, and automated email communications.

## Features

- 🔐 **User Authentication** - Register, login, and email verification
- 📝 **Job Management** - Create, read, update, and delete job postings
- 📄 **Resume Processing** - Upload and automatically score resumes using AI
- 👥 **Candidate Management** - Track and manage job applicants
- 📧 **Email Integration** - Send automated emails to candidates
- 🤖 **AI-Powered Scoring** - Intelligent resume-to-job matching

## Prerequisites

Before setting up the project, ensure you have the following installed:

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Pavan-1802/recruitemate-api
cd recruitmate-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recruitmate
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000

# Email Configuration (for email verification and candidate notifications)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 4. Database Setup

#### Create Database

First, create a PostgreSQL database named `recruitmate`:

```sql
CREATE DATABASE recruitmate;
```

#### Create Tables

Use the provided `tables.sql` file to create the necessary database tables:

```bash
psql -d recruitmate -f tables.sql
```

Or manually execute the SQL commands from `tables.sql`:

```sql
-- Create 'users' table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    token_expiry TIMESTAMPTZ
);

-- Create 'jobs' table
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    threshold NUMERIC(5,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create 'candidates' table
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    resume BYTEA, 
    score NUMERIC(5,2),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your .env file).

## API Endpoints

### Authentication Routes (`/auth`)

#### Register a New User
- **POST** `/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Description:** Registers a new user and sends email verification

#### Verify Email
- **GET** `/auth/verify-email/:token`
- **Description:** Verifies user email using the token sent to their email

#### User Login
- **POST** `/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:** Returns JWT token for authentication

### Job Management Routes (`/jobs`)

*All job routes require authentication (JWT token in Authorization header)*

#### Get All Jobs
- **GET** `/jobs`
- **Description:** Retrieves all jobs created by the authenticated user

#### Create a New Job
- **POST** `/jobs`
- **Body:**
  ```json
  {
    "title": "Software Engineer",
    "description": "Looking for a skilled software engineer...",
    "threshold": 75.0
  }
  ```
- **Description:** Creates a new job posting with AI scoring threshold

#### Update a Job
- **PUT** `/jobs/:id`
- **Body:**
  ```json
  {
    "title": "Senior Software Engineer",
    "description": "Updated job description...",
    "threshold": 80.0
  }
  ```
- **Description:** Updates job details and recalculates candidate scores

#### Delete a Job
- **DELETE** `/jobs/:id`
- **Description:** Deletes a job and all associated candidates

### Candidate Management Routes (`/candidates`)

#### Upload Resumes
- **POST** `/candidates/upload-resumes/:jobId`
- **Content-Type:** `multipart/form-data`
- **Body:** Form data with `files` field containing resume files
- **Description:** Uploads multiple resume files, extracts information, and scores them against the job

#### Get Candidates for a Job
- **GET** `/candidates/:jobId`
- **Description:** Retrieves all candidates for a specific job, ordered by score (highest first)

#### Update Candidate Status
- **PATCH** `/candidates/status/:candidateId`
- **Body:**
  ```json
  {
    "status": "accepted"
  }
  ```
- **Description:** Updates candidate status (e.g., "pending", "accepted", "rejected")

#### Delete a Candidate
- **DELETE** `/candidates/:candidateId`
- **Description:** Removes a candidate from the system

### Email Routes (`/emails`)

#### Send Bulk Emails
- **POST** `/emails/send-email`
- **Body:**
  ```json
  {
    "jobId": 1,
    "subject": "Application Update",
    "body": "Thank you for your application...",
    "status": "accepted"
  }
  ```
- **Description:** Sends emails to all candidates with a specific status for a job

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After successful login, include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## File Upload

The API supports resume file uploads in various formats PDF format. Files are processed to:
- Extract candidate email addresses
- Extract candidate names from filenames
- Calculate relevance scores using AI/ML algorithms
- Determine candidate status based on threshold scores

## AI-Powered Features

### Resume Scoring
The system uses advanced AI algorithms to:
- Analyze resume content against job descriptions
- Generate relevance scores (0-100)
- Automatically categorize candidates based on threshold scores

### Automatic Status Assignment
- **Accepted:** Score >= threshold
- **Pending:** Score < threshold
- **Rejected:** Manual status update

## Database Schema

### Users Table
- `id`: Primary key
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `is_email_verified`: Email verification status
- `verification_token`: Email verification token
- `token_expiry`: Token expiration timestamp

### Jobs Table
- `id`: Primary key
- `user_id`: Reference to users table
- `title`: Job title
- `description`: Job description
- `threshold`: Minimum score for acceptance
- `created_at`: Job creation timestamp

### Candidates Table
- `id`: Primary key
- `job_id`: Reference to jobs table
- `name`: Candidate name
- `email`: Candidate email
- `resume`: Resume file data (binary)
- `score`: AI-calculated relevance score
- `status`: Application status
- `created_at`: Application timestamp

## Error Handling

The API returns appropriate HTTP status codes:
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Resource not found
- `500`: Internal server error

## Development

### Project Structure
```
├── controllers/          # Request handlers
│   ├── authController.js
│   ├── candidateController.js
│   ├── emailControllers.js
│   └── jobController.js
├── lib/                  # Database configuration
│   └── db.js
├── middleware/           # Custom middleware
│   ├── authMiddleware.js
│   └── upload.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── candidateRoutes.js
│   ├── emailRoutes.js
│   └── jobRoutes.js
├── index.js            # Main application file
├── package.json        # Dependencies and scripts
├── tables.sql          # Database schema
└── utils.js           # Utility functions
```

### Scripts
- `npm run dev`: Start development server with nodemon
- `npm start`: Start production server
- `npm test`: Run tests (to be implemented)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request