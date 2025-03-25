const insert = require('./models/insert');

export const insertUser = async (body) => {
    const {
        name,
        email,
        role,
        password,
    } = body
    try {
        const user = await insert.insertUser(name, email, role, password);
        res.json(user);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
}