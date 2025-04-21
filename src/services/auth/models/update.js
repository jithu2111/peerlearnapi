const knex = require('../../../config/db');

// Update a user
const updateUser = (userId, updates) => {
    return knex('users')
        .where({ userid: userId, isdeleted: false })
        .update(updates)
        .returning(['userid', 'name', 'email', 'role']);
};

// Update a course
const updateCourse = (courseId, updates) => {
    return knex('courses')
        .where({ courseid: courseId, isdeleted: false })
        .update(updates)
        .returning(['courseid', 'coursename', 'instructorid', 'startdate', 'enddate', 'isarchived']);
};

// Update an assignment
const updateAssignment = (assignId, updates) => {
    return knex('assignments')
        .where({ assignid: assignId, isdeleted: false })
        .update(updates)
        .returning(['assignid', 'courseid', 'title', 'description', 'deadline', 'maxscore', 'weightage']);
};

module.exports = {
    updateUser,
    updateCourse,
    updateAssignment,
};