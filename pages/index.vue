<script setup>
import Header from "~/components/header.vue";
import {useRouter} from "vue-router";
import {useAPIStore} from "~/store/APIStore.js";
import {io} from "socket.io-client";
import {jwtDecode} from "jwt-decode";

const INACTIVITY_TIME = 5 * 60 * 1000;
let inactivityTimeout = ref(null);

const setActive = () => {
  clearTimeout(inactivityTimeout.value);
  inactivityTimeout.value = setTimeout(() => socket.emit('userDisconnect', JSON.parse(jwtDecode(localStorage.getItem("token")).data.id)), INACTIVITY_TIME);
};

const API = useAPIStore();

const router = useRouter();

const socket = io('https://redenscoder-cipherchat-ab86.twc1.net');

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
              chats.push(Object.assign(el, {notif: false, chatId: el2.chatId, notification: el2.notification}));
              added = true;
            }
          }
          if (!added) {
            chats.push(Object.assign(el, {notif: false}));
          }
        }
      }
    }
  } else {
    chats.splice(0, chats.length);
    const chatReq2 = await API.GetUserChats();
    if (chatReq2.length > 0) {
      for (let el of chatReq2) {
        if (el.id !== API.id) {
          chats.push(Object.assign(el, {notif: false}));
        }
      }
    }
  }
});

onMounted(async () => {
  if (localStorage.getItem("token") === null) {
    await router.push("/signin");
  }

  width.value = window.innerWidth;

  const req = await API.GetUserChats();

  for (let el of req) {
    chats.push(Object.assign(el, { notif: false }));
  }

  socket.emit('userOnline', JSON.parse(jwtDecode(localStorage.getItem("token")).data.id));

  socket.on('updateOnlineUsers', (user) => {
    for (let el of chats) {
      if (Number(el.reciever) === Number(user.userId)) {
        el.online = user.online;
      }
    }
  });

  const notificationSound = new Audio('notification.ogg');

  socket.on('newMessage', async (message) => {
    for (let el of chats) {
      if (Number(el.reciever) === Number(message.senderId)) {
        if (chatId.value === null) {
          el.notif = true;
          await notificationSound.play();
        }

        for (let el of chats) {
          if (el.id === message.chatId) {
            const req = await API.GetUserChats();
            chats.splice(0, chats.length);
            chats.push(Object.assign(req[i], {notif: false}));
          }
        }
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
    <Header />
    <div class="chats">
      <div class="chats__chats">
        <p class="label">Чаты</p>
        <div class="search">
          <input v-model="search" type="text" placeholder="Введите имя пользователя">
        </div>
        <div class="chats__scroll">
          <div @click="() => { setChat(c); c.notif = false;}" v-for="c in chats" class="chats__chat">
            <img :src="c.avatar" alt="avatar">
            <div :class="c.online ? 'online' : 'offline'"></div>
            <p>{{ c.name }}</p>
            <svg v-if="c.notif && c.notification" class="notification" xmlns="http://www.w3.org/2000/svg" width="25" viewBox="0 0 512 512"><path fill="#17E351" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>
          </div>
        </div>
      </div>
      <Messages v-if="chatId !== null" :chat="chatId" />
    </div>
  </div>
</template>

<style scoped>
.main {
  height: 100vh;
  background: url("https://i.pinimg.com/originals/e1/69/9c/e1699c982396398139e4fc8c010c90f8.jpg");
}

.chats__chats {
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: saturate(120%) blur(10px);
  border-radius: 15px;
  text-align: center;
  padding: 20px;
  width: 15%;
}

.chats__chat {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin-top: 20px;
}

.chats__chat p {
  margin-left: 10px;
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
  width: 90%;
  margin: 40px auto;
}

.label {
  font-size: 25px;
}

.notification {
  margin-left: 10px;
}

.search {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin: 15px 0;
}

.search input {
  font-size: 18px;
  padding: 5px 10px;
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

.online {
  background: #17E351;
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

/* ======= ADAPTIVE ======== */

@media(max-width: 1024px) {
  .chats {
    //display: flex;
    //flex-direction: column;
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