import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { pocketbase } from './pocketbase';

export default defineConfig(({ command }) => {
	if (command === 'serve') {
		pocketbase();
	}

	return {
		plugins: [sveltekit()]
	};
});
