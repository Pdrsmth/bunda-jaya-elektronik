// App Main Entry Point

import '../css/main.css';
import '../css/sidebar.css';
import '../css/pos.css';
import '../css/table.css';
import '../css/modal.css';
import '../css/print.css';
import '../css/login.css';

import { initRouter } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
});
