const knex = require('../../../config/db');

// Insert a new user
const insertUser = (name, email, role, password) => {
    return knex('users')
        .insert({ name, email, role, password })
        .returning(['userid', 'name', 'email', 'role']);
};

// Insert a new course
const insertCourse = (courseName, instructorID, startDate, endDate, isArchived) => {
    return knex('courses')
        .insert({
            coursename: courseName,
            instructorid: instructorID,
            startdate: startDate,
            enddate: endDate,
            isarchived: isArchived,
        })
        .returning(['courseid', 'coursename', 'instructorid', 'startdate', 'enddate', 'isarchived']);
};

// Insert a new assignment
const insertAssignment = (courseId, title, description, deadline, maxScore, weightage) => {
    return knex('assignments')
        .insert({
            courseid: courseId,
            title,
            description,
            deadline,
            maxscore: maxScore,
            weightage,
        })
        .returning(['assignid', 'courseid', 'title', 'description', 'deadline', 'maxscore', 'weightage']);
};

// Insert a new enrollment
const insertEnrollment = (userId, courseId) => {
    return knex('enrollments')
        .insert({
            userid: userId,
            courseid: courseId,
        })
        .returning(['enrollmentid', 'userid', 'courseid']);
};

module.exports = {
    insertUser,
    insertCourse,
    insertAssignment,
    insertEnrollment,
};