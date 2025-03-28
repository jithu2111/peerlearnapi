const insert = require('../models/insert');
const logger = require('../../../config/logger');
const fetch = require('../models/fetch');

// Insert a new user
const insertUser = async (name, email, role, password) => {

    try {
        const user = await insert.insertUser(name, email, role, password);
        logger.info(`User inserted: ${user[0].userid}`);
        return {
            status: 201,
            data: user[0],
        };
    } catch (error) {
        logger.error(`Error inserting user: ${error.message}`);
        return {
            status: 500,
            error: error.message,
        };
    }
};

// Insert a new course
const insertCourse = async (body, res) => {
    const { courseName, instructorID, startDate, endDate, isArchived } = body;

    try {
        // Validate that the instructor exists and is an Instructor
        const instructor = await fetch.fetchUserById(instructorID);
        if (!instructor) {
            return res.status(404).json({ error: 'Instructor not found' });
        }
        if (instructor.role !== 'Instructor') {
            return res.status(400).json({ error: 'The specified user is not an Instructor' });
        }

        const course = await insert.insertCourse(courseName, instructorID, startDate, endDate, isArchived);
        logger.info(`Course inserted: ${course[0].courseid}`);
        res.status(201).json(course[0]);
    } catch (error) {
        logger.error(`Error inserting course: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Insert a new assignment
const insertAssignment = async (req, res) => {
    const { courseId, title, description, deadline, maxScore, weightage } = req.body;

    try {
        // Validate that the course exists
        const course = await fetch.fetchCourses().where({ courseid: courseId }).first();
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        //@TODO: remove this after developing auth module
        const userID = course.instructorid
        const userRole = "Instructor";
        // Check if the requesting user is the instructor of the course
        if (userID !== course.instructorid && userRole !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only the course instructor can create assignments.' });
        }

        const assignment = await insert.insertAssignment(courseId, title, description, deadline, maxScore, weightage);
        logger.info(`Assignment inserted: ${assignment[0].assignid}`);
        res.status(201).json(assignment[0]);
    } catch (error) {
        logger.error(`Error inserting assignment: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Insert a new enrollment (registration)
const insertEnrollment = async (req, res) => {
    const { userId, courseId } = req.body;

    try {
        // Validate that the user exists
        const user = await fetch.fetchUserById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Validate that the course exists
        const course = await fetch.fetchCourses().where({ courseid: courseId }).first();
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if the user is already enrolled
        const existingEnrollment = await fetch
            .fetchEnrollmentsByUser(userId)
            .where({ courseid: courseId })
            .first();
        if (existingEnrollment) {
            return res.status(400).json({ error: 'User is already enrolled in this course' });
        }

        // Check if the requesting user is the student enrolling or an Instructor
        if (req.user.id !== userId && req.user.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. You can only enroll yourself or must be an Instructor.' });
        }

        const enrollment = await insert.insertEnrollment(userId, courseId);
        logger.info(`Enrollment inserted: ${enrollment[0].enrollmentid}`);
        res.status(201).json(enrollment[0]);
    } catch (error) {
        logger.error(`Error inserting enrollment: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    insertUser,
    insertCourse,
    insertAssignment,
    insertEnrollment,
};