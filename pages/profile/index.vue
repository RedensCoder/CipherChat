<script setup>
import {useRouter} from "vue-router";
import {useAPIStore} from "~/store/APIStore.js";
import {io} from "socket.io-client";
import {jwtDecode} from "jwt-decode";

const API = useAPIStore();
const socket = io(API.URL);

const router = useRouter();

const avaChange = async (e) => {
  const img = e.target.files[0];

  const file = new FormData();
  file.append("avatar", img);

  await API.UserUpdate(file);

  location.reload();
}

const logout = async () => {
  socket.emit('userDisconnect', API.id);

  localStorage.removeItem("token");
  localStorage.removeItem("privatKey");

  await router.push("/signin");
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
  title: `CipherChat - Профиль`
});
</script>

<template>
  <div class="main">
    <Header />
    <div class="profile">
      <div class="profile__profile">
        <div class="profile__info">
          <img class="avatar" :src="API.avatar" alt="avatar">
          <div class="info__info">
            <p class="name">{{ API.username }}</p>
            <p class="online">В сети</p>
          </div>
          <div class="form">
            <input @change="avaChange" type="file" accept="image/png, image/jpg, image/jpeg" id="button" class="input_hidden">
            <label class="change" for="button">Загрузить Новый Аватар</label>
          </div>
        </div>
        <div class="profile__about">
          <div class="rating">
            <div class="stars">
              <svg v-if="API.rating >= 1" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
              <svg v-else-if="API.rating >= 0.1 && API.rating <= 0.9" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3V376.4zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>
              <svg v-else class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
            </div>
            <div class="stars">
              <svg v-if="API.rating >= 2" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
              <svg v-else-if="API.rating >= 1.1 && API.rating <= 1.9" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3V376.4zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>
              <svg v-else class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
            </div>
            <div class="stars">
              <svg v-if="API.rating >= 3" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
              <svg v-else-if="API.rating >= 2.1 && API.rating <= 2.9" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3V376.4zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>
              <svg v-else class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
            </div>
            <div class="stars">
              <svg v-if="API.rating >= 4" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
              <svg v-else-if="API.rating >= 3.1 && API.rating <= 2.9" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3V376.4zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>
              <svg v-else class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
            </div>
            <div class="stars">
              <svg v-if="API.rating >= 5" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/></svg>
              <svg v-else-if="API.rating >= 4.1 && API.rating <= 4.9" class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M288 376.4l.1-.1 26.4 14.1 85.2 45.5-16.5-97.6-4.8-28.7 20.7-20.5 70.1-69.3-96.1-14.2-29.3-4.3-12.9-26.6L288.1 86.9l-.1 .3V376.4zm175.1 98.3c2 12-3 24.2-12.9 31.3s-23 8-33.8 2.3L288.1 439.8 159.8 508.3C149 514 135.9 513.1 126 506s-14.9-19.3-12.9-31.3L137.8 329 33.6 225.9c-8.6-8.5-11.7-21.2-7.9-32.7s13.7-19.9 25.7-21.7L195 150.3 259.4 18c5.4-11 16.5-18 28.8-18s23.4 7 28.8 18l64.3 132.3 143.6 21.2c12 1.8 22 10.2 25.7 21.7s.7 24.2-7.9 32.7L438.5 329l24.6 145.7z"/></svg>
              <svg v-else class="star" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path fill="#17E351" d="M287.9 0c9.2 0 17.6 5.2 21.6 13.5l68.6 141.3 153.2 22.6c9 1.3 16.5 7.6 19.3 16.3s.5 18.1-5.9 24.5L433.6 328.4l26.2 155.6c1.5 9-2.2 18.1-9.7 23.5s-17.3 6-25.3 1.7l-137-73.2L151 509.1c-8.1 4.3-17.9 3.7-25.3-1.7s-11.2-14.5-9.7-23.5l26.2-155.6L31.1 218.2c-6.5-6.4-8.7-15.9-5.9-24.5s10.3-14.9 19.3-16.3l153.2-22.6L266.3 13.5C270.4 5.2 278.7 0 287.9 0zm0 79L235.4 187.2c-3.5 7.1-10.2 12.1-18.1 13.3L99 217.9 184.9 303c5.5 5.5 8.1 13.3 6.8 21L171.4 443.7l105.2-56.2c7.1-3.8 15.6-3.8 22.6 0l105.2 56.2L384.2 324.1c-1.3-7.7 1.2-15.5 6.8-21l85.9-85.1L358.6 200.5c-7.8-1.2-14.6-6.1-18.1-13.3L287.9 79z"/></svg>
            </div>
          </div>
          <div class="about__about">
            <h3>О вас</h3>
            <p>{{ API.about }}</p>
          </div>
        </div>
        <div class="settings">
          <button @click="router.push('/profile/settings')" class="settings__setting">Настройки Профиля</button>
          <button @click="logout" class="logout">Выйти из аккаунта</button>
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

  .avatar {
    width: 100px;
    height: 100px;
    object-fit: cover;
    object-position: center center;
    border-radius: 100px;
  }

  .profile__info {
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    text-align: center;
  }

  .info__info {
    margin-left: 20px;
  }

  .name {
    margin-bottom: 10px;
  }

  .online {
    font-size: 18px;
  }

  .form {
    text-align: center;
  }

  .change {
    text-align: center;
    color: black;
    background: #17E351;
    padding: 5px 20px;
    border-radius: 10px;
    cursor: pointer;
  }

  .change:hover {
    background: #13ab3f;
  }

  .change:active {
    background: #b0b0b0;
  }

  .input_hidden {
    visibility: hidden;
    width: 0;
  }

  .profile__about {
    margin: 20px 0;
    text-align: start;
  }

  .about__about {
    margin-top: 20px;
  }

  .about__about {
    margin-top: 20px;
  }

  .about__about h3 {
    font-size: 25px;
    margin-bottom: 10px;
  }

  .logout {
    background: firebrick;
    color: white;
    border-radius: 10px;
    padding: 5px 35px;
    cursor: pointer;
  }

  .logout:hover {
    background: #8a1c1c;
  }

  .logout:active {
    background: #9d9d9d;
  }

  .settings {
    margin-top: 20px;
    text-align: start;
    display: flex;
    flex-direction: column;
    width: 40%;
  }

  .settings button {
    margin-top: 20px;
  }

  .settings__setting {
    background: #17E351;
    border-radius: 10px;
    padding: 5px 35px;
    cursor: pointer;
  }

  .settings__setting:hover {
    background: #13ab3f;
  }

  .settings__setting:active {
    background: #9d9d9d;
  }

  .rating {
    display: flex;
  }

  .star {
    margin-right: 10px;
    width: 50px;
  }

  /* ===== ADAPTIVE ===== */

  @media (max-width: 1024px) {
    .profile__info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .info__info {
      margin: 10px 0;
    }

    .settings {
      width: 100%;
    }

    .profile {
      width: 100%;
    }

    .profile__profile {
      padding: 0;
      border-radius: 0;
    }
  }

  @media (max-width: 1024px) {
    .settings {
      width: 100%;
    }
  }
</style>