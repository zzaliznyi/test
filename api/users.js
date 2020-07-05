const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const crypto = require("crypto-js");
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const connection = require('../db/config');
const user_module = require('./modules/User');
const passport = require('passport');
require('../passport_config/auth');
const User = new user_module(connection);

router.post('/register', urlencodedParser, async(req, res) => {
    const checked_data = await regDataValid(req.body);
    if (!checked_data.isErr) {
        const response_data = await User.register(req.body);
        res.status(response_data.status).json(response_data.body);
    } else {
        res.status(checked_data.code).json({ error: checked_data.body });
    }
});
router.get('/authorization', async(req, res) => {
    const response_data = await User.getUserAuth(req.query);
    if (!response_data.isErr) {
        res.status(response_data.status).json({ token: response_data.user.token });
    } else {
        res.status(response_data.status).json({ error: response_data.body });
    }
});
router.get('/info', passport.authenticate('bearer', { session: false }), async(req, res) => {
    const response = { name: req.user.first_name, last_name: req.user.last_name, token: req.user.token }
    res.status(200).json(response);
});
router.put('/update', passport.authenticate('bearer', { session: false }), urlencodedParser, async(req, res) => {
    const user = req.user;
    const changes = [];
    const errors = {};
    if (user && req.body) {
        if (req.body.first_name) {
            user.first_name = req.body.first_name;
            changes.push("First Name");
        }
        if (req.body.last_name) {
            user.last_name = req.body.last_name;
            changes.push("Last Name");
        }
        if (req.body.email) {
            if (await User.isEmailUniqueById(req.body.email, user.user_id)) {
                user.email = req.body.email;
                changes.push("Email");

            } else errors.update_email_error = "User with this email had already been registered";
        }
        if (req.body.new_password) {
            if (crypto.SHA512(req.body.old_password) == user.password) {
                user.password = crypto.SHA512(req.body.new_password);
                changes.push("Password");
            } else {
                errors.update_password_error = "Old password is wrong";
            }
        }
        if (errors.update_email_error || errors.update_password_error) res.status(400).json(errors);
        else {
            if (changes.length == 0) res.status(200).json({ error: "Body is missing. Nothing to update" });
            else {
                const response_data = await User.updateUserById(user);

                res.status(response_data.status).json({ updated_data: changes });
            }
        }
    } else {
        res.status(400).json({ error: "Wrong Token" });
    }
});
router.delete('/delete', passport.authenticate('bearer', { session: false }), urlencodedParser, async(req, res) => {
    const user = await User.getUserByToken(req.user.token);
    if (req.body && user) {
        if (crypto.SHA512(req.body.password) == user.password) {
            const response_data = await User.removeUserById(user.user_id);
            res.status(response_data.status).json(response_data.body);
        } else {
            res.status(400).json({ error: "Wrong password or token" });
        }
    } else {
        res.status(400).json({ error: "Wrong password or token" });
    }
});
router.get('/all', passport.authenticate('bearer', { session: false }), async(req, res) => {
    const pagination = 5;
    let page = 1;
    if (req.query.page && req.query.page >= 0) page = req.query.page;
    const response_data = await User.getAllUsers(page, pagination);
    res.status(response_data.status).json(response_data.body);


})
async function regDataValid(reg_data) {
    if (!reg_data.first_name || !reg_data.last_name || !reg_data.email || !reg_data.password) return { isErr: true, body: "Empty fields exist", code: 400 };
    if (!await User.isEmailUnique(reg_data.email)) return { isErr: true, body: "User with such email is already exists", code: 400 };
    else return { isErr: false, body: "Register accepted", code: 200 };
}



module.exports = router;