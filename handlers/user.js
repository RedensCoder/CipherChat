const express = require("express");
const crypto = require('crypto');
const prisma = require("../util/client");
const {config} = require("dotenv");
const {formatLastSeen} = require("../util/format");

const {generateAccessToken, authenticateToken, authenticateTokenParams, authenticateTokenBody} = require("../util/security");
const fs = require("fs");
const path = require("path");

config();

const router = express.Router();

module.exports = (io) => {
    router.post("/create", async (req, res) => {
        if (!req.body.login || !req.body.password) {
            return res.sendStatus(204);
        }

        const user = await prisma.users.findFirst({where: {login: req.body.login}});

        if (user !== null) {
            res.sendStatus(409);
        } else {
            const Hasher = crypto.createHmac("sha256", process.env.SECRET_TOKEN);
            const password = Hasher.update(req.body.password).digest("hex");

            const {publicKey, privateKey} = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs1',
                    format: 'pem'
                }
            });

            const filePath = path.join(__dirname, `../keys/${req.body.login}_private.pem`);

            fs.writeFileSync(filePath, privateKey);

            const createdUser = await prisma.users.create({
                data: {
                    login: req.body.login,
                    password: password,
                    pKey: publicKey
                }
            });

            await prisma.user_infos.create({
                data: {
                    userId: createdUser.id,
                    online: false,
                    about: null,
                    avatar: `${req.protocol}://${req.get('host')}/files/avanull.png`
                }
            });

            const token = generateAccessToken(Number(createdUser.id), req.body.login);

            res.send({
                token,
                privateKey
            });
        }
    });

    router.post("/auth", async (req, res) => {
        if (!req.body.login || !req.body.password) {
            res.sendStatus(204);
            return;
        }

        const Hasher = crypto.createHmac("sha256", process.env.SECRET_TOKEN);
        const password = Hasher.update(req.body.password).digest("hex");

        const user = await prisma.users.findFirst({where: {AND: {login: req.body.login, password}}});

        if (user !== null) {
            const token = generateAccessToken(Number(user.id), req.body.login, user.role);

            const filePath = path.join(__dirname, `../keys/${req.body.login}_private.pem`);
            const privateKey = fs.readFileSync(filePath, 'utf8');

            res.send({
                token,
                privateKey
            });
        } else {
            res.sendStatus(401);
        }
    });

    router.get("/getUserByLogin/:login", authenticateToken, async (req, res) => {
        const user = await prisma.users.findFirst({where: {login: req.params.login}});

        if (user === null) {
            res.sendStatus(400);
            return;
        }

        const info = await prisma.user_infos.findFirst({where: {userId: user.id}});

        if (info === null) {
            res.sendStatus(400);
            return;
        }

        res.send(JSON.stringify(
            Object.assign(info, {
                lastOnline: formatLastSeen(info.lastOnline)
            }), (key, value) => (typeof value === 'bigint' ? value.toString() : value)
        ));
    });

    router.put("/update/:id", authenticateTokenParams, async (req, res) => {
        await prisma.user_infos.update({
            where: {userId: req.params.id},
            data: req.body
        });

        res.sendStatus(200);
    })

    router.put("/online/:id", authenticateTokenParams, async (req, res) => {
        const user = await prisma.user_infos.findFirst({where: {userId: req.params.id}});

        await prisma.user_infos.update({
            where: {userId: req.params.id},
            data: {online: !user.online}
        });

        res.sendStatus(200);
    })

    router.put('/upload/:id', async (req, res) => {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.sendStatus(409);
        }

        if (req.files.avatar.mimetype !== "image/png" && req.files.avatar.mimetype !== "image/jpeg") {
            return res.sendStatus(409);
        }

        const user = await prisma.users.findFirst({where: {id: req.params.id}});

        if (user === null) {
            return res.sendStatus(400);
        }

        const filePath = path.join(__dirname, `../files/${user.login}`);

        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath);
        }

        await req.files.avatar.mv(`${filePath}/avatar.png`, function (err) {
            if (err) return res.status(500).send(err);
        });

        await prisma.user_infos.update({
            where: {userId: user.id},
            data: {
                avatar: `${req.protocol}://${req.get('host')}/files/${user.login}/avatar.png`
            }
        });

        res.sendStatus(200);
    });

    router.get("/search/:login", async (req, res) => {
        const users = await prisma.users.findMany({
            where: {
                login: {
                    startsWith: `${req.params.login}%`
                }
            }
        }, {
            take: 10
        })

        let infos = [];

        for (let el of users) {
            const info = await prisma.user_infos.findFirst({where: {userId: el.id}});

            infos.push({
                name: el.login,
                avatar: info.avatar,
                online: info.online,
                reciever: info.userId,
                lastOnline: formatLastSeen(info.lastOnline)
            });
        }

        res.send(JSON.stringify(
            infos, (key, value) => (typeof value === 'bigint' ? value.toString() : value)
        ));
    });

    router.put("/setRating/:id", authenticateTokenBody, async (req, res) => {
        let rating = 0;

        const ratingReq = await prisma.user_ratings.findFirst({ where: { AND: { profileId: req.params.id, userId: req.body.userId } } });

        if (ratingReq === null) {
            await prisma.user_ratings.create({
                data: {
                    userId: req.body.userId,
                    profileId: req.params.id,
                    rating: req.body.rating
                }
            });
        } else {
            await prisma.user_ratings.update({
                where: { id: ratingReq.id },
                data: { rating: req.body.rating }
            })
        }

        const ratings = await prisma.user_ratings.findMany({ where: { profileId: req.params.id } });
        const ratingsCount = await prisma.user_ratings.count({ where: { profileId: req.params.id } });

        let summ = 0;

        for (el of ratings) {
            summ += el.rating;
        }

        rating = summ / ratingsCount;

        await prisma.user_infos.update({
            where: { userId: req.params.id },
            data: {
                rating
            }
        });

        res.sendStatus(200);
    });

    return router;
}