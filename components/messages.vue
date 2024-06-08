<script setup>
import {useAPIStore} from "~/store/APIStore.js";
import {io} from "socket.io-client";

const API = useAPIStore();
const socket = io(API.URL);

const props = defineProps(["chat"]);

const messages = reactive([]);
const limit = 8;
let skip = 0;
const loading = ref(false);

const loadMessages = async (initialLoad = false) => {
  if (loading.value) return;
  loading.value = true;

  try {
    if (initialLoad) {
      if (props.chat.count > messages.length) {
        messages.push(...await API.GetAllMessages(props.chat.chatId, skip, limit));
        skip += limit;
        await nextTick();
        const container = divMessages.value;
        container.scrollTop = container.scrollHeight;
      }
    } else {
      if (props.chat.count > messages.length) {
        const container = divMessages.value;
        const previousHeight = container.scrollHeight;
        messages.unshift(...await API.GetAllMessages(props.chat.chatId, skip, limit));
        skip += limit;
        await nextTick();
        container.scrollTop = container.scrollHeight - previousHeight;
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
    skip = 0;
  }
};

const handleScroll = async (event) => {
  const container = event.target;
  if (container.scrollTop === 0) {
    await loadMessages();
  }
};

const divMessages = ref(null);

const message = ref("");

const notification = async () => {
  await API.Notification(props.chat.chatId);
  props.chat.notification = !props.chat.notification;
}

const send = async () => {
  await API.Send(message.value, props.chat.chatId, props.chat.reciever);
  message.value = "";
}

const seen = async (id, isSeen) => {
  if (!isSeen) {
    await API.Seen(id);
  }
}

watch(() => props.chat.chatId, async () => {
  if (props.chat.chatId !== 0) {
    messages.splice(0, messages.length);
    await loadMessages(true);
  } else {
    messages.splice(0, messages.length);
  }
});

onMounted(async () => {
  await loadMessages(true);

  await nextTick();

  const container = divMessages.value;
  if (container) {
    container.scrollTop = container.scrollHeight;
  }

  socket.on("seen", async (message) => {
    messages.map(el => el.id === message.id ? el.seen = true : el);
  });

  socket.on('newMessage', async (message) => {
    const container = divMessages.value;
    let scroll = false;

    if (container.scrollTop === container.scrollHeight) {
      scroll = true;
    }

    messages.push(message);

    if (message.senderId === API.id) {
      await nextTick();

      if (scroll === true) {
        container.scrollTop = container.scrollHeight;
      }
    }
  });
})

onBeforeUnmount(() => {
  socket.disconnect();
})
</script>

<template>
  <div class="messages">
    <div ref="divMessages" @scroll="handleScroll" class="messages__messages">
      <div v-for="m in messages" :key="m.id" v-observe-visibility="Number(m.recieverId) === API.id ? seen(m.id, m.seen) : null" :class="Number(m.senderId) === API.id ? 'sender' : 'reciever'">
        <div class="message">
          <p class="content">{{ m.content }}</p>
          <div class="seen">
            <svg v-if="m.seen && Number(m.senderId) === API.id" width="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
            <p class="date">{{ m.date }}</p>
            <svg v-if="m.seen && Number(m.senderId) !== API.id" width="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/></svg>
          </div>
        </div>
      </div>
    </div>
    <div class="form">
      <textarea v-model="message" placeholder="Введите сообщение" rows="2"></textarea>
      <svg v-if="message.length > 0" width="40" class="send_button" @click="send" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#eeab77" d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>
      <svg v-else class="send_button" width="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="#eeab77" d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"/></svg>
    </div>
  </div>
<!--  <div class="user">-->
<!--    <NuxtLink :to="props.chat.name"><div class="user__user">-->
<!--      <img :src="props.chat.avatar" alt="avatar">-->
<!--      <div class="user__info">-->
<!--        <p class="label">{{ props.chat.name }}</p>-->
<!--        <p class="online">{{ props.chat.online ? "В сети" : props.chat.lastOnline }}</p>-->
<!--      </div>-->
<!--    </div></NuxtLink>-->
<!--    <svg @click="notification" v-if="props.chat.notification === true && props.chat.notification !== undefined" style="cursor:pointer;" width="30" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path fill="#FFFFFF" d="M224 0c-17.7 0-32 14.3-32 32V51.2C119 66 64 130.6 64 208v18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416H416c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3H224 160c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/></svg>-->
<!--    <svg @click="notification" v-else-if="props.chat.notification !== undefined" style="cursor:pointer;" width="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path fill="#FFFFFF" d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7l-90.2-70.7c.2-.4 .4-.9 .6-1.3c5.2-11.5 3.1-25-5.3-34.4l-7.4-8.3C497.3 319.2 480 273.9 480 226.8V208c0-77.4-55-142-128-156.8V32c0-17.7-14.3-32-32-32s-32 14.3-32 32V51.2c-42.6 8.6-79 34.2-102 69.3L38.8 5.1zM406.2 416L160 222.1v4.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S115.4 416 128 416H406.2zm-40.9 77.3c12-12 18.7-28.3 18.7-45.3H320 256c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z"/></svg>-->
<!--  </div>-->
</template>

<style scoped>
.messages {
  color: white;
  padding: 0 20px;
  text-align: center;
}

.label {
  font-size: 25px;
}

.form {
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 10px;
  width: 63vw;
}

.form textarea {
  resize: none;
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  outline: none;
  background: #393251;
  color: white;
}

.message {
  background: #4D7CFE;
  color: white;
  margin-top: 10px;
  border-radius: 15px;
  padding: 10px;
  width: 20%;
  word-break: break-word;
}

.messages__messages {
  height: 100%;
  max-height: 850px;
  overflow-y: scroll;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sender {
  text-align: right;
  display: flex;
  justify-content: right;
  align-items: end;
}

.reciever {
  text-align: left;
  display: flex;
  justify-content: left;
  align-items: end;
}

.date {
  padding-top: 10px;
  font-size: 15px;
  color: rgba(0, 0, 0, 0.65);
}

.seen {
  display: flex;
  justify-content: space-between;
}

.user {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 15px auto;
  text-align: start;
}

.user__info {
  margin-left: 10px;
}

.user img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  object-position: center center;
  border-radius: 100px;
}

.user__user {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.send_button {
  margin-left: 20px;
  cursor: pointer;
}

/* ===== ADAPTIVE ===== */

@media (max-width: 1024px) {
  .messages {
    width: 150%;
    border-radius: 0;
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .user img {
    width: 50px;
    height: 50px;
    object-fit: cover;
    object-position: center center;
  }

  .label {
    font-size: 17px;
  }

  .online {
    font-size: 15px;
  }

  .messages {
    width: 160%;
    border-radius: 0;
    margin-left: 0;
    padding: 0;
  }

  .message {
    width: 40%;
  }

  .content {
    font-size: 17px;
  }

  .date {
    font-size: 10px;
  }
}

@media(max-width: 1024px) {
  .messages {
    width: 170%;
  }

  .form textarea {
    font-size: 17px;
  }

  .inactive {
    font-size: 17px;
    padding: 4px;
  }

  .form .active {
    font-size: 17px;
    padding: 4px;
  }
}
</style>