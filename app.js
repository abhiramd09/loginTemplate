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

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: <password>,
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
      res.redirect("/login.html");
    }
  });

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
  let oldPswd = req.body.oldPswd;
  let newPswd = req.body.newPswd;
  var sql = 'UPDATE students SET Password = ? WHERE Id = ?';
  con.query(sql, [newPswd, Id], function (err, result) {
    if (err) throw err;
  });
  res.redirect("/profile");
})

app.post("/UpdateID", function(req, res){
  let newId = req.body.NewId;
  let oldId = req.body.OldId;
  console.log(newId);
  var sql = 'UPDATE students SET Id = ? WHERE Id = ?';
  con.query(sql, [newId, oldId], function (err, result) {
    if (err) throw err;
  });
  Id=newId;
  res.render("profile", {title: name, name:name, email:email, id:Id});
})

app.post("/dashboard", function(req, res){
  let date = req.body.date;
  let sTime = req.body.startTime;
  let eTime = req.body.endTime;
  let mm = req.body.mm;
  let status = req.body.availability;
  let day = date[8]+date[9];
  let month = date[5]+date[6];
  let year = date[0]+date[1]+date[2]+date[3];

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
  res.render("profile", {title: name, name:name, email:email, id: Id});
})

app.get("/dashboard", function(req, res){
  res.render("dashboard", {title: name});
})

app.get("/UpdatePassword", function(req, res){
  res.render("UpdatePassword", {title: name, name: name});
})

app.get("/UpdateID", function(req, res){
  res.render("UpdateID", {title: name, name:name, id:Id });
})

app.get("/calendar", function(req, res){
  let dbCollection;
  let jsonObj;
  var obj={
    "years": [
      {
      "int": 2025,
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
    let k=0, i=0, yearFlag=0, monthFlag=0, dayFlag=0;
    let yearsArray = obj.years;
    while(k<result.length){
      for(let i=0; i<yearsArray.length; i++){
        if(yearFlag)
          break;
        if(result[k].year==yearsArray[i].int){
          yearFlag=1;
          let monthsArray = yearsArray[i].months;
          for(let j=0; j<monthsArray.length; j++){
            if(monthFlag)
              break;
            if(result[k].month==monthsArray[j].int){
              monthFlag=1;
              let daysArray = monthsArray[j].days;
              // console.log(daysArray);
              for(let l=0; l<daysArray.length; l++){
                if(dayFlag)
                  break;
                if(result[k].day == daysArray[l].int){
                  dayFlag=1;
                  var tempObj = {
                    "startTime": result[k].startTime,
                    "endTime": result[k].endTime,
                    "mTime": result[k].mTime,
                    "text": result[k].text
                  };
                  obj.years[i].months[j].days[l].events.push(tempObj);
                }
                else if(l==daysArray.length-1){
                  var tempObj = {
                    "int": result[k].day,
                    "events": [
                      {
                        "startTime": result[k].startTime,
                        "endTime": result[k].endTime,
                        "mTime": result[k].mTime,
                        "text": result[k].text
                      }
                    ]
                  }
                  obj.years[i].months[j].days.push(tempObj);
                  break;
                }
              }
            }
            else if(j==monthsArray.length -1 ){
              var tempObj = {
                "int": result[k].month,
                "days": [
                  {
                    "int": result[k].day,
                    "events": [
                      {
                        "startTime": result[k].startTime,
                        "endTime": result[k].endTime,
                        "mTime": result[k].mTime,
                        "text": result[k].text
                      }
                    ]
                  }
                ]
              }
              obj.years[i].months.push(tempObj);
              break;
            }

          }
        }
        else if(i==yearsArray.length-1){
              const tempObj = {
              "int": result[k].year,
              "months": [
                {
                  "int": result[k].month,
                  "days": [
                    {
                      "int": result[k].day,
                      "events": [
                        {
                          "startTime": result[k].startTime,
                          "endTime": result[k].endTime,
                          "mTime": result[k].mTime,
                          "text": result[k].text
                        }
                      ]
                    }
                  ]
                }
              ]
            }
            obj.years.push(tempObj);
            break;
        }

      }

      yearFlag=0; monthFlag=0; dayFlag=0;
      k++;
    }
    res.render("calendar", {title: name, obj: obj});
  }).catch((err)=>{
    console.log(err);
  })

})

app.listen(process.env.PORT || 3000, function(req, res){
	console.log("Server is running on port 3000");

})
