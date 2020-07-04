const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: "localhost",
    user: "zahasenok",
    database: "main",
    port: "3306",
    password: "password1234"
});
connection.connect(function(err) {
    if (err) {
        console.error("Error: " + err.message);
        return process.exit(1);
    } else {
        console.log("Connecting to database success");
    }
});
module.exports = connection;