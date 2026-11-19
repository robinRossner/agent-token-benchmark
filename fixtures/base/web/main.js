import { createApiClient } from './api-client.js';
import { createStore } from './state/store.js';
import { selectSelectedProject, selectUsersById } from './state/selectors.js';
import { DEFAULT_API_BASE } from './lib/constants.js';
import { loadPreference, savePreference } from './lib/utils.js';
import { escapeHtml } from './lib/escape.js';
import { renderProjectList } from './components/project-list.js';
import { renderTaskBoard } from './components/task-board.js';
import { renderPager } from './components/pager.js';
import { renderErrorBanner } from './components/banner.js';

const client = createApiClient({ baseUrl: globalThis.TF_API_BASE ?? DEFAULT_API_BASE });
const root = document.getElementById('app');

const store = createStore({
  projects: [],
  users: [],
  tasks: [],
  selectedProjectId: loadPreference('selectedProjectId', null),
  page: 1,
  totalPages: 1,
  loading: true,
  error: null,
});

/**
 * Paint the whole page from the current state.
 * @param {object} state
 */
function render(state) {
  const project = selectSelectedProject(state);
  const board = state.loading
    ? '<p class="tf-loading">Loading...</p>'
    : renderTaskBoard(state, { usersById: selectUsersById(state), now: Date.now() });
  root.innerHTML = [
    renderErrorBanner(state.error),
    '<aside class="tf-sidebar"><h1 class="tf-logo">TaskFlow</h1>',
    renderProjectList(state),
    '</aside>',
    '<main class="tf-main">',
    `<h2 class="tf-main__title">${escapeHtml(project?.name ?? 'Select a project')}</h2>`,
    project ? board : '',
    project ? renderPager(state) : '',
    '</main>',
  ].join('');
}

/** Load the tasks for the selected project and page. */
async function loadTasks() {
  const { selectedProjectId, page } = store.getState();
  if (!selectedProjectId) return;
  store.setState({ loading: true, error: null });
  try {
    const result = await client.listTasks({ projectId: selectedProjectId, page, pageSize: 12 });
    store.setState({ tasks: result.data, page: result.meta.page, totalPages: result.meta.totalPages, loading: false });
  } catch (err) {
    store.setState({ loading: false, error: err.message });
  }
}

root.addEventListener('click', (event) => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const { page, totalPages } = store.getState();
  if (target.dataset.action === 'select-project') {
    savePreference('selectedProjectId', target.dataset.projectId);
    store.setState({ selectedProjectId: target.dataset.projectId, page: 1 });
    loadTasks();
  } else if (target.dataset.action === 'next-page' && page < totalPages) {
    store.setState({ page: page + 1 });
    loadTasks();
  } else if (target.dataset.action === 'prev-page' && page > 1) {
    store.setState({ page: page - 1 });
    loadTasks();
  }
});

store.subscribe(render);

/** Boot: fetch reference data, then tasks for the remembered project. */
async function start() {
  try {
    const [projects, users] = await Promise.all([client.listProjects(), client.listUsers()]);
    store.setState({ projects, users, loading: false });
    await loadTasks();
  } catch (err) {
    store.setState({ loading: false, error: `Cannot reach the API: ${err.message}` });
  }
}

start();
