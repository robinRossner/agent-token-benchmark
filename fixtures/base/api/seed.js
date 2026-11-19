const USER_NAMES = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Alan Turing'];
const ROLES = ['admin', 'member', 'member', 'member', 'viewer'];

const PROJECTS = [
  ['Website Redesign', 'Refresh the marketing site and docs.'],
  ['Mobile App', 'Native clients for iOS and Android.'],
  ['Data Pipeline', 'Nightly ETL and reporting jobs.'],
  ['Internal Tools', 'Admin dashboards and support tooling.'],
];

const VERBS = ['Design', 'Implement', 'Review', 'Fix', 'Document', 'Refactor', 'Test', 'Deploy', 'Plan', 'Audit'];
const NOUNS = [
  'login flow', 'search index', 'billing page', 'email templates', 'cache layer', 'export job',
  'onboarding wizard', 'audit log', 'permissions model', 'dashboard widgets', 'sync worker', 'landing page',
];
const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const BASE_TIME = Date.parse('2026-02-01T09:00:00.000Z');
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * Build the deterministic seed dataset: 5 users, 4 projects, 60 tasks, 30 comments.
 * No randomness and no wall-clock time, so every run produces identical data.
 * @returns {{users: object[], projects: object[], tasks: object[], comments: object[]}}
 */
export function buildSeed() {
  const users = USER_NAMES.map((name, index) => ({
    id: `u_${index + 1}`,
    name,
    email: `${name.split(' ')[0].toLowerCase()}@taskflow.test`,
    role: ROLES[index],
  }));

  const projects = PROJECTS.map(([name, description], index) => ({
    id: `p_${index + 1}`,
    name,
    description,
    ownerId: users[index % users.length].id,
    archived: false,
    createdAt: new Date(BASE_TIME + index * DAY).toISOString(),
  }));

  const tasks = [];
  for (let n = 1; n <= 60; n += 1) {
    const created = BASE_TIME + n * HOUR;
    tasks.push({
      id: `t_${n}`,
      projectId: projects[(n * 3) % projects.length].id,
      title: `${VERBS[n % VERBS.length]} ${NOUNS[(n * 5) % NOUNS.length]}`,
      description: `Seeded task number ${n}.`,
      status: STATUSES[(n * 5 + (n >> 3)) % 3],
      priority: PRIORITIES[(n * 5) % 7 % 3],
      assigneeId: n % 7 === 0 ? null : users[n % users.length].id,
      dueDate: n % 9 === 0 ? null : new Date(BASE_TIME + (14 + ((n * 11) % 45)) * DAY).toISOString(),
      createdAt: new Date(created).toISOString(),
      updatedAt: new Date(created).toISOString(),
    });
  }

  const comments = [];
  for (let n = 1; n <= 30; n += 1) {
    comments.push({
      id: `c_${n}`,
      taskId: `t_${(n * 2) % 60 + 1}`,
      authorId: users[(n * 3) % users.length].id,
      body: `Comment ${n}: looks good, please follow up.`,
      createdAt: new Date(BASE_TIME + 100 * HOUR + n * HOUR).toISOString(),
    });
  }

  return { users, projects, tasks, comments };
}
