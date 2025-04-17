const del = require('../models/delete');
const fetch = require('../models/fetch');
const logger = require('../../../config/logger');

// Soft delete a user (accessible to Instructors only)
const deleteUser = async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user;

    try {
        if (requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only Instructors can delete users.' });
        }

        const user = await fetch.fetchUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (requestingUser.id === parseInt(id)) {
            return res.status(400).json({ error: 'You cannot delete yourself.' });
        }

        const updatedCount = await del.deleteUser(id);
        if (updatedCount === 0) {
            return res.status(404).json({ error: 'User not found or already deleted' });
        }

        logger.info(`User soft-deleted: ${id}`);
        res.json({ message: 'User soft-deleted successfully' });
    } catch (error) {
        logger.error(`Error soft-deleting user ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Soft delete a course (accessible to the course instructor only)
const deleteCourse = async (req, res) => {
    const { id } = req.params;
    const requestingUser = req.user;

    try {
        const course = await fetch.fetchCourses().where({ courseid: id }).first();
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (requestingUser.id !== course.instructorid && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only the course instructor can delete this course.' });
        }

        const updatedCount = await del.deleteCourse(id);
        if (updatedCount === 0) {
            return res.status(404).json({ error: 'Course not found or already deleted' });
        }

        logger.info(`Course soft-deleted: ${id}`);
        res.json({ message: 'Course soft-deleted successfully' });
    } catch (error) {
        logger.error(`Error soft-deleting course ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Soft delete an assignment (accessible to the course instructor only)
const deleteAssignment = async (req, res) => {
    const { assignid } = req.body;
    const requestingUser = req.user;

    try {
        const assignment = await fetch.fetchAssignments().where({ assignid: assignid }).first();
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const course = await fetch.fetchCourses().where({ courseid: assignment.courseid }).first();
        if (!course) {
            return res.status(404).json({ error: 'Associated course not found' });
        }

        if (requestingUser.id !== course.instructorid && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only the course instructor can delete this assignment.' });
        }

        const updatedCount = await del.deleteAssignment(assignid);
        if (updatedCount === 0) {
            return res.status(404).json({ error: 'Assignment not found or already deleted' });
        }

        logger.info(`Assignment soft-deleted: ${id}`);
        res.json({ message: 'Assignment soft-deleted successfully' });
    } catch (error) {
        logger.error(`Error soft-deleting assignment ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Soft delete an enrollment (unenroll a user from a course)
const deleteEnrollment = async (req, res) => {
    const { userId, courseId } = req.params;
    const requestingUser = req.user;

    try {
        const enrollment = await fetch
            .fetchEnrollmentsByUser(userId)
            .where({ courseid: courseId })
            .first();
        if (!enrollment) {
            return res.status(404).json({ error: 'Enrollment not found' });
        }

        if (requestingUser.id !== parseInt(userId) && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. You can only unenroll yourself or must be an Instructor.' });
        }

        const updatedCount = await del.deleteEnrollment(userId, courseId);
        if (updatedCount === 0) {
            return res.status(404).json({ error: 'Enrollment not found or already deleted' });
        }

        logger.info(`Enrollment soft-deleted: user ${userId} from course ${courseId}`);
        res.json({ message: 'Enrollment soft-deleted successfully' });
    } catch (error) {
        logger.error(`Error soft-deleting enrollment for user ${userId} in course ${courseId}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    deleteUser,
    deleteCourse,
    deleteAssignment,
    deleteEnrollment,
};