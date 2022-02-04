//build mongoDB connection
const mongo = require("mongodb");
const uri = "mongodb+srv://root:root123@cluster0.yc0lz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new mongo.MongoClient(uri);
let db = null;

client.connect(async function(err){
//determine the the result of connecting
if(err){
    console.log("connection failed", err);
    return;
}
//operation on the database collection
db = client.db("member-system");
console.log("connection successful");
})

//Loading express module
const express = require("express");

//Build an application object
const app = express();

//setup express-session management
const session = require("express-session");
app.use(session({
    secret:"noidea",
    resave: false,
    saveUninitialized: true
}));

//build EJS view engine
app.set("view engine", "ejs");
app.set("views", "./views");

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

//routing
app.get("/", function(req,res){
    res.render("./home.ejs");
})
//route to membership sign-in
app.post("/signin", async function(req, res){
    const email = req.body.email;
    const password = req.body.password;
    //validation of data
    const collection = db.collection("member");
    let result = await collection.findOne({
        $and:[
            {email: email},
            {password: password}
        ]
    })
    if(result === null){ //if no corresponding data
        res.redirect("/error?msg=please+check+your+username+or+password");
        return;
    }
    //if successully sign in
    req.session.member = result;
    res.redirect("/member");
})
app.get("/member", async function(req, res){
    //membership identity check
    if(!req.session.member){
        res.redirect("/");
        return;
    }
    //retrieve the current member's name from Session
    const name = req.session.member.name;
    //retrieve all member's names from Session
    const collection = db.collection("member");
    let result = await collection.find({});
    let data = [];
    await result.forEach(function(member){
        data.push(member);
    })
    res.render("member.ejs", {name: name, data: data});
})
//route for signout
app.get("/signout", function(req, res){
    req.session.member = null;
    res.redirect("/");
})

// page for error message
app.get("/error", function(req, res){
    const msg = req.query.msg;   
    res.render("./error.ejs", {msg: msg});
})
// route for membership sign-up
app.post("/signup", async function(req, res){
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    //look into DB
    const collection = db.collection("member");
    let result = await collection.findOne({
        email:email
    });
    if(result !== null){ //if the email has been used
        res.redirect("/error?msg=this+email+has+been+registered");
        return;
    }
    //store new member data into DB
    result = await collection.insertOne({
        name: name, email: email, password: password
    });
    //store successfully, redirect to the root route
    res.redirect("/");
});

app.listen(3000, function(){
    console.log("Server Started");
});
