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
router.get('/createdtasks', passport.authenticate('bearer', { session: false }), async(req, res) => {
    const get_opts = validateGetProps(req.query);
    const response_data = await Task.getCreatedTasksById(req.user.user_id, get_opts);
    res.status(response_data.status).json(response_data.body);
});
router.get('/receivedtasks', passport.authenticate('bearer', { session: false }), async(req, res) => {
    const get_opts = validateGetProps(req.query);
    const response_data = await Task.getReceivedTasksById(req.user.user_id, get_opts);
    res.status(response_data.status).json(response_data.body);
});
router.put('/update', passport.authenticate('bearer', { session: false }), urlencodedParser, async(req, res) => {
    if (req.query.id && req.query.id > 0) {
        const data = await Task.getTaskById(req.query.id);
        if (data.status == 200) {
            if (req.user.user_id == data.body.task.owner_id) {
                if (req.body.title) data.body.task.title = req.body.title;
                if (req.body.description) data.body.task.description = req.body.description;
                const response_data = await Task.updateTask(data.body.task);
                res.status(response_data.status).json(response_data.body);
            } else {
                res.status(403).json({ error: "Forbidden" });
            }
        } else {
            res.status(data.status).json(data.body);
        }
    } else {
        res.status(400).json({ error: "Invalid task`s id" });
    }
});
router.put('/updatestate', passport.authenticate('bearer', { session: false }), urlencodedParser, async(req, res) => {
    const task_id = req.query.id;
    if (task_id && task_id > 0) {
        const task_data = await Task.getTaskById(task);
        if (task_data.status == 200) {

            if (req.user.user_id == task_data.body.task.owner_id || req.user.user_id == task_data.body.task.exec_id) {
                if (req.body.state >= 0 && req.body.state <= 2) {
                    const response_data = await Task.updateTaskStateById(req.query.id, req.body.state);
                    res.status(response_data.status).json(response_data.body);
                } else {
                    res.status(400).json({ error: "Invalid state" });
                }
            } else {
                res.status(401).json({ error: "Access denied" });
            }
        } else {
            res.status(task_data.status).json(task_data.body);
        }
    } else {
        res.status(400).json({ error: "Task ID missing or is incorrect" });
    }
})
router.delete('/remove', passport.authenticate('bearer', { session: false }), async(req, res) => {
    const task_id = req.query.id;
    if (task_id && task_id > 0) {
        const task_data = await Task.getCreatedTasksById(task_id);
        if (task_data.status == 200) {
            if (req.user.user_id == task_data.body.task.owner_id) {
                const response_data = await Task.removeTaskById(task_data.body.task.id);
                res.status(response_data.status).json(response_data.body);
            } else {
                res.status(401).json({ error: "Access Denied" });
            }
        } else {
            res.status(task_data.status).json(task_data.body);
        }
    } else {
        res.status(400).json({ error: "Invalid ID" });
    }
})
router.put('/setexec', passport.authenticate('bearer', { session: false }), urlencodedParser, async(req, res) => {
    const executor_id = req.body.exec_id;
    const task_id = req.query.id;
    if (task_id && task_id > 0 && executor_id) {
        if (await User.isUser(executor_id)) {
            const task_data = await Task.getTaskById(task_id);
            if (task_data.status == 200) {
                if (req.user.user_id == task_data.body.task.owner_id) {
                    if (executor_id == req.user.user_id) {
                        res.status(400).json({ error: "Task couldn't be set on it's owner" });
                    } else {
                        const response_data = await Task.setExec(task_id, executor_id);
                        res.status(response_data.status).json(response_data.body);
                    }

                } else {
                    res.status(401).json({ error: "Access Denied" });
                }
            } else {
                res.status(task_data.status).json(task_data.body);
            }
        } else {
            res.status(404).json({ error: "Executor not found" });
        }

    } else {
        res.status(400).json({ error: "Invalid executor or task id" });
    }
})

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

function validateGetProps(props) {
    let filter = null;
    let sorting = null;
    if (props.filter == 0 || props.filter == 1 || props.filter == 2) filter = props.filter;
    if (props.sorting == 'old' || props.sorting == 'new') sorting = props.sorting;
    return { sorting: sorting, filter: filter };
}


module.exports = router;