var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');


var currentdate = new Date();
var datetime = currentdate.getDate() + "/"
    + (currentdate.getMonth() + 1) + "/"
    + currentdate.getFullYear() + " , "
    + currentdate.getHours() + ":"
    + currentdate.getMinutes() + ":"
    + currentdate.getSeconds();

const backHome = "<input type='submit' formaction='Homepage.html' class='button_active' value='Back to Home'></input>";
const backMLanding = "<input type='submit' formaction='managerLanding.html' class='button_active' value='BACK TO LANDING'></input>";
const CSSStyling = "<head> <meta charset='utf-8'> <title>Receipt</title> <link rel='stylesheet' href='css/style.css'> </head>";

var dbConn = mongodb.MongoClient.connect("mongodb://Admin:admin123@cs1813namedb-shard-00-00-maax9.mongodb.net:27017,cs1813namedb-shard-00-01-maax9.mongodb.net:27017,cs1813namedb-shard-00-02-maax9.mongodb.net:27017/test?ssl=true&replicaSet=CS1813NameDB-shard-0&authSource=admin&retryWrites=true&w=majority/CarParkDatabase");

dbConn.then(() => {
    console.log("Successfully connected to server."); // Open localhost:3000
}).catch(e => console.log(e));

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, 'public'), { index: 'Homepage.html' }));

/////////// Form POST and GET requests////////////////////

app.post('/verifyTicketID', function (req, res) {
    (async () => {
        let db = await dbConn;
        let criteria = await req.body.TicketID;

        console.log("Passed ID: " + criteria);
        // db.collection('TicketsTable').find({ id: 3 }).toArray().then(function (feedbacks) {
        db.collection('TicketsTable').find({ _id: parseInt(criteria) }).toArray().then(function (initialfeedbacks) {
            if (initialfeedbacks.length != 0) {
                // Updates the time out (milliseconds)
                db.collection('TicketsTable').update(
                    { _id: parseInt(criteria) },
                    { $set: { 'timeOut': Date.now(), 'formattedTimeOut': datetime } }
                );

                db.collection('TicketsTable').find({ _id: parseInt(criteria) }).toArray().then(function (feedbacks) {

                    //Time spent in the CarPark calculation
                    const parkRate = 0.80;
                    const secondsSpentIn = (feedbacks[0].timeOut - feedbacks[0].timeIn) / 1000;
                    console.log(secondsSpentIn);
                    const hoursSpentIn = secondsSpentIn / 3600;
                    let stayPrice = (hoursSpentIn * parkRate).toFixed(2);
                    const employeeDiscount = 0.7;
                    
                    receipt = CSSStyling + "<div class='box'><form>";
                    receipt += "<h2>Thank you for staying in the Car Park.</h2>"
                    receipt += feedbacks[0].name + ", Your ID is " + criteria + ".<br>";

                    if(feedbacks[0].ticketType == "Employee"){

                        receipt += "<br>As an Employee, please enjoy a 30% discount on your stay. You would have paid: £<b>" + stayPrice + "</b><br>";
                        stayPrice = stayPrice * employeeDiscount;
                    }

                    //Formatting for receipt generation
                    receipt += "<br>You signed in at: " + feedbacks[0].formattedTimeIn + ". </br>You signed out at: " + datetime + (".<br>");

                    //Receipt completion and payment...
                    receipt += "<br><hr>You spent " + hoursSpentIn.toFixed(2) + " hours in the car park.";
                    receipt += "<br> At a rate of £" + parkRate + " per hour, you have £<b>" + stayPrice + "</b> to pay.";
                    // pricelink = "<a href='http://www.paypal.me/nkeirukaw/" + stayPrice + "'>Click here to Pay Now</a>";
                    // pricelink = "<input type='button' value='Click here to Pay Now.' onclick='location.href='http://www.paypal.me/nkeirukaw/" + stayPrice + "''>"
                    // pricelink = "<button type='submit' formaction='http://www.paypal.me/nkeirukaw/" + stayPrice + "'>Click me</button>";

                    pricelink = "<input type='submit' formaction='http://www.paypal.me/nkeirukaw/" + stayPrice + "' class='button_active' value='Click here to Pay Now'></input>";
                    receipt += "<br><hr>" + pricelink;
                    receipt += backHome;
                    receipt += "</div></form>";
                    res.send(receipt);

                })
            }
            else {
                res.send(CSSStyling + '<div class="box"><form><br><h3>This ticket ID could not be found.</h3><br>Please check the ID and try again.' + backHome + "</form></div>");
            }
        });
    })();
});

async function addTicket(req,res) {
    let db = await dbConn;
    let count = await db.collection('TicketsTable').count();

    req.body._id = count + 1;
    //Set MillisecondTimeIn
    req.body.timeIn = Date.now();
    //Set FormattedTimeIn
    req.body.formattedTimeIn = datetime;
    console.log(req.body);

    //alert("Your Ticket ID is: " + count);
    feedbackstring = CSSStyling + "<div class='box'><form>";
    feedbackstring += "<h3>" + req.body.name + ", your ticket has been generated successfully.</h3>Your ticket ID is: <b>" + req.body._id + "</b><br>";
    feedbackstring += "<br> Please remember your Ticket ID for future reference.";
    feedbackstring += backHome + "</div></form>";

    db.collection('TicketsTable').insertOne(req.body);
    //Rather than Have the user see their JSONified input, give them their Ticket ID.
    res.send(feedbackstring);
    //res.send('Data received:\n' + JSON.stringify(req.body));
}

app.post('/post-tickets', function (req, res) {
    (async () => {

        let db = await dbConn;
        let count = await db.collection('TicketsTable').count();

        //Check for Employee and discount code
        if (req.body.ticketType == "Employee") {
            // console.log("Dealing with an employee.");

            db.collection("ManagerTable").find({ EmpLogin: true }).toArray().then(function (discountCode) {

                // console.log("realdisccode: " + discountCode[0].EmployeeCode);
                // console.log("given disccode:" + req.body.discountCode);

                if (req.body.discountCode == discountCode[0].EmployeeCode) {
                    console.log("DiscountCode accepted.");
                    addTicket(req,res);
                } else {
                    console.log("Discount code not accepted");
                    res.send(CSSStyling + "<div class='box'><form> <h3>Your Employee ID is not valid.</h3><br>Please try again." + backHome + "</form></div>");
                }
            });
        }else{
        addTicket(req,res);
        }
    })();
});

// This is the working previous code.
// dbConn.then(function (db) {
//     db.collection('TicketsTable').insertOne(req.body);
// });
// res.send('Data received:\n' + JSON.stringify(req.body));

//Working but more obtuse code
// dbConn.then( function (db) {
//     var count = db.collection('TicketsTable').count().then(c => {
//         console.log(c);
//         req.body.id = c + 1;
//         console.log(count);
//         console.log(req.body)
//         db.collection('TicketsTable').insertOne(req.body);
//     });
// });
// res.send('Data received:\n' + JSON.stringify(req.body));


app.get('/view-tickets', function (req, res) {
    dbConn.then(function (db) {
        db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            feedbackstring = CSSStyling + "<body> <div class='response-box' style='resize:vertical'>" +
            "<img class='mainicon' src='css/images/historyicon.png' alt='logo'>";
            feedbackstring += "<h2>TICKET HISTORY</h2> <div class='scroll-box'>";

            for (i = 0; i < feedbacks.length; i++) {
                feedbackstring += JSON.stringify(feedbacks[i]) + "<hr>";
            }
            feedbackstring += "</div> <br> <form class='go-back-form'>" + backMLanding + "</form> </body>";
            res.status(200).send(feedbackstring);
        });
    });
});

/////////// Happy Hour POST and GET requests////////////////////

app.post('/post-happyhour', function (req, res) {
    (async () => {
        let db = await dbConn;
        let count = await db.collection('HappyHourTable').count();
        req.body._id = count + 1;
        //Set MillisecondTimeIn
        req.body.timeSet = Date.now();
        //Set FormattedTimeIn
        req.body.formattedTimeSet = datetime;
        console.log(req.body);

        feedbackstring = CSSStyling + "<div class='box'><form>";
        feedbackstring += "<br> Successfuly set happy hour for " + req.body.hours + " hours from now.";
        feedbackstring += backMLanding + "</div></form>";

        db.collection('HappyHourTable').insertOne(req.body);
        res.send(feedbackstring);
        //res.send('Data received:\n' + JSON.stringify(req.body));
    })();
});
app.get('/view-hh', function (req, res) {
    dbConn.then(function (db) {
        db.collection('HappyHourTable').find({}).toArray().then(function (feedbacks) {
            feedbackstring = CSSStyling + "<body> <div class='response-box' style='resize:vertical'>" +
            "<img class='mainicon' src='css/images/historyicon.png' alt='logo'>";
            feedbackstring += "<h2>HAPPY HOUR LOG</h2> <div class='scroll-box'>";
            
            for (i = 0; i < feedbacks.length; i++) {
                feedbackstring += JSON.stringify(feedbacks[i]) + "<hr>";
            }
            feedbackstring += "</div> <br> <form class='go-back-form'>" + backMLanding + "</form> </body>";
            res.status(200).send(feedbackstring);
        });
    });
});

/////////// Manager POST and GET requests////////////////////

app.post('/view-managerCr', function (req, res) {
    dbConn.then(function (db) {

        db.collection('ManagerTable').find({ 'Username': req.body.name, 'Password': req.body.password }).toArray().then(function (feedbacks) {

            if (feedbacks.length != 0) res.redirect('/managerLanding.html')
            else res.redirect('managerlogin.html');

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

            feedbackstring = CSSStyling + "<body> <div class='response-box' style='resize:vertical'>" +
            "<img class='mainicon' src='css/images/managericon.png' alt='logo'>";
            feedbackstring += "<h2>MANAGERS TABLE</h2> <div class='scroll-box'>";
            for (i = 0; i < feedbacks.length; i++) {
                feedbackstring += JSON.stringify(feedbacks[i]) + "<hr>";
            }
            feedbackstring += "</div> <br> <form class='go-back-form'>" + backMLanding + "</form> </body>";
            res.status(200).send(feedbackstring);
        });
    });
});

/////////// Chart GET request and draw chart////////////////////

app.get('/tickets-sold', function (req, res) {
    dbConn.then(function (db) {
        var cursor = db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            let customer= 0;
            let resident = 0;
            let employee = 0;

            feedbacks.forEach(function (arrayItem) {
                for (const [key, value] of Object.entries(arrayItem)) {
                    if (key == "ticketType") {
                        if (value == "Customer") {
                            customer += 1;
                        } else if (value == "Resident"){
                            resident +=1;
                        }else if (value == "Employee"){
                            employee +=1;
                        }
                    }
                };
            });
            let data = [customer, resident, employee];
            res.send(data)
        });

    });
});

app.get('/insidecarpark', function (req, res) {
    dbConn.then(function (db) {
        var cursor = db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            carsin =[0,0,0]

            feedbacks.forEach(function (arrayItem) {
                let customer=false;
                let resident = false;
                let employee = false;
                for (const [key, value] of Object.entries(arrayItem)) {
                    if (key == "ticketType") {
                        if (value == "Customer") {
                            customer = true;
                            carsin[0] += 1
                        } else if (value == "Resident") {
                            resident = true;
                            carsin[1] += 1
                        } else if (value == "Employee") {
                            employee = true;
                            carsin[2] += 1
                        }
                    }
                    if (key == "timeOut") {
                        if (customer == true) {
                            carsin[0] -= 1
                        } else if (resident == true) {
                            carsin[1] -= 1
                        } else if (employee == true) {
                            carsin[2] -= 1
                        }
                    }
                }
            });
            res.send(carsin)
        });

    });
});

app.post('/report-timings', function (req, res) {
    let startReport = req.body.startTime;
    let endReport = req.body.endTime;
    res.redirect('manualReport.html')
    res.send({startReport, endReport})

})


app.get('/manual-report', function (req, res) {
    var startReport;
    var endReport;
    fetch('/report-timings').then(function(response){
        return response.json();
        }).then(function (data) {
            startReport = data.startReport;
            endReport = data.endReport;
        })
    console.log(startReport, endReport)

    dbConn.then(function (db) {
        var cursor = db.collection('TicketsTable').find({}).toArray().then(function (feedbacks) {
            var custoIn = new Array(endReport.getHours()-startReport.getHours())
            var residIn = new Array(endReport.getHours()-startReport.getHours())
            var emploIn = new Array(endReport.getHours()-startReport.getHours())

            feedbacks.forEach(function (arrayItem) {
                let customer=false;
                let resident = false;
                let employee = false;
                for (const [key, value] of Object.entries(arrayItem)) {
                    if (key == "ticketType") {
                        if (value == "Customer") {
                            customer = true;
                        } else if (value == "Resident") {
                            resident = true;
                        } else if (value == "Employee") {
                            employee = true;
                        }
                    }
                    if (key == "formattedTimeIn") {
                        if (value.getDate() == startReport.getDate() && value.getMonth() == startReport.getMonth() ) {
                            if (value.getHours() >= startReport.getHours() && value.getHours() <= endReport.getHours()) {
                                if (customer == true) {
                                    custoIn[value.getHours() - startReport.getHours()-1] +=1
                                } else if (resident == true) {
                                    residIn[value.getHours() - startReport.getHours()-1] +=1
                                } else if (employee == true) {
                                    emploIn[value.getHours() - startReport.getHours()-1] +=1
                                }
                            }
                        }
                    }
                }
            });
            var i;
            let timings = []
            for (i = startReport.getHours; i < endReport.getHours; i++) {
                timings[i -startReport.getHours] = i
            }
            res.send({custoIn,residIn, emploIn, timings})
        });

    });
});


app.listen(process.env.PORT || 3000, process.env.IP || '0.0.0.0');
