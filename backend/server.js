const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");
const User = require("./models/userModel");
const session = require("express-session");
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;

require("dotenv").config({ path: "./config.env" });
connectDB();
const app = express();

app.use(express.json({limit:1024*1024*10})); // to accept json data
// app.get("/", (req, res) => {
//   res.send("API Running!");
// });
const cors = require("cors");
app.use(cors({ origin: process.env.CORS_ALLOWED_HOST, credentials: true }));
app.use((req,res,next) => {
  console.log("Req url: ", req.url);
  next();
})
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// --------------------------deployment------------------------------

const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "/frontend/build")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "build", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// --------------------------deployment------------------------------

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`.yellow.bold)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    // origin: ["http://localhost:3000", "http://192.168.120.101:3000"],
    // credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");
  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });
  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id == newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.on("schedule_message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    console.log("delay", newMessageRecieved.delay);
    if (!chat.users) return console.log("chat.users not defined");
    const delay = parseInt(newMessageRecieved.delay, 10) || 0;
    try {
      setTimeout(() => {
        chat.users.forEach((user) => {
          if (user._id == newMessageRecieved.sender._id) return;
          socket.in(user._id).emit("message recieved", newMessageRecieved);
        });
      }, delay);
    } catch (error) {
      console.log("Error in setTimeout:", error);
    }
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});

app.use(
  session({
    secret: "gagafeuhibfkqwbc",
    resave: false,
    saveUninitialized: true,
  })
);

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

// passport.use(
//   new OAuth2Strategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//       callbackURL: "http://localhost:3001/auth/google/callback",
//       scope: ["profile", "email"],
//     },
//     async (accessToken, refreshToken, profile, done) => {
//       try {
//         let user = await User.findOne({ googleId: profile.id });

//         if (!user) {
//           user = new User({
//             googleId: profile.id,
//             name: profile.displayName,
//             email: profile.emails[0].value,
//             image: profile.photos[0].value,
//           });
//           await user.save();
//         }

//         return done(null, user);
//       } catch (error) {
//         return done(error, null);
//       }
//     }
//   )
// );

// passport.serializeUser((user, done) => {
//   done(null, user);
// });

// passport.deserializeUser((user, done) => {
//   done(null, user);
// });

// // initial google ouath login
// app.get(
//   "/auth/google",
//   passport.authenticate("google", { scope: ["profile", "email"] })
// );

// app.get(
//   "http://localhost:3001/auth/google/callback",
//   passport.authenticate("google", {
//     successRedirect: "http://localhost:3000",
//     failureRedirect: "http://localhost:3000",
//   })
// );
