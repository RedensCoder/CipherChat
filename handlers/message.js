const express = require("express");
const prisma = require("../util/client");
const {config} = require("dotenv");

const {authenticateToken} = require("../util/security");
const {encrypt, decrypt} = require("../util/encrypt");
const {dateFormat} = require("../util/format");

config();

const router = express.Router();

module.exports = (io) => {

    router.post("/send", authenticateToken, async (req, res) => {
        if (!req.body.chat || !req.body.reciever || !req.body.sender || !req.body.content) {
            return res.sendStatus(204);
        }

        const reciever = await prisma.users.findFirst({where: {id: req.body.reciever}});
        const sender = await prisma.users.findFirst({where: {id: req.body.sender}});

        const hash = encrypt(reciever.pKey, req.body.content);
        const doubleHash = encrypt(sender.pKey, req.body.content);

        const message = await prisma.messages.create({
            data: {
                chatId: req.body.chat,
                recieverId: req.body.reciever,
                senderId: req.body.sender,
                content: hash,
                doubleContent: doubleHash
            }
        });

        io.emit("newMessage", {
            id: message.id.toString(),
            chatId: message.chatId.toString(),
            recieverId: reciever.id.toString(),
            senderId: sender.id.toString(),
            content: req.body.content,
            date: dateFormat(Date.now()),
            seen: message.seen
        });

        res.sendStatus(200);
    });

    router.post("/getAllMessages/:id", authenticateToken, async (req, res) => {
        if (!Number.isInteger(Number(req.params.id))) {
            return res.sendStatus(400)
        }

        const messages = await prisma.messages.findMany({
            orderBy: { date: 'desc' },
            take: Number(req.body.take),
            skip: Number(req.body.skip),
            where: {chatId: req.params.id}
        });
        let ArrayMessages = [];

        for (let el of messages) {
            try {
                const decryptedContent = decrypt(req.body.privateKey, el.content);


                ArrayMessages.push({
                    id: el.id.toString(),
                    chatId: el.chatId.toString(),
                    recieverId: el.recieverId.toString(),
                    senderId: el.senderId.toString(),
                    content: decryptedContent,
                    date: el.date,
                    seen: el.seen
                });
            } catch (e) {
                try {
                    const decryptedContent = decrypt(req.body.privateKey, el.doubleContent);

                    ArrayMessages.push({
                        id: el.id.toString(),
                        chatId: el.chatId.toString(),
                        recieverId: el.recieverId.toString(),
                        senderId: el.senderId.toString(),
                        content: decryptedContent,
                        date: el.date,
                        seen: el.seen
                    });
                } catch (e) {
                    return res.sendStatus(409);
                }
            }
        }

        ArrayMessages.sort(function(a,b){
            return new Date(a.date) - new Date(b.date);
        });

        ArrayMessages.map(el => {el.date = dateFormat(el.date)})

        res.send(ArrayMessages);
    });

    router.put("/seen/:id", authenticateToken, async (req, res) => {
        const message = await prisma.messages.update({
            where: {id: req.params.id},
            data: {seen: true}
        });

        io.emit("seen", {
            id: message.id.toString(),
            chatId: message.chatId.toString(),
            recieverId: message.recieverId.toString(),
            senderId: message.senderId.toString(),
            content: req.body.content,
            date: dateFormat(Date.now()),
            seen: message.seen
        });

        res.sendStatus(200);
    });

    return router;
}