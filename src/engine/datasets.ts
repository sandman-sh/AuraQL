import { DatasetMetadata } from '../types';

/**
 * Dynamic metadata registry. Starts empty.
 * Tables are added at runtime when users upload CSV/JSON files.
 */
export const DATASETS_METADATA: Record<string, DatasetMetadata> = {};
