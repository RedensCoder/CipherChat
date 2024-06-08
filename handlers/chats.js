const express = require("express");
const prisma = require("../util/client");
const {config} = require("dotenv");

const {authenticateToken, authenticateTokenBody} = require("../util/security");
const {formatLastSeen} = require("../util/format");

config();

const router = express.Router();

router.post("/create", authenticateTokenBody, async (req, res) => {
    if (!req.body.userId || !req.body.secondUserId) {
        return res.sendStatus(204);
    }

    const chat = await prisma.chats.create();

    await prisma.chat_users.create({
        data: {
            chatId: chat.id,
            userId: req.body.userId
        }
    });

    await prisma.chat_users.create({
        data: {
            chatId: chat.id,
            userId: req.body.secondUserId
        }
    });

    res.send(JSON.stringify(
        chat, (key, value) => (typeof value === 'bigint' ? value.toString() : value)
    ));
});

router.get("/getChatUsersByUserId/:id", authenticateToken, async (req, res) => {
    const userId = Number(req.params.id);

    const chatUsers = await prisma.chat_users.findMany({
        where: { userId },
        include: {
            chat: {
                include: {
                    Messages: {
                        orderBy: { date: 'desc' },
                        take: 1
                    },
                    Chat_Users: {
                        include: {
                            user: {
                                include: {
                                    User_Infos: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    const users = [];

    for (let chatUser of chatUsers) {
        const chat = chatUser.chat;
        for (let cu of chat.Chat_Users) {
            if (Number(cu.userId) !== Number(userId)) {
                const user = cu.user;
                const userInfo = user.User_Infos;
                const lastMessage = chat.Messages[0];

                const unreadMessagesCount = await prisma.messages.count({
                    where: {
                        chatId: chat.id,
                        seen: false,
                        senderId: {
                            not: userId
                        }
                    }
                });

                users.push({
                    name: user.login,
                    avatar: userInfo.avatar,
                    reciever: user.id,
                    chatId: chat.id,
                    online: userInfo.online,
                    lastOnline: formatLastSeen(userInfo.lastOnline),
                    notification: cu.notification,
                    count: chat.Messages.length,
                    lastMTime: lastMessage ? lastMessage.date : null,
                    unreadMessagesCount
                });
            }
        }
    }

    users.sort((a, b) => {
        if (a.lastMTime && b.lastMTime) {
            return new Date(b.lastMTime) - new Date(a.lastMTime);
        } else if (a.lastMTime) {
            return -1;
        } else if (b.lastMTime) {
            return 1;
        } else {
            return 0;
        }
    });

    res.send(JSON.stringify(
        users, (key, value) => (typeof value === 'bigint' ? value.toString() : value)
    ));
});

router.put("/notification/:id", authenticateTokenBody, async (req, res) => {
    const chatUser = await prisma.chat_users.findFirst({ where: { AND: { chatId: req.params.id, userId: req.body.userId } } })

    if (chatUser === null) {
        return res.sendStatus(409);
    }

    await prisma.chat_users.update({
        where: { id: chatUser.id },
        data: { notification: !chatUser.notification }
    })

    res.sendStatus(200);
});

module.exports = router;