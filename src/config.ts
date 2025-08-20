export const isTest = process.env.NODE_ENV === 'test';

export const DEFAULT_WINDOW = 5;
export const DEFAULT_EPOCHS = isTest ? 1 : 50;
export const MAX_DATASET_LENGTH = isTest ? 100 : Infinity;
