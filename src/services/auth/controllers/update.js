const update = require('../models/update');
const fetch = require('../models/fetch');
const logger = require('../../../config/logger');

// Update a user (accessible to the user themselves or Instructors)
const updateUser = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const requestingUser = req.user;

    try {
        if (requestingUser.id !== parseInt(id) && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. You can only update your own data or must be an Instructor.' });
        }

        const user = await fetch.fetchUserById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if ('role' in updates) {
            return res.status(400).json({ error: 'Updating the role field is not allowed.' });
        }

        if ('password' in updates) {
            return res.status(400).json({ error: 'Updating the password field is not allowed. Use the password reset endpoint.' });
        }

        const allowedUpdates = ['name', 'email'];
        const updateKeys = Object.keys(updates);
        const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));
        if (!isValidUpdate) {
            return res.status(400).json({ error: 'Invalid updates. Only name and email can be updated.' });
        }

        const updatedUser = await update.updateUser(id, updates);
        if (!updatedUser || updatedUser.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User updated: ${id}`);
        res.json(updatedUser[0]);
    } catch (error) {
        logger.error(`Error updating user ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Update a course (accessible to the course instructor only)
const updateCourse = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const requestingUser = req.user;

    try {
        const course = await fetch.fetchCourses().where({ courseid: id }).first();
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        if (requestingUser.id !== course.instructorid && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only the course instructor can update this course.' });
        }

        const allowedUpdates = ['coursename', 'startdate', 'enddate', 'isarchived'];
        const updateKeys = Object.keys(updates);
        const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));
        if (!isValidUpdate) {
            return res.status(400).json({ error: 'Invalid updates. Only coursename, startdate, enddate, and isarchived can be updated.' });
        }

        if ('instructorid' in updates) {
            const newInstructor = await fetch.fetchUserById(updates.instructorid);
            if (!newInstructor) {
                return res.status(404).json({ error: 'New instructor not found' });
            }
            if (newInstructor.role !== 'Instructor') {
                return res.status(400).json({ error: 'The specified user is not an Instructor' });
            }
        }

        const updatedCourse = await update.updateCourse(id, updates);
        if (!updatedCourse || updatedCourse.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }

        logger.info(`Course updated: ${id}`);
        res.json(updatedCourse[0]);
    } catch (error) {
        logger.error(`Error updating course ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

// Update an assignment (accessible to the course instructor only)
const updateAssignment = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const requestingUser = req.user;

    try {
        const assignment = await fetch.fetchAssignments().where({ assignid: id }).first();
        if (!assignment) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        const course = await fetch.fetchCourses().where({ courseid: assignment.courseid }).first();
        if (!course) {
            return res.status(404).json({ error: 'Associated course not found' });
        }

        if (requestingUser.id !== course.instructorid && requestingUser.role !== 'Instructor') {
            return res.status(403).json({ error: 'Access denied. Only the course instructor can update this assignment.' });
        }

        const allowedUpdates = ['title', 'description', 'deadline', 'maxscore', 'weightage'];
        const updateKeys = Object.keys(updates);
        const isValidUpdate = updateKeys.every((key) => allowedUpdates.includes(key));
        if (!isValidUpdate) {
            return res.status(400).json({ error: 'Invalid updates. Only title, description, deadline, maxscore, and weightage can be updated.' });
        }

        if ('courseid' in updates) {
            const newCourse = await fetch.fetchCourses().where({ courseid: updates.courseid }).first();
            if (!newCourse) {
                return res.status(404).json({ error: 'New course not found' });
            }
            if (requestingUser.id !== newCourse.instructorid && requestingUser.role !== 'Instructor') {
                return res.status(403).json({ error: 'Access denied. You are not the instructor of the new course.' });
            }
        }

        const updatedAssignment = await update.updateAssignment(id, updates);
        if (!updatedAssignment || updatedAssignment.length === 0) {
            return res.status(404).json({ error: 'Assignment not found' });
        }

        logger.info(`Assignment updated: ${id}`);
        res.json(updatedAssignment[0]);
    } catch (error) {
        logger.error(`Error updating assignment ${id}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
};

const archiveCourse = async (req, res) => {
    const id = req.body.courseid;
    const status = req.body.status;
    return await update.updateCourse(id, {
        isarchived: status,
    })
}

module.exports = {
    updateUser,
    updateCourse,
    updateAssignment,
    archiveCourse
};