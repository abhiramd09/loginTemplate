const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mysql = require('mysql');
const ejs = require("ejs");
const _ = require("lodash");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "sGaDsB60!?",
  database: "scheduler"
});

let email, name, Id;

con.connect(function(err){
  if(err) throw err;
});

app.post("/signup.html", function(req, res){
  let newName = req.body.name;
  let newId = req.body.id;
  let newEmail = req.body.emailId;
  let newPassword = req.body.password;

  var sql = "INSERT INTO `students` VALUES(?, ?, ?, ?)";
  con.query(sql, [newId, newName, newEmail, newPassword], function(err, result){
    if(err) throw err;
  })
  res.redirect("/login.html");
})

app.post("/login.html", function(req, res){
  email = req.body.emailId;
  let password = req.body.password;
  var sql1='SELECT EmailId FROM students';
  con.query(sql1, function (err, result) {
    if (err) throw err;
    let flag=0;
    for(let i=0; i<result.length; i++){
      if(email===result[i].EmailId)
        flag=1;
    }
    if(!flag)
      res.redirect("/login.html");
  });
  var sql = 'SELECT Password, Name, Id FROM students WHERE EmailId = ?';
  con.query(sql, [email], function (err, result) {
    if (err) throw err;
    name=result[0].Name;
    Id=result[0].Id;
    if(result[0].Password === password)
      res.render("dashboard", {title: name});
    else {
      res.redirect("/login.html");
    }
  });

})

app.post("/profile", function(req, res){
  name = req.body.name;
  email= req.body.email;
  Id=req.body.id;
    var sql = 'UPDATE students SET Name = ?, EmailId = ?  WHERE Id = ?';
    con.query(sql, [name, email,  Id], function (err, result) {
      if (err) throw err;
    });

  res.render("profile", {title: name, name:name, email:email, id:Id});
})

app.post("/UpdatePassword", function(req, res){
  let oldPswd = req.body.Oldpassword;
  let newPswd = req.body.Newpassword;
  var sql = 'UPDATE students SET Password = ? WHERE Id = ?';
  con.query(sql, [newPswd, Id], function (err, result) {
    if (err) throw err;
  });
  res.redirect("/profile");
})

app.post("/UpdateID", function(req, res){
  let newId = req.body.NewId;
  console.log(newId);
  var sql = 'UPDATE students SET Id = ? WHERE Name = ?';
  con.query(sql, [newId, name], function (err, result) {
    if (err) throw err;
  });
  Id=newId;
  res.redirect("/profile");
})



app.get("/", function(req, res){
  res.sendFile(__dirname+"/welcome.html");
})

app.get("/login.html", function(req, res){
  res.sendFile(__dirname+"/login.html");
})

app.get("/siginup.html", function(req, res){
  res.sendFile(__dirname+"/signup.html");
})

app.get("/profile", function(req, res){
  res.render("profile", {title: name, name:name, email:email, id:Id });
})

app.get("/dashboard", function(req, res){
  res.render("dashboard", {title: name});
})
app.get("/UpdatePassword", function(req, res){
  res.render("UpdatePassword");
})
app.get("/UpdateID", function(req, res){
  res.render("UpdateID");
})
app.get("/calendar", function(req, res){
  res.render("calendar", {title: name});
})

app.listen(process.env.PORT || 3000, function(req, res){
	console.log("Server is running on port 3000");

})
