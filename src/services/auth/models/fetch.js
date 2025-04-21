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

const fetchCourseById = (courseId) => {
    return knex('courses')
    .where({ courseid: courseId, isdeleted: false })
    .select('courseid', 'coursename', 'startdate', 'enddate', 'isarchived')
    .first();
}

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
                'courses.isarchived',
                'enrollments.status'
            )
            .innerJoin('courses', 'enrollments.courseid', 'courses.courseid')
            .where('enrollments.userid', userid);
            .where('enrollments.userid', id);

        return courses;  // Array of courses the user is enrolled in
    } catch (error) {
        throw new Error('Error fetching courses for user', error);
    }
};

const fetchAssignmentById = async (id) => {
    try{
        const assignment = await knex('assignments as a').where('assignid', id).select(
            'a.assignid as assignment_id',
            'a.title as assignment_name',
            'a.deadline as due_date',
        );
        return assignment;
    } catch (e) {
        console.log(e);
        throw new Error('Error fetching assignments for user');
    }
}

const fetchSubmissionById = async (submissionId) => {
    try{
        const submission = await knex('submissions as s').where('submissionid', submissionId)
            .select('s.submissiondate as submitted_on',
                's.file as file_name',
                's.mimetype as mime_type',
                's.grade as grade');
        return submission;
    } catch (e) {
        throw new Error('Error fetching submission id');
    }
}

const fetchAllCourses = async () => {
    try{
        const courses = await knex('courses')
        .select(['courseid', 'coursename', 'instructorid', 'startdate', 'enddate', 'isarchived']);
        return courses;
    } catch (error) {
        throw new Error('Error fetching all courses');
    }
}

const fetchAssignmentsByUserId = async (userId) => {
    try{
        const assignments = knex('assignments as a')
            .join('courses as c', 'a.courseid', 'c.courseid')
            .join('enrollments as e', 'c.courseid', 'e.courseid')
            .leftJoin('submissions as s', function () {
                this.on('a.assignid', '=', 's.assignid')
                    .andOn('s.userid', '=', knex.raw('?', [userId]));
            })
            .where('e.userid', userId)
            .andWhere('e.isdeleted', false)
            .andWhere('a.isdeleted', false)
            .select(
                'a.assignid as assignment_id',
                'a.title as assignment_name',
                'c.courseid as course_id',
                'c.coursename as course_name',
                'a.deadline as due_date',
                knex.raw('CASE WHEN s.submissionid IS NOT NULL THEN true ELSE false END AS submitted'),
                's.submissiondate as submitted_on',
                's.submissionid as submission_id',
            );

        console.log(assignments);

        return assignments;
    }catch(error){
        console.error('Error fetching assignments for user:', error);
        throw new Error('Error fetching assignments for user');
    }
}

const fetchGradesByCourseAndAssignmentId = async (courseId, assignId) => {
    try {
        const graded = await knex('grades as g')
            .join('users as u', 'g.studentid', 'u.userid') // student
            .join('assignments as a', 'g.assignid', 'a.assignid') // assignment
            .leftJoin('review as r', 'g.submissionid', 'r.submissionid') // reviews
            .leftJoin('users as ru', 'r.reviewedbyid', 'ru.userid') // reviewer
            .where('g.courseid', courseId)
            .andWhere('g.assignid', assignId)
            .select(
                'g.submissionid',
                'g.studentid',
                'u.name as student_name',
                'g.grade',
                'a.title as assignment_title',
                'r.reviewid',
                'r.feedback',
                'r.feedbackmedia',
                'r.score as review_score',
                'r.reviewdate',
                'ru.name as reviewer_name'
            );


        // Group by student
        const grouped = {};
        for (const row of graded) {
            const key = row.studentid;
            if (!grouped[key]) {
                grouped[key] = {
                    student_name: row.student_name,
                    grade: row.grade,
                    submissionid: row.submissionid,
                    assignment_title: row.assignment_title,
                    reviews: []
                };
            }

            if (row.reviewid) {
                grouped[key].reviews.push({
                    reviewid: row.reviewid,
                    feedback: row.feedback,
                    feedbackmedia: row.feedbackmedia,
                    score: row.review_score,
                    reviewdate: row.reviewdate,
                    reviewer_name: row.reviewer_name
                });
            }
        }

        return Object.values(grouped);
    } catch (error) {
        console.error('Error fetching grades:', error);
        throw new Error('Error fetching grades');
    }
};


const fetchAssignmentsToPeerReviewByUserId = async (userId) => {
    try{
        const assignmentsToPeerReview = await knex('review as r')
            .join('submissions as s', 'r.submissionid', 's.submissionid')
            .join('assignments as a', 's.assignid', 'a.assignid')
            .join('users as u', 's.userid', 'u.userid')
            .where('r.reviewedbyid', userId)
            .andWhere('r.score', null)
            .select(
                'r.reviewid',
                'a.title as assignment_title',
                'a.deadline',
                's.submissionid',
                's.file as submission_file',
                'a.assignid as assign_id',
                'u.name as reviewee_name',
                'u.userid as reviewee_id',
                'r.feedback',
                'r.feedbackmedia'
            );


        // now filter out such that for same reviewee_id and assign_id, retain only the latest submissionid
        const seen = new Map();
        const latestReviews = [];

        for (const row of assignmentsToPeerReview) {
            const key = `${row.assign_id}-${row.reviewee_id}`;
            if (!seen.has(key) || row.submissionid > seen.get(key).submissionid) {
                seen.set(key, row);
            }
        }

        // Collect values from the Map
        for (const review of seen.values()) {
            latestReviews.push(review);
        }

        return latestReviews;
    } catch (error) {
        console.error('Error fetching assignments for user:', error);
        throw new Error('Error fetching assignments for user');
    }
}

const fetchSubmissionByUserAndAssignment = async (assignid, studentid) => {
    try {
        // 1. Fetch assignment info
        const assignment = await knex('assignments')
            .where('assignid', assignid)
            .first();

        if (!assignment) throw new Error('Assignment not found');

        // 2. Fetch submission for the student
        const submission = await knex('submissions')
            .where({ assignid, userid: studentid })
            .orderBy('submissionid', 'desc') // in case of resubmissions
            .first()
            .select(['submissionid', 'assignid', 'submissiondate', 'grade', 'mimetype', 'file', 'userid']);

        if (!submission) {
            return {
                assignment,
                submission: null
            };
        }

        // 3. Fetch reviews for that submission
        const reviews = await knex('review')
            .join('users', 'review.reviewedbyid', 'users.userid')
            .where('submissionid', submission.submissionid)
            .select(
                'review.reviewid',
                'review.feedback',
                'review.feedbackmedia',
                'review.score',
                'review.reviewedbyid',
                'review.reviewdate',
                'users.name as reviewername'
            );

        return {
            assignment,
            submission: {
                ...submission,
                reviews
            }
        };
    } catch (error) {
        console.error('Error fetching assignment:', error);
        throw new Error('Error fetching assignment');

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
    fetchCourseById,
    fetchAllCourses,
    fetchAssignmentsByUserId,
    fetchAssignmentsToPeerReviewByUserId,
    fetchAssignmentById,
    fetchSubmissionById,
    fetchSubmissionByUserAndAssignment,
    fetchGradesByCourseAndAssignmentId,
    fetchRubricByAssignmentId,
    fetchRubricsByCourseID,
    getSubmissionsToReviewByStudentID,
    getReviewsBySubmissionId
};