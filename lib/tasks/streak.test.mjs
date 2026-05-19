import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateHouseholdStreak } from './streak.ts';

function task(dueDate, completed) {
  return {
    id: `${dueDate}-${completed ? 'done' : 'open'}-${Math.random()}`,
    taskId: 't',
    householdId: 'h',
    titleSnapshot: 'Task',
    dueDate,
    completedAt: completed ? `${dueDate}T12:00:00.000Z` : undefined,
    createdAt: `${dueDate}T00:00:00.000Z`,
    updatedAt: `${dueDate}T00:00:00.000Z`,
  };
}

test('two completed task days in a row returns streak 2', () => {
  const tasks = [task('2026-05-18', true), task('2026-05-19', true)];
  assert.equal(calculateHouseholdStreak(tasks, new Date('2026-05-19T15:00:00Z')), 2);
});

test('today incomplete returns streak 0', () => {
  const tasks = [task('2026-05-19', false)];
  assert.equal(calculateHouseholdStreak(tasks, new Date('2026-05-19T15:00:00Z')), 0);
});

test('yesterday complete but today incomplete does not show active streak', () => {
  const tasks = [task('2026-05-18', true), task('2026-05-19', false)];
  assert.equal(calculateHouseholdStreak(tasks, new Date('2026-05-19T15:00:00Z')), 0);
});

test('multiple tasks on same day all need completed', () => {
  const tasks = [task('2026-05-19', true), task('2026-05-19', false)];
  assert.equal(calculateHouseholdStreak(tasks, new Date('2026-05-19T15:00:00Z')), 0);
});
