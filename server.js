var path = require('path');
var express = require('express');
var app = express();
var mysql = require('mysql');

var conn = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_NAME
}); 

conn.connect();

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var dir = path.join(__dirname, 'public');

app.use(express.static(dir));

app.get('/searchProducts', function (request, response) {
    let keyword = request.query.keyword;
    conn.query("select * from products where name like '%" + keyword + "%'", function(error, results){
        if ( error ){
            response.status(400).send('Error in database operation');
        } else {
            response.send(results);
        }
    });

    // var result = ['book', 'computer'];
    // res.contentType('application/json');
    // res.send(JSON.stringify(result));
})

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
})