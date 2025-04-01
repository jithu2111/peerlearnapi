const fetch = require('../../services/auth/controllers/fetch');
const insert = require('../../services/auth/controllers/insert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Fetch user from DB
        const user = await fetch.fetchUserByEmail({ email });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.userid, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return token to the client
        res.status(200).json({ message: 'Login successful', token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

exports.signup = async (req, res) => {
    try {
        const {name, email, password, role} = req.body;

        // Input validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({error: 'All fields are required'});
        }

        const existingUser = await fetch.fetchUserByEmail({email});
        if (existingUser) {
            return res.status(400).json({error: 'User with this email already exists'});
        }

        // Create a new user
        const newUser = await insert.insertUser(name, email, role, password);

        // Generate a JWT token (optional, if you want to log the user in immediately after signup)
        const token = jwt.sign(
            {id: newUser.userid},
            process.env.JWT_SECRET,
            {expiresIn: '24h'}
        );

        // Return the response with the token or just a success message
        res.status(201).json({
            message: 'User created successfully',
            token // optional: you can send the token here for immediate login
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({error: 'Something went wrong'});
    }
};