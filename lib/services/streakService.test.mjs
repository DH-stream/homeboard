import test from 'node:test';
import assert from 'node:assert/strict';
import { createStreakService } from './streakService.ts';

function setupWindow() {
  const store = new Map();
  global.window = {
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
  };
}

function task(dueDate, completed) {
  return { id: `${dueDate}-${Math.random()}`, taskId: 't', householdId: 'h', titleSnapshot: 'x', dueDate, completedAt: completed ? `${dueDate}T12:00:00Z` : undefined, createdAt: `${dueDate}T00:00:00Z`, updatedAt: `${dueDate}T00:00:00Z` };
}

test('two completed dates in row returns streak 2', async () => {
  setupWindow();
  const svc = createStreakService();
  const hh = 'h1';
  await svc.maybeMarkTodayComplete(hh, [task('2026-05-18', true)]);
  // seed prior day directly for deterministic date window
  window.localStorage.setItem('homeboard.householdTaskDayStatus.v1', JSON.stringify({ [hh]: [{ date: '2026-05-19', completedAt: '2026-05-19T12:00:00Z', completedTaskCount: 1, requiredTaskCount: 1 }, { date: '2026-05-18', completedAt: '2026-05-18T12:00:00Z', completedTaskCount: 1, requiredTaskCount: 1 }] }));
  assert.equal(await svc.getHouseholdTaskStreak(hh, new Date('2026-05-19T16:00:00Z')), 2);
});

test('creating new task after completed day does not remove completed status', async () => {
  setupWindow();
  const svc = createStreakService();
  const hh = 'h2';
  window.localStorage.setItem('homeboard.householdTaskDayStatus.v1', JSON.stringify({ [hh]: [{ date: '2026-05-19', completedAt: '2026-05-19T12:00:00Z', completedTaskCount: 1, requiredTaskCount: 1 }] }));
  await svc.maybeMarkTodayComplete(hh, [task('2026-05-19', true), task('2026-05-19', false)]);
  const days = await svc.listCompletedTaskDays(hh);
  assert.equal(days.length, 1);
  assert.equal(days[0].date, '2026-05-19');
});
