const knex = require('../../../config/db');

// Soft delete a user
const deleteUser = (userId) => {
    return knex('users')
        .where({ userid: userId, isDeleted: false })
        .update({ isDeleted: true });
};

// Soft delete a course
const deleteCourse = (courseId) => {
    return knex('courses')
        .where({ courseid: courseId, isDeleted: false })
        .update({ isDeleted: true });
};

// Soft delete an assignment
const deleteAssignment = (assignId) => {
    return knex('assignments')
        .where({ assignid: assignId, isDeleted: false })
        .update({ isDeleted: true });
};

// Soft delete an enrollment
const deleteEnrollment = (userId, courseId) => {
    return knex('enrollments')
        .where({ userid: userId, courseid: courseId, isDeleted: false })
        .update({ isDeleted: true });
};

module.exports = {
    deleteUser,
    deleteCourse,
    deleteAssignment,
    deleteEnrollment,
};