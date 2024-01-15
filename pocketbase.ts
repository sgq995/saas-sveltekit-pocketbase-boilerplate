import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { get } from 'node:https';
import { arch, platform } from 'node:os';
import { join } from 'node:path';

const OS_MAP: Record<string, string> = {
	linux: 'linux',
	darwin: 'darwin',
	win32: 'windows'
};

const ARCH_MAP: Record<string, string> = {
	arm: 'arm64',
	arm64: 'arm64',
	x64: 'amd64'
};

const ROOT = __dirname;
const VERSION = '0.20.6';
const OS = OS_MAP[platform()] || 'unknown';
const ARCH = ARCH_MAP[arch()] || 'unknown';
const URL = `https://github.com/pocketbase/pocketbase/releases/download/v${VERSION}/pocketbase_${VERSION}_${OS}_${ARCH}.zip`;
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
	if (!existsSync(POCKETBASE_BIN)) {
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
