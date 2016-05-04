var mongoose = require('mongoose');

module.exports = mongoose.model('User',{
	username: String,
	password: String,
	email: String,
	firstName: String,
	phone: String,
	lastName: String,
	picName: String,
	friendReqs: [String],
	friends: [String],
	statuses: Object
});