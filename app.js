const express = require("express");
const https = require("https");
const bodyParser = require("body-parser");
const mysql = require('mysql');
const ejs = require("ejs");
const _ = require("lodash");
let alert = require('alert');
var MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
mongoose.connect("mongodb://localhost:27017/scheduler");
var conn = mongoose.connection;

// const fruitSchema = new mongoose.Schema({
//   name: String,
//   rating: Number,
//   review: String
// });
// const Fruit = mongoose.model("Fruit", fruitSchema);

// const fruit = new Fruit({
//   name: "Apple",
//   rating: 7,
//   review: "Pretty solid as a fruit."
// });
// fruit.save();

const slotSchema = new mongoose.Schema({
  name: String,
  year: Number,
  month: Number,
  day: Number,
  startTime: String,
  endTime: String,
  mTime: String,
  text: String
});
const slotAvailability = mongoose.model("slot", slotSchema);


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

// MongoClient.connect(url, function(err, db){
//   if(err) throw err;
//   var connect = db.db(dbName);
//   connect.collection("TestUser1").find({}).toArray(function(err, result){
//     if(err) throw err;
//     console.log("Yes");
//     console.log(result);
//     db.close();
//   });
// });

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
  var flag=0;
  con.query(sql1, function (err, result) {
    if (err) throw err;
    for(let i=0; i<result.length; i++){
      if(email==result[i].EmailId){
        flag=1;
        break;
      }
    }
    if(flag==0){
      alert("Email is not registered");
    }
  });

  // if(flag){
    var sql = 'SELECT Password, Name, Id FROM students WHERE EmailId = ?';
    con.query(sql, [email], function (err, result) {
      if (err) throw err;
      name=result[0].Name;
      Id=result[0].Id;
      if(result[0].Password === password)
        res.render("dashboard", {title: name});
      else {
        alert("Wrong Password!");
        res.redirect("/login.html");
      }
    });
// }

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

app.post("/dashboard", function(req, res){
  let date = req.body.date;
  let sTime = req.body.startTime;
  let eTime = req.body.endTime;
  let mm = req.body.mm;
  let status = req.body.availability;
  let day = date[0]+date[1];
  let month = date[3]+date[4];
  let year = date[6]+date[7]+date[8]+date[9];

  const user = new slotAvailability({
    name: name,
    year: +year,
    month: +month,
    day: +day,
    startTime: sTime,
    endTime: eTime,
    mTime: mm,
    text: name+" is "+status
  });
  user.save();

  res.render("dashboard", {title: name});
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
  let dbCollection;
  let jsonObj;
  const obj={
    years: [
      {
      "int": 2023,
      "months": [
        {
          "int": 4,
          "days": [
            {
              "int": 28,
              "events": [
                {
                  "startTime": "6:00",
                  "endTime": "6:30",
                  "mTime": "pm",
                  "text": "Weirdo was born"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

  // MongoClient.connect(url).then((client)=>{
  //   const db = client.db(dbName);
  //   db.listCollections().toArray(function(err, names){
  //     if(!err){
  //       console.log("names");
  //     }
  //   });
  // }).catch((err) => {
  //   console.log(err.Message);
  // })
  slotAvailability.find().then((result)=>{
    dbCollection=result;
  }).catch((err)=>{
    console.log(err);
  })

  var sql = "SELECT Name FROM students";
  con.query(sql, function(err, result){
    if(err) throw err;
    for(let i=0; i<result.length; i++){
      break;
      let userName = result[i].Name;
      slotAvailability.find({name: userName}).then((result)=>{
        console.log(result);
      }).catch((err)=>{
        console.log(err);
      })
    }
  })


  res.render("calendar", {title: name, obj: obj});
})

app.listen(process.env.PORT || 3000, function(req, res){
	console.log("Server is running on port 3000");

})
