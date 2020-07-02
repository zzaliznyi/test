const express = require('express');
const app = express();
const router = express.Router();
const mysql = require("mysql2");
const user_router = require('./api/users');
const task_router = require('./api/tasks');

app.use('/users', user_router);
app.use('/tasks', task_router);





app.listen(3000);