var express = require('express');
var bCrypt = require('bcrypt-nodejs');
var User = require('../models/user');
var Status = require('../models/status');
var Comment = require('../models/comment');
var multer = require('multer');
var uuid = require('node-uuid');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '.jpg') //Appending .jpg
  }
})

var upload = multer({ storage: storage });


var router = express.Router();


var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	router.get('/likeComment', function(req, res) {
		var query = {_id:req.query.commentId};
		var update = {"likedBy":req.user.id};
		Comment.findOneAndUpdate(query, {$addToSet : update}, {new : true}, function(err, result){
			var likersCount = result.likedBy.length;
			res.status(200).send(likersCount.toString());
		});
	});

	router.get('/unlikeComment', function(req, res) {
		var query = {_id:req.query.commentId};
		var update = {"likedBy":req.user.id};
		Comment.findOneAndUpdate(query, {$pull : update}, {new : true}, function(err, result){
			var likersCount = result.likedBy.length;
			res.status(200).send(likersCount.toString());
		});
	});

	router.get('/showFriends', function(req, res){
		console.log("request for showFriends received with user id - " + req.user.id)
		User.find({'_id': { $in: req.user.friends}}, function(err, results){
			res.send(results);
		});
	});

	router.get('/pendingReqs', function(req, res) {
		var reqs = req.user.friendReqs;
		User.find({'_id': { $in: reqs}}, function(err, results){	
			res.send(results);
		});
	});

	router.get('/approve', function(req, res) {
		var id = req.query.requestorId;

		User.findOneAndUpdate({_id:req.user.id},{ $pull: { friendReqs: {$in: [ id ]} }, $push: {friends: id} }, function(err,results){
			User.findOneAndUpdate({_id:id}, { $push: {friends: req.user.id}}, function(err,results){
				res.send('done');
			});			
		});
	});

	router.get('/sendFriendReq', function(req, res){
		User.update( { _id: req.query.requesteeId }, { $addToSet: { friendReqs: req.user.id }}, function(err, results){
				res.send('done')
   			});
	});

	router.get('/', function(req, res) {
		res.render('index', { 
			message: req.flash('message'), 
			title: 'Geminiwall Sign in' 
		});
	});

	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));

	router.get('/signup', function(req, res){
		res.render('register',{
			message: req.flash('message'),
			title: 'Registration'
		});
	});

	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	router.post('/changePass', function(req, res) {
		console.log(req.user)
		if (!isValidPassword(req.user, req.body.oldPass)){
         res.render('onchange', {
         	message : 'Invalid old password'
         });           
		} else {
			var newPass = createHash(req.body.newPass);
			var query = {'username': req.user.username};
            var update = {'password' : newPass};
            var options = {new: true};

            User.findOneAndUpdate(query, update, options, function(err, user){
                res.render('onchange', {
		         	message : 'Password changed successfully'
		         });
            });
		}
	});

	router.get('/change', function(req, res){
		res.render('change', {
			title : 'Change Password'
		});
	});

	router.post('/comment', function(req, res) {
		
		new Comment({
			statusId: req.body.statusId,
			commenterId: req.user.id,
			commenterFirstName: req.user.firstName,
			commenterLastName: req.user.lastName,
			commenterPicName: req.user.picName,
			commentMessage: req.body.commentMessage,
		}).save(function(err, comment){
			res.send(comment);
		});
	});

	router.get('/getComments', function(req, res) {

		Comment.find({statusId : req.query.statusId}, function(err, results){
			res.send(results);
		});
	});

	router.get('/like', function(req, res) {

		update = {};
		update["likedBy"] = req.user.id;

		Status.findOneAndUpdate({_id : req.query.statusId}, {"$addToSet": update},  {new:true}, function(err, result) {
			var likersCount = result.likedBy.length;
			res.status(200).send(likersCount.toString());
		});		
	});

	router.get('/unlike', function(req, res) {
		update = {};
		update["likedBy"] = req.user.id;

		Status.findOneAndUpdate({_id : req.query.statusId}, {"$pull": update},  {new:true}, function(err, result) {
			var likersCount = result.likedBy.length;
			res.status(200).send(likersCount.toString());
		});
	})

	router.get('/likersCount', function(req, res) {

		Status.findOne({_id : req.query.statusId}, function(err, result) {
			var likerIds = result.likedBy;
			User.find({_id : {$in : likerIds}}, function(err, results) {
				var likers = [];
				for (var i = 0; i < results.length; i++) {
					var liker = {};
					var homerId = req.user.id;
					if(results[i].id == homerId || results[i].friends.indexOf(homerId) > -1){
						liker.isFriend = true;
					} else {
						liker.isFriend = false;
					}
					liker.id = results[i].id;
					liker.firstName = results[i].firstName;
					liker.lastName = results[i].lastName;
					liker.picName = results[i].picName;
					likers.push(liker);
				};
				res.send(likers);
			})
		})
	})

	router.post('/updateStatus', upload.single('statusPic'), function(req, res) {

		new Status({
			statuserId: req.user.id,
		 	statuserFirstName: req.user.firstName, 
		 	statuserLastName: req.user.lastName, 
		 	statuserPicName : req.user.picName, 
		 	statusPicName : req.file.filename,
		 	statusMessage : req.body.statusToUp
		 	}).save(function(err, status) {
	    		res.redirect('/home');
	  	});
	});

	router.get('/all', function(req, res) {
		var notQuery = req.user.friends;
		notQuery.push(req.user.id);
		User.find({ _id: { $nin: notQuery }}, function(err, users) {
			res.send(users);
			/*res.render('all', {
				title: 'All Users',
				users : users
			});*/
		});
	});

	router.get('/fetchMoreOnScroll', function(req, res){
		var friendsIds = req.user.friends;
		var skipped = req.query.loadsDone * 5;
		friendsIds.push(req.user.id);
		var cbdone = 0;
		var statusDatas = [];

		Status.find({statuserId : {$in: friendsIds}}, null, {skip : skipped, limit: 5, sort: {_id: -1}}, function(err, statuses) {
			if(err || statuses.length == 0) {
				res.send(null);
				return;
			}

			for (var i = 0; i < statuses.length; i++) {
				(function(currStatus){
					var obj = {};
					obj.statusData = currStatus;
					var currentStatus = currStatus;
					var a = currentStatus._id.getTimestamp();
					var index = a.toString().indexOf('GMT') - 1;
					
					obj.timeStamp = a.toString().substring(0,index);

					if(currentStatus.likedBy){
						if (currentStatus.likedBy.indexOf(req.user.id) > -1) {
							obj.isLiked = true;
						}
						obj.likersCount = currentStatus.likedBy.length;
					} else {
						obj.isLiked = false;
						obj.likersCount = 0;
					}

					Comment.find({statusId : currentStatus.id}, null, {sort : {_id : -1}}, function(err, comms){
						var commentss = [];

						for (var i = 0; i < comms.length; i++) {
							(function(currComment){
								var comm = {};
								comm.commentData = currComment;
								comm.isLiked = currComment.likedBy.indexOf(req.user.id)>-1;
								comm.likersCount = currComment.likedBy.length;
								commentss.push(comm);
							})(comms[i]);
						};
						obj.comments = commentss;
						statusDatas.push(obj);
						cbdone++;
						if(cbdone === statuses.length){
							res.send(statusDatas);
						}
					});

				})(statuses[i]);			
			};
		});
	})

	router.get('/home', isAuthenticated, function(req, res){
		var friendsIds = req.user.friends;
		friendsIds.push(req.user.id);
		var cbdone = 0;

		Status.find({statuserId : {$in: friendsIds}}, null, {skip : 0, limit: 5, sort: {_id: -1}}, function(err, statuses) {
			console.log('statuses:'+statuses);
			console.log('Error:'+err);
			
			for (var i = 0; i < statuses.length; i++) {
				(function(currStatus){
					var currentStatus = currStatus;
					var a = currentStatus._id.getTimestamp();
					var index = a.toString().indexOf('GMT') - 1;
					
					currentStatus.timeStamp = a.toString().substring(0,index);
					if(currentStatus.likedBy){
						if (currentStatus.likedBy.indexOf(req.user.id) > -1) {
							currentStatus.isLiked = true;
						};
						currentStatus.likersCount = currentStatus.likedBy.length;
					} else {
						currentStatus.isLiked = false;
						currentStatus.likersCount = 0;
					}

					Comment.find({statusId : currentStatus.id}, null, {sort: {_id: -1}}, function(err, comments){
						var noOfComms = comments.length;

						if (noOfComms > 2) {
							currentStatus.hasMore = noOfComms - 2;
							for (var i = 1; i >= 0; i--) {
								comments[i].likersCount = comments[i].likedBy.length;
								comments[i].isLiked = comments[i].likedBy.indexOf(req.user.id) > -1;
							};
							currentStatus.comments = comments.slice(0,2);
						} else {
							currentStatus.hasMore = 0;
							for (var i = noOfComms - 1; i >= 0; i--) {
								comments[i].likersCount = comments[i].likedBy.length;
								comments[i].isLiked = comments[i].likedBy.indexOf(req.user.id) > -1;
							};
							currentStatus.comments = comments;
						}
						cbdone++;
						if(cbdone === statuses.length){
							res.render('home2', {
								user: req.user, 
								statuses: statuses
							});	
						}
					});

				})(statuses[i]);			
			};
		});
  	});

	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	router.get('/user/:id', function(req, res){
		var query = {"_id": req.params.id};
		User.findOne(query, function(err, user){	
			res.render(
				'edit',
				{title : 'Edit Profile ' + user.firstName, user : user}
			);
		});
	});

	router.put('/user/:id', upload.single('picName'), function(req, res) {
	  var query = {"_id": req.params.id};
	  var update = {firstName : req.body.firstName,picName:req.file.filename, lastName: req.body.lastName, email:req.body.email};
	  var options = {new: true};
	  User.findOneAndUpdate(query, update, options, function(err, user){
	    res.redirect('/home');
	  });
	});

	var isValidPassword = function(user, password){
        return bCrypt.compareSync(password, user.password);
    }
    
    var createHash = function(password){
        return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    }

	return router;
}