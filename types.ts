export interface PlanStep {
  id: string;
  type: 'validation' | 'progression' | 'optimisation';
  label: string;
  bpm?: number;
  completed: boolean;
  dayIndex?: number;
}

export interface AppState {
  studentName: string;
  segment: string;
  bpmZero: string;
  bpmRupture: string;
  plan: PlanStep[];
  isPlanGenerated: boolean;
  isAdmin: boolean;
}
