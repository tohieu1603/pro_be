/**
 * Transaction Manager
 * Provides atomic operations with commit/rollback support
 */

import { DataSource, QueryRunner, EntityManager } from "typeorm";
import { AppDataSource } from "../data-source";

export interface TransactionContext {
  manager: EntityManager;
  queryRunner: QueryRunner;
}

export type TransactionCallback<T> = (context: TransactionContext) => Promise<T>;

/**
 * Transaction Manager class for handling database transactions
 */
export class TransactionManager {
  private dataSource: DataSource;

  constructor(dataSource?: DataSource) {
    this.dataSource = dataSource || AppDataSource;
  }

  /**
   * Execute operations within a transaction
   * Automatically commits on success and rolls back on error
   */
  async runInTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await callback({
        manager: queryRunner.manager,
        queryRunner,
      });

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Execute with specific isolation level
   */
  async runWithIsolation<T>(
    isolationLevel:
      | "READ UNCOMMITTED"
      | "READ COMMITTED"
      | "REPEATABLE READ"
      | "SERIALIZABLE",
    callback: TransactionCallback<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(isolationLevel);

    try {
      const result = await callback({
        manager: queryRunner.manager,
        queryRunner,
      });

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Execute multiple operations atomically
   */
  async runBatch<T>(
    operations: Array<(context: TransactionContext) => Promise<T>>
  ): Promise<T[]> {
    return this.runInTransaction(async (context) => {
      const results: T[] = [];
      for (const operation of operations) {
        results.push(await operation(context));
      }
      return results;
    });
  }

  /**
   * Execute with retry on deadlock or serialization failures
   */
  async runWithRetry<T>(
    callback: TransactionCallback<T>,
    maxRetries = 3,
    delayMs = 100
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.runInTransaction(callback);
      } catch (error: any) {
        lastError = error;

        // Check if it's a retryable error (deadlock, serialization failure)
        const isRetryable =
          error.code === "40001" || // Serialization failure
          error.code === "40P01" || // Deadlock
          error.message?.includes("deadlock") ||
          error.message?.includes("could not serialize");

        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff
        await this.delay(delayMs * Math.pow(2, attempt - 1));
      }
    }

    throw lastError;
  }

  /**
   * Create a savepoint within a transaction
   */
  async withSavepoint<T>(
    context: TransactionContext,
    name: string,
    callback: () => Promise<T>
  ): Promise<T> {
    await context.queryRunner.query(`SAVEPOINT ${name}`);

    try {
      const result = await callback();
      await context.queryRunner.query(`RELEASE SAVEPOINT ${name}`);
      return result;
    } catch (error) {
      await context.queryRunner.query(`ROLLBACK TO SAVEPOINT ${name}`);
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const transactionManager = new TransactionManager();

/**
 * Decorator for transactional methods
 * Usage: @Transactional()
 */
export function Transactional() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return transactionManager.runInTransaction(async (context) => {
        // Inject transaction context as last argument
        return originalMethod.apply(this, [...args, context]);
      });
    };

    return descriptor;
  };
}

/**
 * Unit of Work pattern implementation
 */
export class UnitOfWork {
  private queryRunner: QueryRunner;
  private isTransactionStarted = false;

  constructor(private dataSource: DataSource = AppDataSource) {
    this.queryRunner = this.dataSource.createQueryRunner();
  }

  get manager(): EntityManager {
    return this.queryRunner.manager;
  }

  async begin(): Promise<void> {
    if (this.isTransactionStarted) {
      throw new Error("Transaction already started");
    }

    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    this.isTransactionStarted = true;
  }

  async commit(): Promise<void> {
    if (!this.isTransactionStarted) {
      throw new Error("Transaction not started");
    }

    await this.queryRunner.commitTransaction();
    this.isTransactionStarted = false;
  }

  async rollback(): Promise<void> {
    if (!this.isTransactionStarted) {
      throw new Error("Transaction not started");
    }

    await this.queryRunner.rollbackTransaction();
    this.isTransactionStarted = false;
  }

  async release(): Promise<void> {
    await this.queryRunner.release();
  }

  async execute<T>(callback: (manager: EntityManager) => Promise<T>): Promise<T> {
    try {
      await this.begin();
      const result = await callback(this.manager);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    } finally {
      await this.release();
    }
  }
}

/**
 * Helper function for quick transactional operations
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>
): Promise<T> {
  return transactionManager.runInTransaction(callback);
}

/**
 * Helper for batch inserts with chunking
 */
export async function batchInsert<T>(
  manager: EntityManager,
  entity: new () => T,
  items: Partial<T>[],
  chunkSize = 1000
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const inserted = await manager
      .createQueryBuilder()
      .insert()
      .into(entity)
      .values(chunk as any)
      .returning("*")
      .execute();

    results.push(...(inserted.generatedMaps as T[]));
  }

  return results;
}

/**
 * Helper for batch updates
 */
export async function batchUpdate<T>(
  manager: EntityManager,
  entity: new () => T,
  items: Array<{ id: string; data: Partial<T> }>
): Promise<void> {
  for (const item of items) {
    await manager.update(entity, item.id, item.data as any);
  }
}
