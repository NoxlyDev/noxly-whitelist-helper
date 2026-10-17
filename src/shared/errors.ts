export class AppError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ConfigError extends AppError {}
export class OcrError extends AppError {}
export class ImageFetchError extends AppError {}
