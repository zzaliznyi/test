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
        return console.error("Error: " + err.message);
    } else {
        console.log("Connecting to users database success");
    }
});
module.exports = connection;