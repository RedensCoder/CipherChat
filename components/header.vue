<script setup>
import {useAPIStore} from "~/store/APIStore.js";
import { io } from 'socket.io-client';

const socket = io('https://redenscoder-cipherchat-ab86.twc1.net');

const API = useAPIStore();

onMounted(async () => {
  if (API.username === "" && localStorage.getItem("token") !== null) {
    await API.Init();
  }

  window.addEventListener('beforeunload', (event) => {
    socket.emit('userDisconnect', API.id);
  });
});

onUnmounted(() => {
  socket.disconnect();
});
</script>

<template>
  <header>
    <NuxtLink to="/"><h1>CipherChat</h1></NuxtLink>
    <NuxtLink to="/profile"><div class="header__profile">
      <img :src="API.avatar" class="avatar" alt="avatar">
      <p class="name">{{ API.username }}</p>
    </div></NuxtLink>
  </header>
</template>

<style scoped>
header {
  color: white;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding-top: 20px;
}

header h1 {
  font-size: 40px;
  font-family: "Dela Gothic One";
}

.header__profile {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.avatar {
  width: 60px;
  height: 60px;
  object-fit: cover;
  object-position: center center;
  border-radius: 100px;
}

.name {
  margin-left: 10px;
}

/* ===== ADAPTIVE ===== */

@media (max-width: 1024px) {
  header h1 {
    font-size: 25px;
  }
}
</style>