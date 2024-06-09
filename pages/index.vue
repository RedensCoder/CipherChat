<script setup>
import {useRouter} from "vue-router";
import {useAPIStore} from "~/store/APIStore.js";
import {io} from "socket.io-client";
import {jwtDecode} from "jwt-decode";

import Profile from "~/components/profile.vue";

const INACTIVITY_TIME = 5 * 60 * 1000;
let inactivityTimeout = ref(null);

const setActive = () => {
  clearTimeout(inactivityTimeout.value);
  inactivityTimeout.value = setTimeout(() => socket.emit('userDisconnect', JSON.parse(jwtDecode(localStorage.getItem("token")).data.id)), INACTIVITY_TIME);
};

const API = useAPIStore();

const router = useRouter();

const socket = io(API.URL);

const chatId = ref(null);
const chats = reactive([]);

const search = ref("");

const width = ref(0);

const setChat = (chat) => {
  chatId.value = chat;
}

watch(search, async () => {
  if (search.value !== "") {
    chats.splice(0, chats.length);

    const searchReq = await API.Search(search.value);
    const chatReq = await API.GetUserChats();

    if (searchReq.length > 0) {
      for (let el of searchReq) {
        if (Number(el.reciever) !== Number(API.id)) {
          let added = false;
          for (let el2 of chatReq) {
            if (Number(el.reciever) === Number(el2.reciever)) {
              chats.push(Object.assign(el, {chatId: el2.chatId, notification: el2.notification}));
              added = true;
            }
          }
          if (!added) {
            chats.push(el);
          }
        }
      }
    }
  } else {
    chats.splice(0, chats.length);
    const chatReq2 = await API.GetUserChats();
    if (chatReq2.length > 0) {
        chats.push(...chatReq2);
    }
  }
});

onMounted(async () => {
  if (localStorage.getItem("token") === null) {
    await router.push("/signin");
  }

  const init = await API.Init();
  if (init === 0) {
    localStorage.removeItem("token");
    localStorage.removeItem("privateKey")
    await router.push("/signin");
  }

  const notificationSound = new Audio('notification.ogg');

  width.value = window.innerWidth;

  const req = await API.GetUserChats();

  chats.push(...req);

  socket.emit('userOnline', JSON.parse(jwtDecode(localStorage.getItem("token")).data.id));

  socket.on('updateOnlineUsers', (user) => {
    for (let el of chats) {
      if (Number(el.reciever) === Number(user.userId)) {
        el.online = user.online;
      }
    }
  });

  socket.on('newMessage', async (message) => {
    for (let el of chats) {
      if (Number(el.reciever) === Number(message.senderId)) {
        if (chatId.value === null) {
          el.unreadMessagesCount += 1;
          await notificationSound.play();
        }

        for (let el of chats) {
          if (el.id === message.chatId) {
            const req = await API.GetUserChats();
            chats.splice(0, chats.length);
            chats.push(req[chats.indexOf(el)]);
          }
        }
      }
    }
  });

  socket.on("seen", async (message) => {
    for (let el of chats) {
      if (el.reciever === message.senderId) {
        const req = await API.GetAllMessages(el.chatId, 0, el.unreadMessagesCount);
        el.unreadMessagesCount -= req.length;
      }
    }
  });
})

onBeforeUnmount(async () => {
  socket.disconnect();
  clearTimeout(inactivityTimeout.value);
})

useHead({
  title: "CipherChat"
})
</script>

<template>
  <div @mousemove="setActive" @keypress="setActive" @click="setActive" class="main">
    <div class="chats">
      <div class="chats__chats">
        <p class="label">Чаты</p>
        <div class="chats__scroll">
          <div @click="() => { setChat(c); c.notif = false;}" v-for="c in chats" :class="chatId !== null && chatId.chatId === c.chatId ? 'chats__chat active' : 'chats__chat'">
            <img :src="c.avatar" alt="avatar">
            <div :class="c.online ? 'online' : 'offline'"></div>
            <p>{{ c.name }}</p>
            <div v-if="c.notification && c.unreadMessagesCount > 0" class="notification">
              <p>{{ c.unreadMessagesCount }}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="chat__messages">
        <div class="search">
          <input v-model="search" type="text" placeholder="Введите никнейм пользователя, которого хотите найти">
          <NuxtLink to="/profile"><div class="search__profile">
            <img class="avatar" :src="API.avatar" alt="avatar">
            <p>{{ API.username }}</p>
          </div></NuxtLink>
        </div>
        <Messages v-if="chatId !== null" :chat="chatId" />
      </div>
      <Profile v-if="chatId !== null" :chat="chatId" />
    </div>
  </div>
</template>

<style scoped>
.main {
  height: 100vh;
  background: #2F2B42;
}

.chats__chats {
  background: #393251;
  text-align: center;
  padding: 0 20px;
  width: 20%;
  height: 100vh;
}

.label {
  margin-top: 20px;
}

.chats__chat {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 20px;
  text-align: center;
}

.chats__chat img {
  width: 60px;
  height: 60px;
  border-radius: 100px;
  object-fit: cover;
  object-position: center center;
}

.chats {
  display: flex;
  color: white;
  height: 85vh;
  margin: 0 auto;
}

.label {
  font-size: 25px;
}

.notification {
  margin-left: 10px;
  background: #4D7CFE;
  width: 25px;
  height: 25px;
  border-radius: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.notification p {
  font-size: 18px;
}

.search {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 15px 0;
}

.search input {
  background: #393251;
  color: white;
  font-size: 18px;
  padding: 10px;
  border-radius: 10px;
  outline: none;
  width: 70%;
}

.chats__scroll {
  height: 85%;
  overflow-y: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.active {
  background: #574E7A;
  border-radius: 100px;
}

.avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
  object-position: center center;
  border-radius: 100px;
}

.online {
  background: #4D7CFE;
  width: 10px;
  height: 10px;
  border: 1px black solid;
  border-radius: 100px;
  position: relative;
  top: 20px;
  right: 15px;
}

.offline {
  visibility: hidden;
  width: 10px;
  height: 10px;

}

.chat__messages {
  width: 100%;
}

.search__profile {
  display: flex;
  align-items: center;
}

.search__profile p {
  margin-left: 10px;
}

.search__profile img {
  width: 50px;
}

/* ======= ADAPTIVE ======== */

@media(max-width: 1024px) {
  .chats {
    width: 100%;
    margin: 20px 0 0 0;
  }

  .chats__chats {
    width: 100%;
    border-radius: 0;
    height: 100%;
    padding: 20px 0 0 0;
  }

  .chats__scroll {
    height: 70%;
    margin-left: 20px;
  }
}
</style>