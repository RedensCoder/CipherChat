// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: [
    '@/public/global.css',
  ],
  plugins: [
    '~/plugins/observeVisibility.js'
  ]
})
