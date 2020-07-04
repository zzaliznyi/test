const express = require('express');
const crypto = require("crypto-js");



class User {
    connection;
    constructor(connection) {
        this.connection = connection;
    }
    async register(user) {
        const date = Date.now();
        const expire_date = date + 3600000;
        const bearer_token = crypto.SHA512(user.first_name + user.last_name + user.email + date).toString();
        const hashed_password = crypto.SHA512(user.password).toString();
        const write_data = [user.first_name, user.last_name, user.email, hashed_password, bearer_token, date];
        const sql = `INSERT INTO users(first_name, last_name,email,password,token,expire_date) VALUES(?,?,?,?,?,?)`;
        return this.connection.promise().query(sql, write_data)
            .then(results => {
                return { status: 200, body: { info: "Registration successful" } };
            })
            .catch(err => {
                return { status: 500, body: { error: "Internal Server Error" } };
            })
    }
    async getUserAuth(user) {
        const sql = `SELECT * FROM users WHERE email="${user.email}"`;
        return connection.promise().query(sql)
            .then(async(result) => {
                if (result[0][0]) {
                    if (crypto.SHA512(user.password) == result[0][0].password) {
                        const user_data = result[0][0];
                        user_data.token = await generateToken(result[0][0]);
                        return { isErr: false, body: "User authorized", user: result[0][0], status: 200 };
                    } else {
                        return { isErr: true, body: "Wrong email or password", user: null, status: 400 };
                    }
                } else return { isErr: true, body: "Wrong email or password", user: null, status: 400 };
            })
            .catch(err => {
                return { isErr: true, body: err, user: null, status: 500 };
            });
    }
    async getUserByToken(token) {
        const sql = `SELECT * FROM users WHERE token="${token}"`;
        return this.connection.promise().query(sql)
            .then(result => {
                if (result[0][0]) {
                    return result[0][0];
                } else {
                    return null;
                }
            })
            .catch(err => {
                console.log(`Error while getting user: ${ err }`);
            });
    }
    async isEmailUniqueById(email, id) {
        const sql = `SELECT * FROM users WHERE email="${email}" AND user_id <> ${id}`;
        return connection.promise().query(sql)
            .then(result => {
                if (result[0][0]) {
                    return false;
                } else {
                    return true;
                }
            })
            .catch(err => {
                console.log(`Error while checking email: ${ err }`);
            });
    }
    async updateUserById(user) {
        const sql = `UPDATE users SET first_name='${user.first_name}', last_name='${user.last_name}',email='${user.email}',password='${user.password}' WHERE user_id =${user.user_id}`;
        return connection.promise().query(sql)
            .then(result => {
                return { status: 200, user: user }
            })
            .catch(err => {
                return { status: 500, user: null }
            });
    }
    async removeUserById(id) {
        const sql = `DELETE FROM users WHERE user_id=${id}`;
        return connection.promise().query(sql)
            .then(result => {
                return { status: 200, body: { success: "Successfully deleted" } }
            })
            .catch(err => {
                return { status: 500, body: { error: err } };
            })
    }
    async isEmailUnique(email) {
        const sql = `SELECT * FROM users WHERE email="${email}"`;
        return connection.promise().query(sql)
            .then(result => {
                if (result[0][0]) {
                    return false;
                } else {
                    return true;
                }
            })
            .catch(err => {
                console.log(`Error while checking email: ${ err }`);
            });
    }
    async getAllUsers(page, pagination) {
        const sql = `SELECT * FROM users LIMIT ${page*pagination - pagination},${pagination}`;
        return connection.promise().query(sql)
            .then(results => {
                return { status: 200, body: { users: results[0] } };
            })
            .catch(err => {
                return { status: 500, body: { error: err } };
            })
    }
    async isUser(user_id) {
        const sql = `SELECT * FROM users WHERE user_id="${user_id}"`;
        return this.connection.promise().query(sql)
            .then(result => {
                if (result[0][0]) {
                    return true;
                } else {
                    return false;
                }
            })
            .catch(err => {
                return false;
            });
    }
}




async function generateToken(user) {
    const date = Date.now();
    const token = crypto.SHA512(user.first_name + user.last_name + user.email + date).toString();
    const expire_date = date + 3600000;
    const sql = `UPDATE users SET token="${token}",expire_date=${expire_date} WHERE user_id=${user.user_id}`;
    return connection.promise().query(sql)
        .then(results => {
            console.log("Inserted!");
            return token;
        })
        .catch(err => console.log(err));
}




module.exports = User;