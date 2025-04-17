const express = require('express');
const router = express.Router();


const insert = require('../services/auth/controllers/insert');
const fetch = require('../services/auth/controllers/fetch');
const update = require('../services/auth/controllers/update');
const del = require('../services/auth/controllers/delete');
const authenticate = require('../services/auth/middleware/auth');

const authService = require('../services/auth');

// Insert Routes
router.post('/insertUser', authenticate, async (req, res) => {
    const result = await insert.insertUser(req.body);  // Call insertUser function

    if (result.error) {
        return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);
});

router.post('/insertCourse', authenticate, async (req, res) => {
    try {
        const course = await insert.insertCourse(req.body, res);
        return course;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/insertRubric', authenticate, async (req, res) => {
    try {
        const rubric = await insert.insertRubric(req.body);
        return res.status(201).json(rubric);  // Send the inserted rubric back with 201 status
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/insertAssignment', authenticate, async (req, res) => {
    try {
        const assignment = await insert.insertAssignment(req, res);
        return assignment;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/createCriteria', authenticate, async (req, res) => {
    try {
        const criteria = await insert.insertCriteria(req.body);  // Pass the request body to the controller
        return res.status(201).json(criteria);  // Return the inserted criteria with 201 status
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/createSubmission', authenticate, async (req, res) => {
    try {
        const result = await insert.insertSubmission(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


router.post('/createAssignmentWithRubrics', authenticate, async (req, res) => {
    try {
        const { assignment, rubrics } = req.body;
        const result = await insert.insertAssignmentWithRubrics(assignment, rubrics);
        return res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/registerCourse', authenticate, async (req, res) => {  // Now your middleware is applied properly
    try {
        const enrollment = await insert.insertEnrollment(req, res);
        return enrollment;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/getSubmissionsToReviewByUserID', authenticate, async (req, res) => {
    try {
        const response = await fetch.getSubmissionsToReviewByUserID(req, res);
        return response;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/createPeerfeedback', async (req, res) => {
    try {
        const result = await insert.insertPeerfeedback(req.body); // call the model
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/getReviewsBySubmissionId', async (req, res) => {
    try {
        const { submissionid } = req.body;

        const result = await fetch.getReviewsBySubmissionId(submissionid);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});



// Fetch Routes
router.get('/users/:id', authenticate, async (req, res) => {
    try {
        const user = await fetch.fetchUserById(req, res);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/courses/:id', authenticate, async (req, res) => {
    try {
        const course = await fetch.fetchCoursesByUserId(req,res);
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assignments/:id', authenticate, async (req, res) => {
    try {
        const assignment = await fetch.fetchAssignments(req,res);
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/fetchcoursesbyuserid/:userid', authenticate, async (req, res) => {
    try {
        const { userid } = req.params;
        const courses = await fetch.fetchCoursesByUserId({ userid });
        if (!courses || courses.length === 0) {
            return res.status(404).json({ message: 'No courses found for the given user ID' });
        }
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Route to fetch criteria by courseId, including "total_review_score"
router.get('/getCriteriaByCourseId/:courseid', authenticate, async (req, res) => {
    try {
        const { courseid } = req.params;
        const criteria = await fetch.fetchCriteriaByCourseId(courseid);
        return res.status(200).json(criteria);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Route to fetch rubrics by assignmentId
router.get('/getRubricByAssignmentId/:assignmentid', authenticate, async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const rubrics = await fetch.getRubricByAssignmentId(assignmentId);
        return res.status(200).json(rubrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to fetch Rubrics by courseId
router.get('/getRubricsByCourseID/:courseid', authenticate, async (req, res) => {
    try {
        const { courseid } = req.params;
        const rubrics = await fetch.getRubricsByCourseID(courseid);
        return res.status(200).json(rubrics);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Update Routes
router.put('/users/:id', authenticate, async (req, res) => {
    try {
        const updatedUser = await update.updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/courses/:id', authenticate, async (req, res) => {
    try {
        const updatedCourse = await update.updateCourse(req.params.id, req.body);
        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/assignments/:id', authenticate, async (req, res) => {
    try {
        const updatedAssignment = await update.updateAssignment(req.params.id, req.body);
        res.json(updatedAssignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Routes
router.delete('/users/:id', authenticate, async (req, res) => {
    try {
        await del.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/courses/:id', authenticate, async (req, res) => {
    try {
        await del.deleteCourse(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/assignments/:id', authenticate, async (req, res) => {
    try {
        await del.deleteAssignment(req.params.id);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/login', authService.login);
router.post('/signup', authService.signup);


module.exports = router;
