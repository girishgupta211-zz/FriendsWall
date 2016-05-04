var mongoose = require('mongoose');

module.exports = mongoose.model('Comment', {
	statusId: String,
	commenterId: String,
	commenterFirstName: String,
	commenterLastName: String,
	commenterPicName: String,
	commentMessage: String,
	likedBy:[String]
});