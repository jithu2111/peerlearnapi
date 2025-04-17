const knex = require('../../../config/db');

// Fetch all users (excluding soft-deleted)
const fetchUsers = () => {
    return knex('users')
        .where({ isdeleted: false })
        .select('userid', 'name', 'email', 'role')
        .orderBy('name', 'asc');
};

// Fetch a single user by ID (excluding soft-deleted)
const fetchUserById = (userId) => {
    return knex('users')
        .where({ userid: userId, isdeleted: false })
        .select('userid', 'name', 'email', 'role')
        .first();
};

// Fetch a single user by email (used for login, includes password, excluding soft-deleted)
const fetchUserByEmail = (email) => {
    return knex('users')
        .where({ email, isdeleted: false })
        .select('*')
        .first();
};

// Fetch users by role (excluding soft-deleted)
const fetchUsersByRole = (role) => {
    return knex('users')
        .where({ role, isdeleted: false })
        .select('userid', 'name', 'email', 'role')
        .orderBy('name', 'asc');
};

// Fetch all courses (excluding soft-deleted)
const fetchCourses = () => {
    return knex('courses')
        .where({ isdeleted: false })
        .select('courseid', 'coursename', 'instructorid', 'startdate', 'enddate', 'isarchived')
        .orderBy('startdate', 'desc');
};

// Fetch assignments for a specific course (excluding soft-deleted)
const fetchAssignments = (courseId) => {
    return knex('assignments')
        .where({ courseid: courseId, isdeleted: false })
        .select('assignid', 'courseid', 'title', 'description', 'deadline', 'maxscore', 'weightage');
};

// Fetch enrollments for a specific user (excluding soft-deleted)
const fetchEnrollmentsByUser = (userId) => {
    return knex('enrollments')
        .where({ userid: userId, isdeleted: false })
        .select('enrollmentid', 'userid', 'courseid');
};

const fetchCourseByUserId = async (id) => {
    try {
        // Fetch courses by joining users, enrollments, and courses tables
        const courses = await knex('enrollments')
            .select(
                'courses.courseid',
                'courses.coursename',
                'courses.startdate',
                'courses.enddate',
                'courses.isarchived'
            )
            .innerJoin('courses', 'enrollments.courseid', 'courses.courseid')
            .where('enrollments.userid', id);

        return courses;  // Array of courses the user is enrolled in
    } catch (error) {
        throw new Error('Error fetching courses for user', error);
    }
};

const fetchCourseByInstructorId = async (id) => {
    try{
        const courses = await knex('courses')
            .select(
                'courses.courseid',
                'courses.coursename',
                'courses.startdate',
                'courses.enddate',
                'courses.isarchived'
            ).where('courses.instructorid', id);
        return courses;
    } catch (e) {
        throw new Error('Error fetching courses for user', e);
    }
}

//Fetch Criteria By CourseID
const fetchCriteriaByCourseId = async (courseid) => {
    try {
        // Fetch all criteria linked to the given course
        const courseCriteria = await knex('rubrics')
            .join('criteria', 'rubrics.criteriaid', '=', 'criteria.criteriaid')
            .select('criteria.criteriaid', 'criteria.criterianame', 'criteria.description')
            .where('rubrics.assignid', 'in', function () {
                this.select('assignid').from('assignments').where('courseid', courseid);
            })
            .groupBy('criteria.criteriaid', 'criteria.criterianame', 'criteria.description');

        // Fetch the "total_review_score" criteria separately
        const totalReviewScore = await knex('criteria')
            .select('criteriaid', 'criterianame', 'description')
            .where('criterianame', 'total_review_score')
            .first();

        // Ensure "total_review_score" is included in the results
        if (!courseCriteria.some(c => c.criterianame === 'total_review_score') && totalReviewScore) {
            courseCriteria.push(totalReviewScore);
        }

        return courseCriteria;
    } catch (error) {
        throw new Error('Error fetching criteria: ' + error.message);
    }
};

const fetchRubricByAssignmentId = async (assignmentid) => {
    try {
        // Fetch all rubrics linked to the given assignment
        const rubrics = await knex('rubrics')
            .join('criteria', 'rubrics.criteriaid', '=', 'criteria.criteriaid')
            .select(
                'rubrics.rubricid',
                'rubrics.assignmentid',
                'criteria.criteriaid',
                'criteria.criterianame',
                'criteria.description',
                'rubrics.weightage'
            )
            .where('rubrics.assignmentId', assignmentid);

        return rubrics;
    } catch (error) {
        throw new Error('Error fetching rubrics: ' + error.message);
    }
};

const fetchRubricsByCourseID = async (courseid) => {
    try {
        // Fetch all rubrics linked to assignments in the given course
        const rubrics = await knex('rubrics')
            .join('criteria', 'rubrics.criteriaid', '=', 'criteria.criteriaid')
            .join('assignments', 'rubrics.assignid', '=', 'assignments.assignid')
            .select(
                'rubrics.rubricid',
                'rubrics.assignid',
                'assignments.title',
                'criteria.criteriaid',
                'criteria.criterianame',
                'criteria.description'
            )
            .where('assignments.courseid', courseid)
            .orderBy('assignments.assignid');

        return rubrics;
    } catch (error) {
        throw new Error('Error fetching rubrics: ' + error.message);
    }
};

const getSubmissionsToReviewByStudentID = async (userid) => {
    try {

        const rows = await knex('review')
            .join('submissions', 'review.submissionid', '=', 'submissions.submissionid')
            .join('users', 'submissions.userid', '=', 'users.userid')
            .join('assignments', 'submissions.assignid', '=', 'assignments.assignid')
            .select(
                'submissions.submissionid',
                'submissions.file',
                'submissions.submissiondate',
                'users.userid as submitter_id',
                'users.name as submitter_name',
                'assignments.assignid as assignment_id',
                'assignments.title as assignment_title',
                'assignments.description as assignment_description',
                'review.feedback',
                'review.score',
                'review.reviewdate'
            )
            .where('review.reviewedbyid', userid);




        return rows.map(row => ({
            submissionid: row.submissionid,
            file: row.file,
            submissionDate: row.submissiondate,
            submittedby: {
                id: row.submitter_id,
                name: row.submitter_name
            },
            assignment: {
                id: row.assignment_id,
                title: row.assignment_title,
                description: row.assignment_description
            },
            reviewStatus: row.reviewdate ? 'Completed' : 'Pending',
            feedback: row.feedback,
            score: row.score
        }));
    } catch (error) {
        throw new Error('Error fetching submissions to review: ' + error.message);
    }
    console.log('Received userid:', userid);

};

const getReviewsBySubmissionId = async (submissionid) => {
    const reviews = await knex('review')
        .join('users', 'review.reviewedbyid', '=', 'users.userid')
        .where('review.submissionid', submissionid)
        .select(
            'review.reviewid',
            'review.reviewedbyid as reviewerId',
            'users.name as reviewerName',
            'review.score',
            'review.feedback',
            'review.feedbackmedia',
            'review.reviewdate'
        );

    return reviews;
};


module.exports = {
    fetchUsers,
    fetchUserById,
    fetchUserByEmail,
    fetchUsersByRole,
    fetchCourses,
    fetchAssignments,
    fetchEnrollmentsByUser,
    fetchCourseByUserId,
    fetchCourseByInstructorId,
    fetchCriteriaByCourseId,
    fetchRubricByAssignmentId,
    fetchRubricsByCourseID,
    getSubmissionsToReviewByStudentID,
    getReviewsBySubmissionId
};