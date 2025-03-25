const express = require('express');
const router = express.Router();
const insert = require('../../services/auth/controllers/insert');
const fetch = require('../../services/auth/models/fetch');
const update = require('../../services/auth/models/update');
const del = require('../../services/auth/models/delete');

// Insert Routes
router.post('/users', async (req, res) => {
    res.json(await insertUser(req.body))
});

router.post('/courses', async (req, res) => {
    try {
        const course = await insert.insertCourse(req.body.courseName, req.body.instructorID, req.body.startDate, req.body.endDate, req.body.isArchived);
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/assignments', async (req, res) => {
    try {
        const assignment = await insert.insertAssignment(req.body.courseId, req.body.title, req.body.description, req.body.deadline, req.body.maxScore, req.body.weightage);
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch Routes
router.get('/users/:id', async (req, res) => {
    try {
        const user = await fetch.fetchUser(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/courses/:id', async (req, res) => {
    try {
        const course = await fetch.fetchCourse(req.params.id);
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assignments/:id', async (req, res) => {
    try {
        const assignment = await fetch.fetchAssignment(req.params.id);
        res.json(assignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Routes
router.put('/users/:id', async (req, res) => {
    try {
        const updatedUser = await update.updateUser(req.params.id, req.body);
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/courses/:id', async (req, res) => {
    try {
        const updatedCourse = await update.updateCourse(req.params.id, req.body);
        res.json(updatedCourse);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/assignments/:id', async (req, res) => {
    try {
        const updatedAssignment = await update.updateAssignment(req.params.id, req.body);
        res.json(updatedAssignment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Routes
router.delete('/users/:id', async (req, res) => {
    try {
        await del.deleteUser(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/courses/:id', async (req, res) => {
    try {
        await del.deleteCourse(req.params.id);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/assignments/:id', async (req, res) => {
    try {
        await del.deleteAssignment(req.params.id);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
