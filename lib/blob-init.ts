// Blob Storage initialization helper for Next.js
import { blobStorageService } from "./blob-storage";

/**
 * Initialize Azure Blob Storage and ensure containers exist
 * This function can be called at app startup or on-demand
 *
 * Uses singleton pattern from blob-storage.ts to reuse existing connection
 * in serverless environment (Next.js).
 *
 * Non-blocking: If Blob Storage is not configured, logs warning but doesn't throw
 *
 * @returns Promise<void>
 */
export async function initBlobStorage(): Promise<void> {
  try {
    console.log("[Blob Init] Initializing Blob Storage...");
    await blobStorageService.initialize();
    await blobStorageService.ensureContainersExist();
    console.log("[Blob Init] Blob Storage initialized successfully");
  } catch (error) {
    // Non-blocking: log error mais ne pas crash l'application
    console.error("[Blob Init] Failed to initialize Blob Storage:", error);
    console.warn(
      "[Blob Init] Blob Storage unavailable - routes using it will fail"
    );
    // Ne pas throw - permettre à l'app de démarrer même sans Blob Storage configuré
  }
}
