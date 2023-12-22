import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { get } from 'node:https';
import { join } from 'node:path';

const ROOT = __dirname;
const URL =
	'https://github.com/pocketbase/pocketbase/releases/download/v0.20.1/pocketbase_0.20.1_linux_amd64.zip';
const FILEPATH = join(ROOT, 'pocketbase.zip');

const POCKETBASE_ROOT = join(ROOT, 'pocketbase');
const POCKETBASE_BIN = join(POCKETBASE_ROOT, 'pocketbase');

function download(url: string, filepath: string, success: () => void) {
	function handleError(reason: Error) {
		console.error(reason);
		unlinkSync(filepath);
	}

	const file = createWriteStream(FILEPATH);
	file.on('error', handleError);

	const request = get(url, function callback(response) {
		if ([301, 302].includes(response.statusCode ?? 0)) {
			download(response.headers.location!, filepath, success);
			return;
		}

		if (response.statusCode !== 200) {
			handleError(new Error(`status code: ${response.statusCode}`));
			return;
		}

		response.pipe(file);
	});
	request.on('error', handleError);

	file.on('finish', success);
	request.end();
}

function start() {
	if (!existsSync(POCKETBASE_ROOT)) {
		spawnSync('unzip', ['pocketbase.zip', '-d', 'pocketbase'], { stdio: 'inherit' });
	}

	spawn(POCKETBASE_BIN, ['serve', '--dev'], { stdio: 'inherit' });
}

export function pocketbase() {
	mkdirSync(ROOT, { recursive: true });

	if (existsSync(FILEPATH)) {
		start();
	} else {
		download(URL, FILEPATH, start);
	}
}
