export interface Signal {
  name: string;
  weight: number;
  required?: boolean;
  /** Max edit distance as a fraction of the pattern length. */
  tolerance?: number;
  /** Text variants (EN/ID); any single one matching is enough. */
  texts: string[];
}

export interface SignalResult {
  name: string;
  found: boolean;
  weight: number;
  required: boolean;
}

export interface EvaluationResult {
  matched: boolean;
  score: number;
  requiredOk: boolean;
  detail: SignalResult[];
  text: string;
}

export interface DetectionResult extends EvaluationResult {
  stage: 1 | 2;
  ms: number;
}
