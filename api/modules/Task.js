const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const crypto = require("crypto-js");
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const task_states = ["View", "In Progress", "Done"];

class Task {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    async createTask(task) {
        const sql = `INSERT INTO tasks(title, description,status,owner_id,exec_id) VALUES(?,?,?,?,?)`;
        const sql_data = [task.title, task.description, task.status, task.owner_id, task.exec_id];
        return this.connection.promise().query(sql, sql_data)
            .then(() => {
                return { status: 200, body: { info: "Successfully created task" } };
            })
            .catch(err => {
                return { status: 500, body: { error: err } };
            })
    }

}
module.exports = Task;