import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { seed } from './seed.mjs';
export async function createLocalRepository() {
  const directory = process.env.COREDESK_DATA_DIR
    ? pathToFileURL(resolve(process.env.COREDESK_DATA_DIR) + '/')
    : new URL('../data/', import.meta.url);
  await mkdir(directory, { recursive: true });
  const file = new URL('db.json', directory);
  let data;
  try {
    data = JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    data = structuredClone(seed);
    await writeFile(file, JSON.stringify(data, null, 2));
  }
  let pending = Promise.resolve();
  const persist = () => {
    const snapshot = JSON.stringify(data, null, 2);
    const write = pending.then(() => writeFile(file, snapshot));
    pending = write.catch(() => {});
    return write;
  };
  const sessions = new Map();
  return {
    async listUsers() {
      return structuredClone(data.users);
    },
    async getUser(id) {
      return structuredClone(data.users.find((user) => user.id === id));
    },
    async saveUser(user) {
      if (
        data.users.some((value) => value.email.toLowerCase() === user.email && value.id !== user.id)
      ) {
        const error = new Error('A member with this email already exists.');
        error.code = '23505';
        throw error;
      }
      const existing = data.users.findIndex((value) => value.id === user.id);
      if (existing < 0) data.users.push(user);
      else data.users[existing] = user;
      await persist();
      return user;
    },
    async deleteUser(id) {
      data.users = data.users.filter((user) => user.id !== id);
      await persist();
    },
    async listAudit() {
      return structuredClone(data.audit);
    },
    async appendAudit(event) {
      data.audit.unshift(event);
      data.audit = data.audit.slice(0, 100);
      await persist();
    },
    async createSession(session) {
      sessions.set(session.id, structuredClone(session));
    },
    async getSession(id) {
      return structuredClone(sessions.get(id));
    },
    async findSession(hash) {
      return structuredClone(
        [...sessions.values()].find(
          (value) => value.refreshHash === hash && value.expires > Date.now(),
        ),
      );
    },
    async rotateSession(id, oldHash, newHash) {
      const session = sessions.get(id);
      if (!session || session.refreshHash !== oldHash || session.expires <= Date.now())
        return false;
      session.refreshHash = newHash;
      return true;
    },
    async deleteSession(id) {
      sessions.delete(id);
    },
  };
}
