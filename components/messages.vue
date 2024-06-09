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