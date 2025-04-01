const fetch = require('../models/fetch');
const logger = require('../../../config/logger');

// Fetch all users (accessible to Instructors only)
const fetchUsers = async (req, res) => {
    try {
        if (req.user.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only Instructors can fetch all users.' });
        }

        const users = await fetch.fetchUsers();
        res.json(users);
    } catch (error) {
        logger.error(`Error fetching users: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Fetch a single user by ID (accessible to the user themselves or Instructors)
const fetchUserById = async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user;

    try {
        if (requestingUser.id !== parseInt(id) && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. You can only fetch your own data or must be an Instructor.' });
        }

        const user = await fetch.fetchUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        logger.error(`Error fetching user by ID ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Fetch users by role (accessible to Instructors only)
const fetchUsersByRole = async (req, res) => {
    const { role } = req.query;

    try {
        if (req.user.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only Instructors can fetch users by role.' });
        }

        if (!['Student', 'Instructor', 'Grader'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role. Must be Student, Instructor, or Grader.' });
        }

        const users = await fetch.fetchUsersByRole(role);
        res.json(users);
    } catch (error) {
        logger.error(`Error fetching users by role ${role}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Fetch all courses (accessible to all authenticated users)
const fetchCourses = async (req, res) => {
    try {
        const courses = await fetch.fetchCourses();
        res.json(courses);
    } catch (error) {
        logger.error(`Error fetching courses: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Fetch assignments for a specific course (accessible to enrolled students or the course instructor)
const fetchAssignments = async (req, res) => {
    const { courseId } = req.params;
    // const requestingUser = req.user;

    try {
        const course = await fetch.fetchCourses().where({ courseid: courseId }).first();
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        const enrollment = await fetch.fetchEnrollmentsByUser(requestingUser.id).where({ courseid: courseId }).first();
        // if (!enrollment && requestingUser.id !== course.instructorid && requestingUser.role !== 'Instructor') {
        //     return res.status(403).json({ error: 'Access denied. You must be enrolled in the course or be the instructor.' });
        // }

        const assignments = await fetch.fetchAssignments(courseId);
        res.json(assignments);
    } catch (error) {
        logger.error(`Error fetching assignments for course ${courseId}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Fetch enrollments for a specific user (accessible to the user themselves or Instructors)
const fetchStudentsByCourseId = async (req, res) => {
    const { userId } = req.params;
    const requestingUser = req.user;

    try {
        if (requestingUser.id !== parseInt(userId) && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. You can only fetch your own enrollments or must be an Instructor.' });
        }

        const enrollments = await fetch.fetchEnrollmentsByUser(userId);
        res.json(enrollments);
    } catch (error) {
        logger.error(`Error fetching enrollments for user ${userId}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};



// For internal use (e.g., in auth service for login)
const fetchUserByEmail = async ({ email } ) => {
    try {
        const user = await fetch.fetchUserByEmail(email);
        return user;
    } catch (error) {
        logger.error(`Error fetching user by email ${email}: ${error.message}`);
        throw new Error(error.message);
    }
};

const fetchCoursesByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await fetch.fetchCourseByUserId(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}


module.exports = {
    fetchUserById,
    fetchUsersByRole,
    fetchCourses,
    fetchAssignments,
    fetchStudentsByCourseId,
    fetchCoursesByUserId,
    fetchUserByEmail,
};