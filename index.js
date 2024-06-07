const express = require("express");
const { Server } = require('socket.io');
const fileUpload = require("express-fileupload");
const cors = require("cors");
const {config} = require("dotenv");

const prisma = require("./util/client");

const User = require("./handlers/user");
const Chat = require("./handlers/chats");
const Message = require("./handlers/message");

config();

const app = express();

const server = app.listen(8080, () => {
    console.log(`Server started...`);
});

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
});

io.on('connection', (socket) => {
    socket.on('userOnline', async (userId) => {
        const user = await prisma.user_infos.update({
            where: { userId },
            data: {
                online: true
            }
        })
        io.emit('updateOnlineUsers', {
            userId,
            online: user.online
        });
    });

    socket.on('userDisconnect', async (userId) => {
        const user = await prisma.user_infos.update({
            where: { userId },
            data: {
                online: false,
                lastOnline: new Date(Date.now())
            }
        });

        io.emit('updateOnlineUsers', {
            userId,
            online: user.online,
            lastOnline: user.lastOnline
        });
    });
});

app.use("/files", express.static("files"));

app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

app.use(cors())
app.use(express.json());

app.use("/user", User(io));
app.use("/chat", Chat);
app.use("/message", Message(io));