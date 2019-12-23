var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var router = express.Router();
var path = require('path');
var bodyParser = require('body-parser');
var cookies = require('cookies');
var fs = require('fs');
var uriFile = JSON.parse(fs.readFileSync('connect.json', 'utf8'));
const MongoClient = require('mongodb').MongoClient;
const uri = uriFile.mongoURI;
var db;

app.use(bodyParser.urlencoded({
	extended: true
}));

app.set("view engine", "hbs");


// Sets up databas
var dbPromise = new Promise(function (resolve, reject) {
	MongoClient.connect(uri, {
		useNewUrlParser: true
	}, (err, client) => {
		if (err) {
			return console.log(err);
		} else {
			db = client.db('befrendData');

			resolve("db listening");
			app.listen(27017, () => {
				console.log("listening on port 27017");
			});
		}
	});
});

/* Page routes defined down here */
router.get('/', function (req, res, next) {
	//res.render('index', { title: 'Express' });
	app.use(express.static(path.join(__dirname + '/public')));
	console.log(__dirname + '/login');
	res.sendFile(path.join(__dirname + '/login/login.html'));
});


router.get('/maps', function (req, res, next) {
	app.use(express.static(path.join(__dirname + '/public')));
	console.log(__dirname + '/maps');
	var option = req.query.option;
	dbPromise.then((result) => {
		var date = new Date();
		//{numPpl: {$gt: 1}}
		var cursor = db.collection('EventData').find().toArray((err, result) => {
			if (err) {
				console.log(err);
			} else {
				if(option != null && option != "all") {
					result = result.filter((elem) => {
						return elem.activity == option;
					});
				}
				result = result.sort((a, b) => {
					return b.numPpl - a.numPpl;
				});


				// TODO: dont render old events
				res.render('maps.hbs', {rslt: result});
			}
		});
	});

});

router.post('/maps/checkOut', (req, res, next) => {
	dbPromise.then((result) => {
		var id = req.query._id;
		var query = {};
		query["_id"] = Number(id);
		db.collection("EventData").findOne(query, (err, result) => {
			if(err) {
				console.log(err);
			} else {

				var rslt = result;
				rslt.numPpl = rslt.numPpl - 1;

				if(Number(rslt.numPpl) < 0) {
					db.collection("EventData").deleteOne(query, (err, result) => { 
						console.log("ya yeet");
					});
				} else {
					var login = JSON.parse(req.cookies.login);

					// TODO: remove ppl from list
					if (rslt.people != null) {
						for(var i = 0; i < rslt.people.length; i++) {
							var tmp = rslt.people[i];
							if(login.name == tmp.name && login.bio == tmp.bio) {
								rslt.people.splice(i);
							}
						}
					}

					console.log(rslt);
					db.collection("EventData").update(query, rslt, (err, result) => {
						if (err) {
							console.log(err);
						}
						console.log("updated");
					});
				}
			}
		});
	});

});


router.post('/maps/checkIn', (req, res, next) => {
	// TODO: should prevent you from checking in multiple times
	dbPromise.then((result) => {
		var id = req.query._id;
		var query = {};
		query["_id"] = Number(id);
		console.log(query);
		db.collection("EventData").findOne(query, (err, result) => {
			if(err) {
				console.log(err);
			} else {
				var rslt = result;
				console.log(result);
				rslt.numPpl = rslt.numPpl + 1;

				var login = JSON.parse(req.cookies.login);

				if(rslt.people != null)
					rslt.people.push(login);

				console.log(rslt);
				db.collection("EventData").update(query, rslt, (err, result) => {
					if(err) {
						console.log(err);
					}
					console.log("updated");
				});
			}
		});
	});
});

router.get('/maps/getEvents', function (req, res, next) {

		dbPromise.then((result) => {
			var cursor = db.collection('EventData').find().toArray((err, result) => {
				if (err) {
					console.log(err);
				} else {
					res.json(result);
				}
			});
		});
});

router.get('/search', function (req, res, next) {
	app.use(express.static(path.join(__dirname + '/public')));
	console.log(__dirname + '/search');
	res.sendFile(path.join(__dirname + '/search/search.html'));
	//console.log(req.cookies);
});


router.get('/create_event', function (req, res, next) {
	app.use(express.static(path.join(__dirname + '/public')));
	console.log(__dirname + '/create_event');
	res.sendFile(path.join(__dirname + '/create_event/create_event.html'));
});


// Database add/ remove/ get routes bellow
router.post('/post_event', (req, res) => {
	var login = JSON.parse(req.cookies.login);
	var tmp_user = login;
	var event_title = req.body.event_title;
	var tmp_location = req.body.location;
	var tmp_date = req.body.date;
	var tmp_time = req.body.time;
	var tmp_event_info = req.body.event_info;
	var tmp_activity = req.body.activity;
	var tmp_price = req.body.price;
	var unqiueID = parseInt(Math.random() * (9999999 - 1000000) + 1000000);
	var ppl = [login];

	var eventData = {
		_id: unqiueID,
		user: tmp_user,
		title: event_title,
		location: tmp_location,
		date: tmp_date,
		time: tmp_time,
		event_info: tmp_event_info,
		activity: tmp_activity,
		price: tmp_price,
		people: ppl,
		numPpl: 1
	};
	console.log(eventData);

	dbPromise.then((result) => {
		db.collection('EventData').insertOne(eventData, (err, result) => {
			if (err) return console.log(err);

			console.log("saved to db");
			res.redirect("/maps");
		});
	}, function (err) {
		console.log("The promise broke oops");
	});
});

router.get('/maps/more_info', (req, res) => {
	var query = {};
	var id = req.query._id;
	var login = JSON.parse(req.cookies.login);
	var canCheckIn = true;
	dbPromise.then((result) => {
		query["_id"] = Number(id);
		db.collection("EventData").findOne(query, (err, result) => {
			if(err) {
				console.log(err);
			} else {
				if (result.people != null) {
					for (var i = 0; i < result.people.length; i++) {
						var tmp = result.people[i];
						if (tmp.name == login.name && tmp.bio == login.bio)
							canCheckIn = false;
					}
				}
				res.render('more_info.hbs', {rslt: result, checkIn: canCheckIn});
			}
		});
	});
});

router.get('/maps/nearby', (req, res) => {
	app.set('views', path.join(__dirname, "views"));

	dbPromise.then((result) => {
		//{numPpl: {$gt: 1}}
		var cursor = db.collection('EventData').find().toArray((err, result) => {
			if (err) {
				console.log(err);
			} else {
				result = result.sort((a, b) => {
					return b.numPpl - a.numPpl;
				});
				// TODO: dont render old events
				res.render('nearby.hbs', {rslt: result});
			}
		});
	});

});

// Dedfault page route
router.use(function (req, res, next) {
	app.use(express.static(path.join(__dirname + '/public')));
	console.log(__dirname + '/login');
	res.sendFile(path.join(__dirname + '/login/login.html'));
});



module.exports = router;