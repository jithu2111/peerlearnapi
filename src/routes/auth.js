const express = require('express');
const router = express.Router();


const insert = require('../services/auth/controllers/insert');
const fetch = require('../services/auth/controllers/fetch');
const update = require('../services/auth/controllers/update');
const del = require('../services/auth/controllers/delete');

const authService = require('../services/auth');

// Insert Routes
router.post('/insertUser', async (req, res) => {
    const result = await insert.insertUser(req.body);  // Call insertUser function

    if (result.error) {
        return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json(result.data);});

router.post('/insertCourse', async (req, res) => {
    try {
        const course = await insert.insertCourse(req.body, res);
        return course;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/insertAssignment', async (req, res) => {
    try {
        const assignment = await insert.insertAssignment(req, res);
        return assignment;
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Fetch Routes
router.get('/users/:id', async (req, res) => {
    try {
        const user = await fetch.fetchUserById(req, res);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/courses/:id', async (req, res) => {
    try {
        const course = await fetch.fetchCoursesByUser(req,res);
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/assignments/:id', async (req, res) => {
    try {
        const assignment = await fetch.fetchAssignments(req,res);
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

// Example routes
router.post('/login', authService.login);
router.post('/signup', authService.signup);


module.exports = router;
