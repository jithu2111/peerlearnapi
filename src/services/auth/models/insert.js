const knex = require('../../../config/db');
const bcrypt = require('bcrypt');

// Insert a new user
const insertUser =  async (name, email, role, password) => {
    console.log(name, email, role, password);
    const validRoles = ["Student", "Grader", "Instructor"];
    if (!validRoles.includes(role)) {
        throw new Error('Invalid role. Valid roles are: Student, Grader, Instructor.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    return knex('users')
        .insert({
            name,
            email,
            role,
            password: hashedPassword,
            isdeleted: false })
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
            isdeleted: false,
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
            isdeleted: false,
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