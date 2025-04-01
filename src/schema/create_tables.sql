CREATE TABLE users (
                       userid SERIAL PRIMARY KEY,
                       name VARCHAR(255) NOT NULL,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       role VARCHAR(50) NOT NULL CHECK (role IN ('Student', 'Instructor', 'Grader')),
                       password VARCHAR(255) NOT NULL,
                       isDeleted BOOLEAN DEFAULT FALSE
);

-- Create the courses table
CREATE TABLE courses (
                         courseid SERIAL PRIMARY KEY,
                         coursename VARCHAR(255) NOT NULL,
                         instructorid INTEGER NOT NULL,
                         startdate DATE NOT NULL,
                         enddate DATE NOT NULL,
                         isarchived BOOLEAN DEFAULT FALSE,
                         isDeleted BOOLEAN DEFAULT FALSE,
                         FOREIGN KEY (instructorid) REFERENCES users(userid) ON DELETE CASCADE
);

-- Create the assignments table
CREATE TABLE assignments (
                             assignid SERIAL PRIMARY KEY,
                             courseid INTEGER NOT NULL,
                             title VARCHAR(255) NOT NULL,
                             description TEXT NOT NULL,
                             deadline DATE NOT NULL,
                             maxscore INTEGER NOT NULL,
                             weightage FLOAT NOT NULL CHECK (weightage >= 0 AND weightage <= 100),
                             isDeleted BOOLEAN DEFAULT FALSE,
                             FOREIGN KEY (courseid) REFERENCES courses(courseid) ON DELETE CASCADE
);

-- Create the enrollments table
CREATE TABLE enrollments (
                             enrollmentid SERIAL PRIMARY KEY,
                             userid INTEGER NOT NULL,
                             courseid INTEGER NOT NULL,
                             isDeleted BOOLEAN DEFAULT FALSE,
                             UNIQUE (userid, courseid),
                             FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE,
                             FOREIGN KEY (courseid) REFERENCES courses(courseid) ON DELETE CASCADE
);

-- Add indexes for performance

CREATE INDEX idx_enrollments_userid ON enrollments(userid);
CREATE INDEX idx_enrollments_courseid ON enrollments(courseid);
CREATE INDEX idx_assignments_courseid ON assignments(courseid);

CREATE TABLE rubrics (
                         rubricId SERIAL PRIMARY KEY,
                         assignid INT NOT NULL,
                         criteriaId INT NOT NULL,
                         weightage INT NOT NULL,
                         FOREIGN KEY (assignid) REFERENCES assignments(assignid) ON DELETE CASCADE,
                         FOREIGN KEY (criteriaId) REFERENCES criteria(criteriaId) ON DELETE CASCADE
);

CREATE TABLE submissions (
                             submissionId SERIAL PRIMARY KEY,
                             assignId INT NOT NULL,
                             studentId INT NOT NULL,
                             file VARCHAR(255) NOT NULL,
                             submissionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                             grade INT DEFAULT NULL,
                             FOREIGN KEY (assignId) REFERENCES assignments(assignid) ON DELETE CASCADE,
                             FOREIGN KEY (studentId) REFERENCES users(userId) ON DELETE CASCADE
);

CREATE TABLE Review (
                        reviewid SERIAL PRIMARY KEY,
                        submissionid INT NOT NULL,
                        reviewedbyid INT NOT NULL,
                        feedback TEXT DEFAULT NULL,
                        feedbackmedia TEXT DEFAULT NULL,
                        score INT DEFAULT NULL,
                        reviewdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY (submissionid) REFERENCES submissions(submissionid) ON DELETE CASCADE,
                        FOREIGN KEY (reviewedbyid) REFERENCES users(userid) ON DELETE CASCADE
);
