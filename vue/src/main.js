import { createApp } from 'vue';
import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js'

import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

createApp(App).use(Toast).mount('#app');
