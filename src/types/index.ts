export interface ITask {
  id: string;
  name: string;
  description: string;
  schedule?: string;
  enabled: boolean;
}
