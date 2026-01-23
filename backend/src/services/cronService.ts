// CSR26 Cron Service
// Handles scheduled tasks: monthly billing, maturation processing, Corsair export
// Can be triggered via API endpoint or external cron scheduler

import { runMonthlyBilling } from './billingService.js';
import { processMaturedImpacts } from './calculationService.js';
import { exportPendingCertifiedUsers } from './corsairService.js';

// ============================================
// CRON TASK RESULTS
// ============================================

export interface CronTaskResult {
  task: string;
  success: boolean;
  startedAt: string;
  completedAt: string;
  result?: unknown;
  error?: string;
}

export interface CronRunResult {
  runId: string;
  startedAt: string;
  completedAt: string;
  tasksRun: number;
  tasksSucceeded: number;
  tasksFailed: number;
  results: CronTaskResult[];
}

// ============================================
// DAILY TASKS
// ============================================

// Process matured impacts - should run daily
export const runDailyMaturation = async (): Promise<CronTaskResult> => {
  const startedAt = new Date().toISOString();
  try {
    const result = await processMaturedImpacts();
    return {
      task: 'daily-maturation',
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      result,
    };
  } catch (error) {
    return {
      task: 'daily-maturation',
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================
// MONTHLY TASKS
// ============================================

// Run monthly billing - should run on 1st of each month
export const runMonthlyBillingTask = async (): Promise<CronTaskResult> => {
  const startedAt = new Date().toISOString();
  try {
    const result = await runMonthlyBilling();
    return {
      task: 'monthly-billing',
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      result,
    };
  } catch (error) {
    return {
      task: 'monthly-billing',
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Export certified users to Corsair - should run monthly
export const runMonthlyCorsairExport = async (): Promise<CronTaskResult> => {
  const startedAt = new Date().toISOString();
  try {
    const result = await exportPendingCertifiedUsers();
    return {
      task: 'monthly-corsair-export',
      success: true,
      startedAt,
      completedAt: new Date().toISOString(),
      result,
    };
  } catch (error) {
    return {
      task: 'monthly-corsair-export',
      success: false,
      startedAt,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ============================================
// COMBINED RUNNERS
// ============================================

// Run all daily tasks
export const runDailyTasks = async (): Promise<CronRunResult> => {
  const runId = `daily-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const results: CronTaskResult[] = [];

  // Run maturation processing
  results.push(await runDailyMaturation());

  const tasksSucceeded = results.filter(r => r.success).length;

  return {
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    tasksRun: results.length,
    tasksSucceeded,
    tasksFailed: results.length - tasksSucceeded,
    results,
  };
};

// Run all monthly tasks
export const runMonthlyTasks = async (): Promise<CronRunResult> => {
  const runId = `monthly-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const results: CronTaskResult[] = [];

  // Run monthly billing
  results.push(await runMonthlyBillingTask());

  // Run Corsair export
  results.push(await runMonthlyCorsairExport());

  const tasksSucceeded = results.filter(r => r.success).length;

  return {
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    tasksRun: results.length,
    tasksSucceeded,
    tasksFailed: results.length - tasksSucceeded,
    results,
  };
};

// Run all cron tasks (for testing or manual trigger)
export const runAllTasks = async (): Promise<CronRunResult> => {
  const runId = `all-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const results: CronTaskResult[] = [];

  // Daily tasks
  results.push(await runDailyMaturation());

  // Monthly tasks
  results.push(await runMonthlyBillingTask());
  results.push(await runMonthlyCorsairExport());

  const tasksSucceeded = results.filter(r => r.success).length;

  return {
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    tasksRun: results.length,
    tasksSucceeded,
    tasksFailed: results.length - tasksSucceeded,
    results,
  };
};
