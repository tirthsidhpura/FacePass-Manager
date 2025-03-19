const mysql = require('mysql');

// Create a connection
const connection = mysql.createConnection({
  host: 'localhost',   // Change to your MySQL server
  user: 'root',        // Change to your MySQL user
  password: '',
  database: 'passwordmanagerapp'
});

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL!');
});



module.exports = connection
// Close connection (when needed)
// connection.end();
