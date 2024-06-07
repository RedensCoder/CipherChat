import {defineStore} from "pinia";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

const URL = "https://redenscoder-cipherchat-ab86.twc1.net";

export const useAPIStore = defineStore("API", {
    state: () => { return {
        id: 0,
        username: "",
        avatar: "",
        rating: "5.0",
        about: "",
        token: "",
        privateKey: ""
    }},
    actions: {
        async Init() {
            const user = await this.GetUser(jwtDecode(localStorage.getItem("token")).data.login);

            this.id = jwtDecode(localStorage.getItem("token")).data.id;
            this.username = jwtDecode(localStorage.getItem("token")).data.login;
            this.avatar = user.avatar;
            this.about = user.about;
            this.rating = user.rating;
            this.token = localStorage.getItem("token");
            this.privateKey = localStorage.getItem("privateKey");
        },
        async Register(login, password) {
            try {
                const req = await axios.post(`${URL}/user/create`, {
                    login,
                    password
                });

                localStorage.setItem("token", req.data.token);
                localStorage.setItem("privateKey", req.data.privateKey);

                await this.Init();

                return 1;
            } catch(e) {
                return "Пользователь с таким именем уже есть!"
            }
        },
        async Auth(login, password) {
            try {
                const req = await axios.post(`${URL}/user/auth`, {
                    login,
                    password
                });

                localStorage.setItem("token", req.data.token);
                localStorage.setItem("privateKey", req.data.privateKey);

                await this.Init();

                return 1;
            } catch(e) {
                return "Пользователь не найден!"
            }
        },
        async GetUser(login) {
            const user = await axios.get(`${URL}/user/getUserByLogin/${login}`, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });

            return user.data;
        },
        async Search(login) {
          const users = await axios.get(`${URL}/user/search/${login}`);
          return users.data;
        },
        async UserUpdate(file) {
            await axios.put(`${URL}/user/upload/${this.id}`, file, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
        },
        async UpdateInfo(info) {
            await axios.put(`${URL}/user/update/${this.id}`, info, {
                headers: {
                  Authorization: localStorage.getItem(("token"))
                }
            });
        },
        async SetRating(rating, id) {
          await axios.put(`${URL}/user/setRating/${id}`, {
              userId: this.id,
              rating
          }, {
              headers: {
                  Authorization: localStorage.getItem(("token"))
              }
          });
        },
        // CHATS
        async GetUserChats() {
            const user = jwtDecode(localStorage.getItem("token"));
            const req = await axios.get(`${URL}/chat/getChatUsersByUserId/${user.data.id}`, {
                headers: {
                    Authorization: localStorage.getItem(("token"))
                }
            });

            return req.data;
        },
        async GetAllMessages(chatId, skip, limit) {
            const req = await axios.post(`${URL}/message/getAllMessages/${chatId}`, {
                privateKey: localStorage.getItem("privateKey"),
                skip: skip,
                take: limit
            }, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
            return req.data;
        },
        async Send(message, chat, reciever) {
            if (chat === 0 || chat === undefined) {
                const req = await axios.post(`${URL}/chat/create`, {
                    userId: this.id,
                    secondUserId: reciever
                }, {
                    headers: {
                        Authorization: localStorage.getItem("token")
                    }
                });

                const newChat = req.data.id;

                await axios.post(`${URL}/message/send`, {
                    chat: newChat,
                    reciever,
                    sender: this.id,
                    content: message
                }, {
                    headers: {
                        Authorization: localStorage.getItem("token")
                    }
                });
            } else {
                await axios.post(`${URL}/message/send`, {
                    chat,
                    reciever,
                    sender: this.id,
                    content: message
                }, {
                    headers: {
                        Authorization: localStorage.getItem("token")
                    }
                });
            }
        },
        async Seen(id) {
            await axios.put(`${URL}/message/seen/${id}`, {}, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
        },
        async Notification(id) {
            await axios.put(`${URL}/chat/notification/${id}`, {
                userId: this.id
            }, {
                headers: {
                    Authorization: localStorage.getItem("token")
                }
            });
        }
    }
});