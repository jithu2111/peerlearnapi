const knex = require('../../../config/db');
const bcrypt = require('bcrypt');
const {log} = require("winston");
const _ = require('lodash');

// Insert a new user
const insertUser =  async (name, email, role, password) => {
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
const insertCourse = async (courseName, instructorID, startDate, endDate, isArchived) => {
    const existingCourse = await knex('courses')
        .where({
            coursename: courseName,
            startdate: startDate,
            enddate: endDate
        })
        .first();

    if (existingCourse) {
        throw new Error('Course already exists with the same name and dates.');
    }

    // Insert new course
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


//Create a new rubric
const insertRubric = async (rubricData) => {
    try {

        const [rubric] = await knex('rubrics')
            .insert(rubricData)
            .returning(['rubricid', 'assignid', 'criteriaid', 'weightage']);

        return rubric;  // Return the inserted rubric with the specified fields
    } catch (error) {
        throw new Error('Error inserting rubric: ' + error.message);

    }
};

const insertCriteria = async (criteriaData) => {
    try {
        // Insert the criteria data into the 'criteria' table
        const [criteria] = await knex('criteria')
            .insert(criteriaData)  // Insert the provided criteria data
            .returning(['criteriaid', 'criterianame', 'description']);  // Return only specific columns

        return criteria;  // Return the inserted criteria with the specified fields
    } catch (error) {
        throw new Error('Error inserting criteria: ' + error.message);
    }
};

const insertSubmission = async (submissionData) => {
    const { assignid, userid, file } = submissionData;

    if (!assignid || !userid || !file) {
        throw new Error('Assignment ID, Student ID, and file are required.');
    }

    try {
        return await knex.transaction(async (trx) => {
            // 1. Get course ID for the assignment
            const assignment = await trx('assignments')
                .where('assignid', assignid)
                .first('courseid');

            if (!assignment) {
                throw new Error('Assignment not found');
            }

            // 2. Insert submission and return the row (✅ PostgreSQL-safe)
            const [submission] = await trx('submissions')
                .insert({
                    assignid,
                    userid,
                    file,
                    submissiondate: knex.fn.now(),
                    grade: null
                })
                .returning(['submissionid', 'assignid', 'userid', 'file', 'submissiondate', 'grade']);

            const submissionid = submission.submissionid;

            // 3. Get enrolled students (excluding submitter)
            const enrolledStudents = await trx('enrollments')
                .join('users', 'enrollments.userid', '=', 'users.userid')
                .where('enrollments.courseid', assignment.courseid)
                .whereNot('users.userid', userid)
                .select('users.userid', 'users.name');

            // 4. Get review counts for each student for this assignment
            const reviewCounts = await trx('review')
                .join('submissions', 'review.submissionid', 'submissions.submissionid')
                .where('submissions.assignid', assignid)
                .groupBy('review.reviewedbyid')
                .select('review.reviewedbyid', knex.raw('COUNT(review.reviewid) as count'));

            const reviewCountMap = _.keyBy(reviewCounts, 'reviewedbyid');

            // 5. Filter eligible students with < 3 reviews
            let eligibleStudents = enrolledStudents.filter(student => {
                const count = reviewCountMap[student.userid]?.count || 0;
                return count < 3;
            });

            // 6. Fallback: if all have ≥ 3 reviews, assign randomly from full pool
            if (eligibleStudents.length === 0) {
                eligibleStudents = enrolledStudents;
            }

            // 7. Pick up to 3 reviewers
            const assignedReviewers = _.sampleSize(eligibleStudents, Math.min(3, eligibleStudents.length));

            // 8. Avoid duplicate review entries
            const peerReviews = [];

            for (const reviewer of assignedReviewers) {
                const alreadyAssigned = await trx('review')
                    .where({ submissionid: submissionid, reviewedbyid: reviewer.userid })
                    .first();

                if (!alreadyAssigned) {
                    peerReviews.push({
                        submissionid: submissionid,
                        reviewedbyid: reviewer.userid,
                        reviewdate: knex.fn.now()
                    });
                }
            }

            if (peerReviews.length > 0) {
                await trx('review').insert(peerReviews);
            }

            if (!submission || !submission.file) {
                throw new Error('submission or submission.file is undefined');
            }

            return {
                message: 'Submission created successfully',
                file: submission.file,
                grade: submission.grade,
                reviews: assignedReviewers.map(r => _.pick(r, ['userid', 'name']))
            };
        });
    } catch (error) {
        console.error('Error inserting submission:', error);
        throw new Error('Error inserting submission: ' + error.message);
    }
};


// Function to create an assignment and rubrics
const insertAssignmentWithRubrics = async (assignmentData, rubricsData) => {
    const { courseid, title, description, deadline, maxscore, weightage } = assignmentData;

    try {
        return await knex.transaction(async (trx) => {
            // Insert the assignment

            const [assignment] = await trx('assignments')
                .insert({ courseid, title, description, deadline, maxscore, weightage })
                .returning(['assignid']);


            const { assignid } = assignment;
            // const rubricEntries = [];



            const rubricEntries = await Promise.all(rubricsData.map(async (rubric) => {
                let criteriaid = rubric.criteriaid;
                if (!criteriaid) {
                    // If criteriaId is not provided, check if criteria already exists
                    const { criterianame, description } = rubric;
                    let existingCriteria = await trx('criteria')
                        .select('criteriaid')
                        .where({ criterianame })
                        .first();

                    if (!existingCriteria) {
                        // Insert new criteria and get its generated criteriaId
                        const [newCriteria] = await trx('criteria')
                            .insert({ criterianame, description })
                            .returning(['criteriaid']);
                        criteriaid = newCriteria.criteriaid;
                    } else {
                        criteriaid = existingCriteria.criteriaid;
                    }
                }

                // Return rubric entry
                return {
                    assignid,
                    criteriaid
                };
            }));

            // Ensure "total_review_score" is always added
            let totalReviewScoreCriteria = await trx('criteria')
                .select('criteriaid')
                .where({ criterianame: 'Total Review Score' })
                .first();

            if (!totalReviewScoreCriteria) {
                const [newReviewCriteria] = await trx('criteria')
                    .insert({ criterianame: 'Total Review Score', description: 'Peer review score' })
                    .returning(['criteriaid']);
                totalReviewScoreCriteria = newReviewCriteria;
            }

            rubricEntries.push({
                assignid,
                criteriaid: totalReviewScoreCriteria.criteriaid,
            });
            // Insert rubrics into the database
            await trx('rubrics').insert(rubricEntries);

            return { assignment, rubrics: rubricEntries };
        });
    } catch (error) {
        throw new Error('Error inserting assignment and rubrics: ' + error.message);
    }
};

const insertPeerfeedback = async (feedbackData) => {
    const { submissionId, reviewedById, feedback, feedbackMedia, score } = feedbackData;

    if (!submissionId || !reviewedById || score === undefined) {
        throw new Error('Submission ID, Reviewed By ID, and Score are required.');
    }

    if (typeof score !== 'number' || isNaN(score) || score < 0 || score > 10) {
        throw new Error('Score must be a number between 0 and 10.');
    }

    if (!feedback || feedback.trim() === '') {
        throw new Error('Feedback cannot be empty.');
    }

    return await knex.transaction(async (trx) => {
        // Step 1: Ensure reviewer is assigned to this submission
        const existingReview = await trx('review')
            .where({
                submissionid: submissionId,
                reviewedbyid: reviewedById
            })
            .first();

        if (!existingReview) {
            throw new Error('Reviewer is not assigned to this submission.');
        }

        // Prevent duplicate submission
        if (existingReview.feedback || existingReview.score !== null) {
            throw new Error('Feedback has already been submitted for this review.');
        }

        // Step 2: Prevent self-review
        const submission = await trx('submissions')
            .where({ submissionid: submissionId })
            .select('userid')
            .first();

        if (!submission) {
            throw new Error('Submission not found.');
        }

        if (submission.userid === reviewedById) {
            throw new Error('You cannot review your own submission.');
        }
        // Step 3: Update feedback details in Review table
        await trx('review')
            .where({ submissionid: submissionId, reviewedbyid: reviewedById })
            .update({
                feedback,
                feedbackmedia: feedbackMedia,
                score,
                reviewdate: knex.fn.now()
            });

        return { message: 'Peer feedback submitted successfully' };
    });
};


module.exports = {
    insertUser,
    insertCourse,
    insertAssignment,
    insertEnrollment,
    insertRubric,
    insertCriteria,
    insertSubmission,
    insertAssignmentWithRubrics,
    insertPeerfeedback
};