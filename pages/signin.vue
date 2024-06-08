<script setup>
import {useAPIStore} from "~/store/APIStore.js";
import {useRouter} from "vue-router"

const router = useRouter();

const API = useAPIStore();

const login = ref("");
const password = ref("");
const error = ref("");

const auth = async () => {
  if (login.value.trim() === "" || password.value.trim() === "") {
    return error.value = "Вы ввели не все данные!"
  }

  const auth = await API.Auth(login.value.trim(), password.value.trim());

  if (auth !== 1) {
    error.value = auth;
  } else {
    await router.push("/");
  }
}

onMounted(() => {
  if (localStorage.getItem("token") !== null) {
    router.push("/");
  }
})

useHead({
  title: "CipherChat - Авторизация"
})
</script>

<template>
  <div class="main">
    <h3>Авторизация</h3>
    <div class="form">
      <input v-model="login" type="text" placeholder="Введите ваш логин">
      <input v-model="password" type="password" placeholder="Введите ваш пароль">
      <p>У вас нет аккаунта? <NuxtLink to="/signup">Регистрация!</NuxtLink></p>
      <button @click="auth">Авторизация</button>
      <p class="error">{{error}}</p>
    </div>
  </div>
</template>

<style scoped>
  .main {
    height: 100vh;
    background: #2F2B42;
    color: white;
    display: flex;
    justify-content: center;
    flex-direction: column;
  }

  h3 {
    text-align: center;
    font-size: 40px;
  }

  .form {
    width: 20%;
    margin: 30px auto;
    text-align: center;
  }

  .form input {
    width: 100%;
    display: flex;
    flex-direction: column;
    margin-top: 20px;
    padding: 5px;
    border-radius: 10px;
    outline: none;
  }

  .form p {
    margin: 20px;
  }

  .form a {
    color: #4D7CFE;
  }

  .form button {
    background: #4D7CFE;
    border-radius: 10px;
    padding: 5px 35px;
    cursor: pointer;
  }

  /* ======= ADAPTIVE ====== */

  @media(max-width: 1440px) {
    .form {
      width: 30%;
    }
  }

  @media(max-width: 425px) {
    * {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .form {
      width: 100%;
    }

    .form input {
      width: 80%;
    }
  }
</style>