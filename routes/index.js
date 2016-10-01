var express = require('express');
var monk = require('monk');
var jwt = require('jsonwebtoken');
var Cookies = require('cookies');
//var app = require('./app');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('main');
});

router.get('/register', function(req, res, next) {
    res.render('registration');
});

router.get('/offerings', function(req, res, next) {
    try {
        var token = new Cookies(req,res).get('token');
        var decoded = jwt.verify(token, 'hackTheQueen');
    
        jwt.verify(token, 'hackTheQueen', function(err, decoded) {
            if(err) {
                res.redirect('login');
            } else {
                res.render('offerings');
            }
        });
    } catch(err) {
        res.redirect('login');
    }
});

router.get('/login', function(req, res, next) {
    res.render('login');
});

router.post('/addSupplier', function(req, res) {
    // Set our internal DB variable
    var db = monk('localhost:27017/noFoodLeftBehind');
    //var db = req.db;

    // Set our collection
    var collection = db.get('suppliers');

    // Submit to the DB
    collection.insert({
        "locationname" : req.body.location_name,
        "organization" : req.body.organization_name,
		"password" : req.body.password,
		"email" : req.body.email,
		"address" : req.body.address_line1,
		"address2" : req.body.address_line2,
		"city" : req.body.address_city,
		"province" : req.body.address_province,
		"country" : req.body.address_country,
		"postal" : req.body.postalcode,
        "offerings" : {}
	}, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem adding the information to the database.");
        } else {
            // And forward to success page
            res.redirect('offerings');
        }
    });
});

router.get('/listAllOfferings', function(req,res) {
    // Set our internal DB variable
    var db = monk('localhost:27017/noFoodLeftBehind');

    // Set our collection
    var collection = db.get('suppliers');
    
    collection.find({}, function (err, user) {
        if (err) {
            res.send(err);
        } else {
            res.send(user);
        }
    });
});

router.get('/userListOfferings', function(req,res) {
    // Set our internal DB variable
    var db = monk('localhost:27017/noFoodLeftBehind');

    // Set our collection
    var collection = db.get('suppliers');

    try {
        var token = new Cookies(req,res).get('token');
        var decoded = jwt.verify(token, 'hackTheQueen');
    
        jwt.verify(token, 'hackTheQueen', function(err, decoded) {
            if(err) {
                res.redirect('login');
            } else {
                collection.find({
                    "locationname" : decoded.locationname
                }, function (err, user) {
                    if (err) {
                        res.send(err);
                    }

                    if(!user) {
                        res.send("{}");
                    } else {
                        res.send(user.offerings);
                    }
                });
            }
        });
    } catch(err) {
        res.redirect('login');
    }   
});

router.get('/listOfferings', function(req,res) {
    res.send({
        "food_name" : ['lettuce','tomato'],
        "quantity" : ['1','2'],
        "expire_date" : ['1232-12-12','1232-12-12'],
        "perishable" : ['true','true'],
        "comments" : ['','']
    });
});

router.post('/userCheck', function(req, res) {
    // Set our internal DB variable
    var db = monk('localhost:27017/noFoodLeftBehind');

    // Set our collection
    var collection = db.get('suppliers');

    collection.findOne({
        "locationname" : req.body.locationname,
		"password" : req.body.password
	}, function (err, user) {
        if (err) {
            res.send(err);
        }

        if(!user) {
            // And forward to success page
            res.send("User not found");
        } else if (user) {
            // check if password matches
		    if (user.password != req.body.password) {
            	res.json({ success: false, message: 'Authentication failed. Wrong password.' });
      		} else { 
				// if user is found and password is right
				// create a token
				var token = jwt.sign(user, 'hackTheQueen', {
				  expiresIn: 1440 // expires in 24 hours
				});

				// return the information including token as JSON
				new Cookies(req,res).set('token',token,{
                  httpOnly: true
                  //secure: true
                });
                res.redirect('offerings');
            }
		}
    });
});

router.post('/addOffering', function(req, res) {
    // Set our internal DB variable
    var db = monk('localhost:27017/noFoodLeftBehind');
    
    // Set our collection
    var collection = db.get('suppliers');

    // Submit to the DB
    var foods = [];
    for(var i=0; i<req.body.food_name.length; i++) {
        foods.push({
            "food_name" : req.body.food_name[i],
            "quantity" : req.body.quantity[i],
            "expire_date" : req.body.expire_date[i],
            "perishable" : req.body.perishable[i],
            "comments" : req.body.comments[i]
        });
    }

    var token = new Cookies(req,res).get('token');
    var decoded = jwt.verify(token, 'hackTheQueen');
    
    jwt.verify(token, 'hackTheQueen', function(err, decoded) {
        collection.update(
            {locationname : decoded.locationname},
            {
                locationname: decoded.locationname,
                organization: decoded.organization,
                password: decoded.password,
                email: decoded.email,
                address: decoded.address,
                address2: decoded.addess2,
                city: decoded.city,
                province: decoded.province,
                country: decoded.country,
                email: decoded.postal,
                offerings: foods
            },
            {upsert: false}, 
            function (err, doc) {
                if (err) {
                    // If it failed, return error
                    res.send("There was a problem adding the information to the database.");
                } else {
                    // And forward to success page
                    res.send(decoded);
                }
        });
    });
});

module.exports = router;
