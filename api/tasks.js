const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const crypto = require("crypto-js");
const task_module = require('./modules/Task');
const connection = require('../db/config');
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const passport = require('passport');
require('../passport_config/auth');

const user_module = require('./modules/User');


const User = new user_module(connection);
const Task = new task_module(connection);

router.post('/create', passport.authenticate('bearer', { session: false }), urlencodedParser, async(req, res) => {

    const task = validateCreationData(req.body);
    if (task) {
        const owner_id = req.user.user_id;
        task.owner_id = owner_id;
        const response_data = await Task.createTask(task);
        res.status(response_data.status).json(response_data.body);
    } else {
        res.status(400).json({ error: "Data validation failed" })
    }


});

function validateCreationData(data) {
    const task = {};
    if (data.title && data.description) {
        task.title = data.title;
        task.description = data.description;
        task.status = 0;
        task.exec_id = null;
        return task;
    } else {
        return null;
    }
}


module.exports = router;