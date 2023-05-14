const express = require("express");
const app = express();
const dotenv = require("dotenv");
const { Server } = require("socket.io");
dotenv.config();

app.get("/fetch", (req, res) => {
  res.status(200).json({ data: "Fetched Success" });
});

const server = app.listen(process.env.PORT, () => {
  console.log(`listening on port ${process.env.PORT}`);
});

// Integration Of Socket Io here ------------------------------------------------------------
const io = new Server({
  cors: {
    origin: "*",
  },
});

let Users = [];

const AddUser = (val) => {
  !Users?.some((item) => item?.email === val?.email) && Users.push(val);
};

const GetUser = (recieverId) => {
  return Users.find((user) => user.email === recieverId);
};

const RemoveUser = (socketId) => {
  Users = Users?.filter((item) => item?.socketId !== socketId);
};

const GetMultiUsers = (recieverId) => {
  return Users.filter((item) => item?.email !== recieverId);
};

io.on("connection", (socket) => {
  io.setMaxListeners(100);
  socket.on("Adduser", (user) => {
    user?.email && AddUser({ email: user.email, socketId: socket.id });
    io.emit("GetUsers", Users);
  });

  socket.on("SendMessage", ({ recieverId, message }) => {
    const user = GetUser(recieverId);
    user && io.to(user?.socketId).emit("GetMessage", message);
  });

  socket.on("SendTyping", ({ recieverId, typing }) => {
    const user = GetUser(recieverId);
    user && io.to(user?.socketId).emit("GetTyping", typing);
  });

  socket.on("SendChat", ({ recieverId, chat }) => {
    const users = GetMultiUsers(recieverId);
    users?.map((item) => {
      io.to(item?.socketId).emit("GetChat", chat);
    });
  });

  socket.on("SendRecieved", (data) => {
    io.emit("GetRecieved", data);
  });

  socket.on("disconnect", () => {
    RemoveUser(socket?.id);
    io.emit("GetUsers", Users);
  });
});

io.listen(server);
