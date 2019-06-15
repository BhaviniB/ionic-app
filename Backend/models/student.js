var mongoose = require('mongoose');

var studentSchema = mongoose.Schema({
	name : String, //Name of the Student
	department : String, //Departemnt of the Student. eg CSE, IT, ME etc
	rollno : Number, //Rollnumber of the Student
	cgpa : Number, //CGPA of the Student
	updated : { type: Date, default: Date.now } // Timestamp
}); 

/*
Creates a students collection on mlab mongoDB database. Mongoose always plurarizes the collection name.
To find all the entries in Mongo database use syntax `db.companies.find()`
*/
var Students = module.exports = mongoose.model('Student', studentSchema);


/* 
Below syntax saves/registers a student in the students collection.
*/
module.exports.addStudent = function(student, callback){
	Students.create(student, callback);
}


/*
Updates student/students based on the parameters provided. Name, department, rollno and/or CGPA can be updated.
*/
module.exports.updateStudents = function(query, student, callback){
	Students.update(query, student, { multi: true }, callback);
}

/*
SHows/Displays/Returns all the students in JSON format
*/
module.exports.getStudents = function(query, callback, limit){
	Students.find(query, callback).limit(limit);
}


/*
Removes a student from a students collection.
*/
module.exports.removeStudents = function(query, callback){
	Students.remove(query, callback);
}