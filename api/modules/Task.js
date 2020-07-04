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
        const sql_data = [task.title, task.description, task_states[task.status], task.owner_id, task.exec_id];
        return this.connection.promise().query(sql, sql_data)
            .then(() => {
                return { status: 200, body: { info: "Successfully created task" } };
            })
            .catch(err => {
                return { status: 500, body: { error: err } };
            })
    }
    async getCreatedTasksById(id) {
        const sql = `SELECT * FROM tasks WHERE owner_id=${id}`;
        return this.connection.promise().query(sql)
            .then(results => {
                return { status: 200, body: { tasks: results[0] } }
            })
            .catch(err => {
                return { status: 500, body: { error: "Internal server error" } };
            })
    }
    async getReceivedTasksById(id) {
        const sql = `SELECT * FROM tasks WHERE exec_id=${id}`;
        return this.connection.promise().query(sql)
            .then(results => {
                return { status: 200, body: { tasks: results[0] } }
            })
            .catch(err => {
                return { status: 500, body: { error: "Internal server error" } };
            })
    }
    async getTaskById(id) {
        const sql = `SELECT * FROM tasks WHERE id=${id}`;
        return this.connection.promise().query(sql)
            .then(results => {
                console.log(results[0][0]);
                if (results[0][0]) return { status: 200, body: { task: results[0][0] } };
                else return { status: 404, body: { error: "Not Found" } };
            })
            .catch(err => {
                return { status: 500, body: { error: "Internal Server Error" } };
            })
    }
    async updateTask(task) {
        const sql = `UPDATE tasks SET title='${task.title}', description='${task.description}' WHERE id =${task.id}`;
        return this.connection.promise().query(sql)
            .then(results => {
                return { status: 200, body: { result: "Successfully Updated" } };
            })
            .catch(err => {
                return { status: 500, body: { error: err } };
            })
    }
    async updateTaskStateById(task_id, state) {
        const updated_state = task_states[state];
        const sql = `UPDATE tasks SET state='${updated_state}' WHERE id =${task_id}`;
        return this.connection.promise().query(sql)
            .then(results => {
                return { status: 200, body: { result: "Successfully Updated" } };
            })
            .catch(err => {
                return { status: 500, body: { error: err } };
            })
    }
    async removeTaskById(task_id) {
        const sql = `DELETE FROM tasks WHERE id=${task_id}`;
        return this.connection.promise().query(sql)
            .then(result => {
                return { status: 200, body: { info: "Successfully updated" } };
            })
            .catch(err => {
                return { status: 500, body: { error: "Internal Server Error" } };
            })
    }
    async setExec(task_id, exec_id) {
        const sql = `UPDATE tasks SET exec_id='${exec_id}' WHERE id =${task_id}`;
        return this.connection.promise().query(sql)
            .then(result => {
                return { status: 200, body: { info: "Executor is successfully set" } };
            })
            .catch(err => {
                return { status: 500, body: { error: "Internal Server Error" } };
            })
    }

}
module.exports = Task;