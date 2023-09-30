export interface ITask {
  id: string;
  name: string;
  description: string;
  schedule?: string;
  enabled: boolean;
  language: string;
  files?: {
    path: string;
    name: string;
  }[];
}
