var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');


var dbConn = mongodb.MongoClient.connect("mongodb://Admin:admin123@cs1813namedb-shard-00-00-maax9.mongodb.net:27017,cs1813namedb-shard-00-01-maax9.mongodb.net:27017,cs1813namedb-shard-00-02-maax9.mongodb.net:27017/test?ssl=true&replicaSet=CS1813NameDB-shard-0&authSource=admin&retryWrites=true&w=majority/CarParkDatabase");
if (dbConn) {
    console.log("Connected successfully to server");
}

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, 'public')));

app.post('/post-feedback', function (req, res) {
    dbConn.then(function (db) {
        delete req.body._id;
        db.collection('TicketsTable').insertOne(req.body);
    });
    res.send('Data received:\n' + JSON.stringify(req.body));
});

app.get('/view-feedback', function (req, res) {
    dbConn.then(function (db) {
        db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            res.status(200).json(feedbacks);
        });
    });
});

app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0');










// const MongoClient = require('mongodb').MongoClient;
// const assert = require('assert');

// MongoClient.connect("mongodb+srv://Keiru:keiru123@cs1813namedb-maax9.mongodb.net/test?retryWrites=true&w=majority", function (err, client) {
//     assert.equal(null, err);
//     console.log("Connected successfully to server");
// });

// MongoClient.connect("mongodb://Keiru:keiru123@cs1813namedb-shard-00-00-maax9.mongodb.net:27017,cs1813namedb-shard-00-01-maax9.mongodb.net:27017,cs1813namedb-shard-00-02-maax9.mongodb.net:27017/test?ssl=true&replicaSet=CS1813NameDB-shard-0&authSource=admin&retryWrites=true&w=majority/CarParkDatabase", function (err, db) {
//     if (err) {
//         throw err
//     } else {
//         console.log("Connected successfully to server");
//     }
// });