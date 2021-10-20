import App from './App.svelte';
import { setTheme } from './theme.js';

setTheme();

const app = new App({
	target: document.body,
});

export default app;