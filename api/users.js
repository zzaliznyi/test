const express = require('express');
const router = express.Router();
const mysql = require("mysql2");
const bodyParser = require('body-parser');
const crypto = require("crypto-js");
const jsonParser = bodyParser.json()
const urlencodedParser = bodyParser.urlencoded({ extended: false })

const connection = mysql.createConnection({
    host: "localhost",
    user: "zahasenok",
    database: "main",
    port: "3306",
    password: "password1234"
});
connection.connect(function(err) {
    if (err) {
        return console.error("Error: " + err.message);
    } else {
        console.log("Connecting to users database success");
    }
});

router.post('/register', urlencodedParser, async(req, res) => {
    const checked_data = await regDataValid(req.body);
    if (!checked_data.isErr) {
        const date = Date.now();
        const expire_date = date + 3600000;
        const bearer_token = crypto.SHA512(req.body.first_name + req.body.last_name + req.body.email + date).toString();
        const hashed_password = crypto.SHA512(req.body.password).toString();
        const write_data = [req.body.first_name, req.body.last_name, req.body.email, hashed_password, bearer_token, date];
        const sql = `INSERT INTO users(first_name, last_name,email,password,token,expire_date) VALUES(?,?,?,?,?,?)`;
        connection.promise().query(sql, write_data)
            .then(results => {
                res.status(200).json({ Response: "Registration successful" });
            })
            .catch(err => {
                res.status(500).json({ error: err });
            })
    } else {
        res.status(checked_data.code).json({ error: checked_data.body });
    }
});
router.get('/authorization', async(req, res) => {
    const response_data = await getUserAuth(req.query);
    if (!response_data.isErr) {
        res.status(response_data.status).json({ token: response_data.user.token });
    } else {
        res.status(response_data.status).json({ error: response_data.body });
    }
});
router.get('/info', async(req, res) => {
    const user = await getUserByToken(req.query.token);
    console.log(user);
    if (user) {
        if (user.expire_date >= Date.now()) res.status(200).json([{ Status: `Logged in as ${user.first_name} ${user.last_name}` }, { first_name: user.first_name, last_name: user.last_name, email: user.email }]);
        else res.status(400).json({ error: "Invalid token, please relog" });
    } else {
        res.status(400).json({ error: "Invalid token, please relog" });
    }
});
router.put('/update', urlencodedParser, async(req, res) => {
    const user = await getUserByToken(req.query.token);
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
            if (await isEmailUnique(req.body.email, user.user_id)) {
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
                const response_data = await updateUserById(user, user.user_id);

                res.status(response_data.status).json({ updated_data: changes });
            }
        }
    } else {
        res.status(400).json({ error: "Wrong Token" });
    }
});
router.delete('/delete', urlencodedParser, async(req, res) => {
    const user = await getUserByToken(req.query.token);
    if (req.body && user) {
        if (crypto.SHA512(req.body.password) == user.password) {
            const response_data = await removeUserById(user.user_id);
            res.status(response_data.status).json(response_data.body);
        }
    } else {
        res.status(400).json({ error: "Wrong password or token" });
    }
});
async function regDataValid(reg_data) {
    if (!reg_data.first_name || !reg_data.last_name || !reg_data.email || !reg_data.password) return { isErr: true, body: "Empty fields exist", code: 400 };
    if (!await isEmailUnique(reg_data.email)) return { isErr: true, body: "User with such email is already exists", code: 400 };
    else return { isErr: false, body: "Register accepted", code: 200 };
}

async function isEmailUnique(email) {
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
async function isEmailUnique(email, id) {
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
async function getUserAuth(user) {
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
async function getUserByToken(token) {
    const sql = `SELECT * FROM users WHERE token="${token}"`;
    return connection.promise().query(sql)
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
async function updateUserById(user, id) {
    const sql = `UPDATE users SET first_name='${user.first_name}', last_name='${user.last_name}',email='${user.email}',password='${user.password}' WHERE user_id =${user.user_id}`;
    return connection.promise().query(sql)
        .then(result => {
            return { status: 200, user: user }
        })
        .catch(err => {
            return { status: 500, user: null }
        });
}
async function removeUserById(id) {
    const sql = `DELETE FROM users WHERE user_id=${id}`;
    return connection.promise().query(sql)
        .then(result => {
            return { status: 200, body: { success: "Successfully deleted" } }
        })
        .catch(err => {
            return { status: 500, body: { error: err } };
        })
}

module.exports = router;