import pg from 'pg';
import { seed } from './seed.mjs';
export async function createPostgresRepository(connectionString) {
  const pool = new pg.Pool({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
    allowExitOnIdle: true,
  });
  pool.on('error', (error) => console.error('Database pool error:', error.code));
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialize first-time migrations across concurrent function instances.
    await client.query('SELECT pg_advisory_xact_lock(731402)');
    await client.query(`CREATE TABLE IF NOT EXISTS coredesk_users (id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,payload JSONB NOT NULL);
   CREATE TABLE IF NOT EXISTS coredesk_audit (id TEXT PRIMARY KEY,created_at TIMESTAMPTZ NOT NULL,payload JSONB NOT NULL);
   CREATE TABLE IF NOT EXISTS coredesk_sessions (id TEXT PRIMARY KEY,refresh_hash TEXT NOT NULL UNIQUE,expires_at TIMESTAMPTZ NOT NULL,payload JSONB NOT NULL);
   CREATE TABLE IF NOT EXISTS coredesk_migrations (version INTEGER PRIMARY KEY);`);
    const migration = await client.query(
      'INSERT INTO coredesk_migrations(version) VALUES(1) ON CONFLICT DO NOTHING RETURNING version',
    );
    if (migration.rowCount) {
      for (const user of seed.users)
        await client.query(
          'INSERT INTO coredesk_users(id,email,payload) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
          [user.id, user.email, JSON.stringify(user)],
        );
      for (const event of seed.audit)
        await client.query(
          'INSERT INTO coredesk_audit(id,created_at,payload) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',
          [event.id, event.date, JSON.stringify(event)],
        );
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  return {
    async listUsers() {
      return (
        await pool.query('SELECT payload FROM coredesk_users ORDER BY length(id),id')
      ).rows.map((row) => row.payload);
    },
    async getUser(id) {
      return (await pool.query('SELECT payload FROM coredesk_users WHERE id=$1', [id])).rows[0]
        ?.payload;
    },
    async saveUser(user) {
      await pool.query(
        'INSERT INTO coredesk_users(id,email,payload) VALUES($1,$2,$3) ON CONFLICT(id) DO UPDATE SET email=EXCLUDED.email,payload=EXCLUDED.payload',
        [user.id, user.email, JSON.stringify(user)],
      );
      return user;
    },
    async deleteUser(id) {
      await pool.query('DELETE FROM coredesk_users WHERE id=$1', [id]);
    },
    async listAudit() {
      return (
        await pool.query('SELECT payload FROM coredesk_audit ORDER BY created_at DESC LIMIT 100')
      ).rows.map((row) => row.payload);
    },
    async appendAudit(event) {
      await pool.query('INSERT INTO coredesk_audit(id,created_at,payload) VALUES($1,$2,$3)', [
        event.id,
        event.date,
        JSON.stringify(event),
      ]);
      await pool.query(
        'DELETE FROM coredesk_audit WHERE id IN (SELECT id FROM coredesk_audit ORDER BY created_at DESC OFFSET 100)',
      );
    },
    async createSession(session) {
      await pool.query('DELETE FROM coredesk_sessions WHERE expires_at<=NOW()');
      await pool.query(
        'INSERT INTO coredesk_sessions(id,refresh_hash,expires_at,payload) VALUES($1,$2,$3,$4)',
        [session.id, session.refreshHash, new Date(session.expires), JSON.stringify(session)],
      );
    },
    async getSession(id) {
      return (
        await pool.query('SELECT payload FROM coredesk_sessions WHERE id=$1 AND expires_at>NOW()', [
          id,
        ])
      ).rows[0]?.payload;
    },
    async findSession(hash) {
      return (
        await pool.query(
          'SELECT payload FROM coredesk_sessions WHERE refresh_hash=$1 AND expires_at>NOW()',
          [hash],
        )
      ).rows[0]?.payload;
    },
    async rotateSession(id, oldHash, newHash) {
      const result = await pool.query(
        "UPDATE coredesk_sessions SET refresh_hash=$3,payload=jsonb_set(payload,'{refreshHash}',to_jsonb($3::text)) WHERE id=$1 AND refresh_hash=$2 AND expires_at>NOW() RETURNING id",
        [id, oldHash, newHash],
      );
      return result.rowCount === 1;
    },
    async deleteSession(id) {
      await pool.query('DELETE FROM coredesk_sessions WHERE id=$1', [id]);
    },
  };
}
