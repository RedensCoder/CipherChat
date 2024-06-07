<script setup>
import {useRouter} from "vue-router";
import {useAPIStore} from "~/store/APIStore.js";
import {io} from "socket.io-client";
import {jwtDecode} from "jwt-decode";

const API = useAPIStore();
const socket = io(API.URL);

const router = useRouter();

const about = ref(API.about);

const save = async () => {
  await API.UpdateInfo({
    about: about.value
  });

  alert("Профиль успешно обновлён!");
}

onMounted(async () => {
  if (localStorage.getItem("token") === null) {
    await router.push("/signin");
  }

  socket.emit('userOnline', JSON.parse(jwtDecode(localStorage.getItem("token")).data.id));
})

onBeforeUnmount(async () => {
  socket.disconnect();
})

useHead({
  title: `CipherChat - Настройки профиля`
});
</script>

<template>
  <div class="main">
    <Header />
    <div class="profile">
      <div class="profile__profile">
        <h3>Настройки Профиля</h3>
        <div class="form">
          <label>О себе</label>
          <textarea v-model="about" rows="3" placeholder="Напишите о себе..."></textarea>
          <button @click="save">Сохранить</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .main {
    height: 100vh;
    background: url("https://i.pinimg.com/originals/e1/69/9c/e1699c982396398139e4fc8c010c90f8.jpg");
  }

  .profile {
    width: 40%;
    margin: 40px auto;
  }

  .profile__profile {
    background: rgba(20, 20, 20, 0.6);
    backdrop-filter: saturate(120%) blur(10px);
    border-radius: 15px;
    padding: 30px;
    color: white;
    text-align: center;
  }

  .profile__profile h3 {
    font-size: 30px;
  }

  .form {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
  }

  .form textarea {
    margin: 20px 0;
    resize: none;
    padding: 5px;
    outline: none;
    background: none;
    color: white;
  }

  .form button {
    background: #17E351;
    border-radius: 10px;
    padding: 5px 35px;
    cursor: pointer;
  }

  .form button:hover {
    background: #13ab3f;
  }

  .form button:active {
    background: #9d9d9d;
  }

  /* ===== ADAPTIVE ===== */

  @media (max-width: 768px) {
    .profile {
      width: 100%;
    }

    .profile__profile {
      border-radius: 0;
      padding: 0;
    }

    .form button {
      width: 60%;
      margin: 0 auto;
    }
  }
</style>