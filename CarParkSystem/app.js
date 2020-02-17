var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');

var dbConn = mongodb.MongoClient.connect("mongodb://Admin:admin123@cs1813namedb-shard-00-00-maax9.mongodb.net:27017,cs1813namedb-shard-00-01-maax9.mongodb.net:27017,cs1813namedb-shard-00-02-maax9.mongodb.net:27017/test?ssl=true&replicaSet=CS1813NameDB-shard-0&authSource=admin&retryWrites=true&w=majority/CarParkDatabase");

dbConn.then(() => {
    console.log("Successfully connected to server."); // Open localhost:3000
})

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, 'public'), { index: 'Homepage.html' }));

/////////// Form POST and GET requests////////////////////


app.post('/post-feedback', function (req, res) {
    // This is the working previous code.
    // dbConn.then(function (db) {
    //     db.collection('TicketsTable').insertOne(req.body);
    // });
    // res.send('Data received:\n' + JSON.stringify(req.body));

    dbConn.then(function (db) {

        var count = db.collection('TicketsTable').count({});
        req.body._id = Promise.resolve(count) + 1;
        
        db.collection('TicketsTable').insertOne(req.body);
    });
    res.send('Data received:\n' + JSON.stringify(req.body));
});

app.get('/view-feedback', function (req, res)
{
    dbConn.then(function (db)
    {
        db.collection('TicketsTable').find({}).toArray().then(function (feedbacks)
        {
            res.status(200).json(feedbacks);
        });
    });
});

/////////// Happy Hour POST and GET requests////////////////////

app.post('/post-happyhour', function (req, res) {
    dbConn.then(function (db) {
        //delete req.body._id;
        db.collection('HappyHourTable').insertOne(req.body);
    });
    res.send('Happy-Hour received:\n' + JSON.stringify(req.body));

});
app.get('/view-hh', function (req, res) {
    dbConn.then(function (db) {
        db.collection('HappyHourTable').find({}).toArray().then(function (feedbacks) {
            res.status(200).json(feedbacks);
        });
    });
});

/////////// Manager POST and GET requests////////////////////

app.post('/view-managerCr', function (req, res) {
    dbConn.then(function (db) {
    console.log(req);
        db.collection('ManagerTable').find({'Username': req.body.name, 'Password': req.body.password}).toArray().then(function (feedbacks) {
            res.status(200).json(feedbacks);
        });
    });
});


app.post('/post-manager', function (req, res) {
    dbConn.then(function (db) {
        //delete req.body._id;
        db.collection('ManagerTable').insertOne(req.body);
    });
    res.send('Manager received:\n' + JSON.stringify(req.body));

});

app.get('/view-manager', function (req, res) {
    dbConn.then(function (db) {
        db.collection('ManagerTable').find({}).toArray().then(function (feedbacks) {
            res.status(200).json(feedbacks);
        });
    });
});

app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0');