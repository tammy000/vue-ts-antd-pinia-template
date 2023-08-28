// import store from './store'
import './utils/lazy_ui'
import './styles/index.scss'
import 'animate.css';
import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
