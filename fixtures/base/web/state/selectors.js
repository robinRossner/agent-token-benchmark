/**
 * Tasks of the selected project grouped by status.
 * @param {{tasks: object[]}} state
 * @returns {{todo: object[], in_progress: object[], done: object[]}}
 */
export function selectTasksByStatus(state) {
  const groups = { todo: [], in_progress: [], done: [] };
  for (const task of state.tasks) groups[task.status]?.push(task);
  return groups;
}

/**
 * Users indexed by id for quick lookups when rendering.
 * @param {{users: object[]}} state
 * @returns {Record<string, object>}
 */
export function selectUsersById(state) {
  return Object.fromEntries(state.users.map((user) => [user.id, user]));
}

/**
 * The currently selected project, or null.
 * @param {{projects: object[], selectedProjectId: string|null}} state
 * @returns {object|null}
 */
export function selectSelectedProject(state) {
  return state.projects.find((project) => project.id === state.selectedProjectId) ?? null;
}
