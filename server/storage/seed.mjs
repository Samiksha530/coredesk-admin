import { randomUUID } from 'node:crypto';
const names = [
  'Alex Morgan',
  'Sarah Kim',
  'James Wilson',
  'Emma Davis',
  'Oliver Chen',
  'Priya Sharma',
  'Noah Williams',
  'Mia Johnson',
  'Liam Patel',
  'Sophia Brown',
  'Ethan Miller',
  'Ava Garcia',
  'Lucas Martin',
  'Isabella Lee',
  'Mason Clark',
  'Amelia Lewis',
  'Logan Walker',
  'Harper Hall',
  'Elijah Young',
  'Charlotte Allen',
  'Henry King',
  'Evelyn Wright',
  'Daniel Scott',
  'Grace Green',
];
export const seed = {
  users: names.map((name, i) => ({
    id: String(i + 1),
    name,
    email:
      i === 0 ? 'admin@coredesk.demo' : name.toLowerCase().replace(' ', '.') + '@coredesk.demo',
    role: i === 0 ? 'Admin' : i % 5 === 0 ? 'Manager' : 'Viewer',
    status: i % 7 === 5 ? 'Invited' : i % 11 === 8 ? 'Suspended' : 'Active',
    department: ['Engineering', 'Design', 'Marketing', 'Operations'][i % 4],
    joined: `2026-${String(3 + (i % 8)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}`,
  })),
  audit: [
    {
      id: randomUUID(),
      action: 'Workspace created',
      actor: 'System',
      date: new Date().toISOString(),
    },
  ],
};
