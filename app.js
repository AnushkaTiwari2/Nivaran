const express = require("express");
const mongoose = require("mongoose");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

const User = require("./models/User");

const authenticateUser = require("./middlewares/authenticateUser");


const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

require('./startup/db')();
require('./startup/middleware')(app);

// cookie session
app.use(
  cookieSession({
    keys: ["randomStringASyoulikehjudfsajk"],
  })
);

// route for serving frontend files
app
  .get("/", (req, res) => {
    res.render("index");
  })
  .get("/login", (req, res) => {
    res.render("login");
  })
  .get("/register", (req, res) => {
    res.render("register");
  })
  .get("/content", (req, res) => {
    res.render("content");
  })
  .get("/Class12", (req, res) => {
    res.render("Class12");
  })
  

  
  .get("/web", authenticateUser, (req, res) => {
    res.render("web", { user: req.session.user });
  });
  
  app.get("/home", (req, res) => {
    res.render("home");
  });
  app.get("/webd", (req, res) => {
    res.render("webd");
  });
  app.get("/appd", (req, res) => {
    res.render("appd");
  });
  app.get("/doccer", (req, res) => {
    res.render("doccer");
  });
  app.get("/kotlin", (req, res) => {
    res.render("kotlin");
  });
  app.get("/mongo", (req, res) => {
    res.render("mongo");
  });
  app.get("/node", (req, res) => {
    res.render("node");
  });
  app.get("/react", (req, res) => {
    res.render("react");
  });
  app.get("/chat", (req, res) => {
    res.render("chat");
  });
// route for handling post requirests
app
  .post("/login", async (req, res) => {
    const { email, password } = req.body;

    // check for missing filds
    if (!email || !password) return res.send("Please enter all the fields");

    const doesUserExits = await User.findOne({ email });

    if (!doesUserExits) return res.send("invalid username or password");

    const doesPasswordMatch = await bcrypt.compare(
      password,
      doesUserExits.password
    );

    if (!doesPasswordMatch) return res.send("invalid useranme or password");

    // else he\s logged in
    req.session.user = {
      email,
    };

    res.redirect("/web");
  })
  .post("/register", async (req, res) => {
    const { email, password } = req.body;

    // check for missing filds
    if (!email || !password) return res.send("Please enter all the fields");

    const doesUserExitsAlreay = await User.findOne({ email });

    if (doesUserExitsAlreay) return res.send("A user with that email already exits please try another one!");

    // lets hash the password
    const hashedPassword = await bcrypt.hash(password, 12);
    const latestUser = new User({ email, password: hashedPassword });

    latestUser
      .save()
      .then(() => {
        res.send("registered account!");
        res.redirect("/login");
      })
      .catch((err) => console.log(err));
  });

//logout
app.get("/logout", authenticateUser, (req, res) => {
  req.session.user = null;
  res.redirect("/login");
});

let numUsers = 0;

io.on('connection', (socket) => {
  console.log('connect ho gaya')
  let addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', () => {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', () => {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

// server config
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server started listening on port: ${PORT}`);
});
