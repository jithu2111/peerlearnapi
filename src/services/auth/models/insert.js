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
            // Insert submission
            const [submission] = await trx('submissions')
                .insert({
                    assignid: assignid,
                    userid: userid,
                    file: file,
                    submissiondate: knex.fn.now(),
                    grade: null
                })
                .returning(['submissionid', 'assignid', 'userid', 'file', 'submissiondate', 'grade']);

            const submissionid = submission.submissionid;

            // Get enrolled students for the course
            const enrolledStudents = await trx('enrollments')
                .join('users', 'enrollments.userid', '=', 'users.userid')
                .where('enrollments.courseid', function () {
                    this.select('courseid').from('assignments').where('assignid', assignid);
                })
                .select('users.userid', 'users.name');

            // Find students who have reviewed fewer than 3 submissions
            const eligibleStudents = await trx('users')
                .whereIn('userid', enrolledStudents.map(s => s.userid))
                .whereNotIn('userid', function () {
                    this.select('reviewedbyid')
                        .from('review')
                        .groupBy('reviewedbyid')
                        .havingRaw('COUNT(reviewid) >= 3'); // Exclude those who have reviewed 3 submissions
                })
                .select('userid', 'name');

            let assignedReviewers = [];

            //Randomly pick 3 reviewers
            if (eligibleStudents.length >= 3) {
                assignedReviewers = eligibleStudents
                    .sort(() => Math.random() - 0.5) // Shuffle the list
                    .slice(0, 3); // Pick first 3

                // Insert into `review` table
                const peerReviews = assignedReviewers.map((reviewer) => ({
                    submissionid: submissionid,
                    reviewedbyid: reviewer.userid,
                    reviewdate: knex.fn.now()
                }));

                await trx('review').insert(peerReviews);
            }

            return {
                submission,
                assignedReviewers
            };
        });
    } catch (error) {
        throw new Error(`Error inserting submission and assigning reviewers: ${error.message}`);
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

            console.log('rubricsData: ', rubricsData);

            const rubricEntries = await Promise.all(rubricsData.map(async (rubric) => {
                let criteriaid = rubric.criteriaid;
                console.log('criteriaid from rubric: ', criteriaid);
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

                console.log('here');
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



module.exports = {
    insertUser,
    insertCourse,
    insertAssignment,
    insertEnrollment,
    insertRubric,
    insertCriteria,
    insertSubmission,
    insertAssignmentWithRubrics
};