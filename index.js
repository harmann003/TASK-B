const fastify = require("fastify");
const path = require("path");
const uuid = require("uuid").v4;
const fastifySession = require("@fastify/session");
const fastifyCookie = require("@fastify/cookie");
const accountSid = "AC103d744f38a3a33aeff5e43ad50fbc04";
const authToken = "fc7ae5bbd259e0de52217f1a119f86d3";
const client = require("twilio")(accountSid, authToken);

const sqlite3 = require("sqlite3").verbose();
let db;
let otps = [];

let app = fastify();

app.register(require("@fastify/formbody"));

app.register(require("@fastify/view"), {
  engine: {
    handlebars: require("handlebars"),
  },
  root: "./views",
});

const fs = require("fs");
const fastifyMultipart = require("fastify-multipart");

app.register(fastifyMultipart);

// Encryption cookies
app.register(require("@fastify/cookie"), {
  secret: "VGGx0coCIkT7tNhE63eCgYqoeoGcml6nFD06", // for cookies signature
  hook: "onRequest", // set to false to disable cookie autoparsing or set autoparsing on any of the following hooks: 'onRequest', 'preParsing', 'preHandler', 'preValidation'. default: 'onRequest'
  parseOptions: {}, // options for parsing cookies
});

// let token = "fc7ae5bbd259e0de52217f1a119f86d3";
// let sid = "";
// let ph = "+13854176627";

app.register(require("@fastify/static"), {
  root: path.join(__dirname, "public"),
  prefix: "/public/",
});

app.get("/", (req, res) => {
  if (req.cookies.email) res.redirect("/menu");
  res.view("signin");
});

app.get("/signup", (req, res) => {
  if (req.cookies.email) res.redirect("/menu");
  res.view("signup");
});

app.get("/contactus", (req, res) => {
  res.view("contact");
});

app.post("/signin", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  console.log(req.body);

  db.get(
    "SELECT * FROM users WHERE email = ? and password = ?",
    [email, password],
    (err, data) => {
      if (err) throw err;
      if (!data) {
        console.log("Data is null");
        res.send("invalid details");
        return;
      }
      console.log(data);
      if (req.body.remember) {
        res.setCookie("email", email);
      } else {
        res.setCookie("email", email);
      }

      if (Object.keys(data).length > 0) {
        console.log("a");
        res.redirect("/menu");
      } else {
        res.send("Invalid Details");
      }
    }
  );
});

app.post("/signup", (req, res) => {
  console.log(req.body);

  db.run("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
    req.body.username,
    req.body.email,
    req.body.password,
  ]);

  res.redirect("/");
});

app.get("/aboutus", (req, res) => {
  res.sendFile("aboutus.html");
});

app.get("/faqs", (req, res) => {
  res.sendFile("faqs.html");
});

app.get("/menu", (req, res) => {
  if (!req.cookies.email) res.redirect("/");

  res.view("home");
});

app.get("/signout", (req, res) => {
  if (!req.cookies.email) res.redirect("/");

  res.clearCookie("email");
  res.redirect("/");
});

//
app.post("/contactus", async (req, res) => {
  // return the first file submitted, regardless the field name

  const username = req.body.username;
  const email = req.body.email;
  const subject = req.body.subject;
  const message = req.body.message;

  db.run(
    "INSERT INTO contactus (username, email, subject, message) VALUES (?, ?, ?, ?)",
    [username, email, subject, message]
  );

  res.redirect("/");
});

app.listen({ port: 8080, host: "localhost" }, () => {
  db = new sqlite3.Database("./db.sqlite");
  db.prepare(
    `CREATE TABLE IF NOT EXISTS users (username TEXT, email TEXT, password TEXT)`
  )
    .run()
    .finalize();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS contactus (username TEXT, email TEXT, subject TEXT, message TEXT)`
  )
    .run()
    .finalize();

  console.log("Server live");
});
