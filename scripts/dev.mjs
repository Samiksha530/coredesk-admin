import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { server } from '../server/server.mjs';

let ui;
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  ui?.kill();
  server.close();
  process.exitCode = code;
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
server.once('error', (error) => {
  console.error('Cannot start API on port 3001:', error.message);
  console.error('Stop any existing npm run api terminal, then retry npm start.');
  stop(1);
});
server.listen(3001, '127.0.0.1', () => {
  console.log('CoreDesk API ready at http://127.0.0.1:3001');
  ui = spawn(
    process.execPath,
    [
      'node_modules/@angular/cli/bin/ng.js',
      'serve',
      '--host',
      '127.0.0.1',
      ...process.argv.slice(2),
    ],
    {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      stdio: 'inherit',
      windowsHide: true,
    },
  );
  ui.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  ui.on('exit', (code) => stop(code ?? 1));
});
