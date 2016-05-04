var mongoose = require('mongoose');

module.exports = mongoose.model('Status',{
	statuserId: String,
	statuserFirstName: String,
	statuserLastName: String,
	statuserPicName: String,
	statusMessage: String,
	statusPicName:String,
	likedBy:[String]
});