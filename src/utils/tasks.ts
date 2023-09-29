import { fs, invoke } from "@tauri-apps/api";
import { ITask } from "../types";
import { BaseDirectory } from "@tauri-apps/api/path";

export async function getTasks() {
  // Get all tasks via invoking the tauri API
  const tasks = await invoke("get_tasks");

  return tasks as ITask[];
}

export async function updateTask(task: ITask) {
  await fs.createDir(`.task-scripter/tasks/${task.name}`, {
    dir: BaseDirectory.Home,
    recursive: true,
  });

  await fs.writeFile(
    {
      path: `.task-scripter/tasks/${task.name}/task.json`,
      contents: JSON.stringify(task, null, 2),
    },
    {
      dir: BaseDirectory.Home,
    }
  );
}

export async function deleteTask(task: ITask) {
  await fs.removeDir(`.task-scripter/tasks/${task.name}`, {
    dir: BaseDirectory.Home,
    recursive: true,
  });
}

export async function getTask(name: string) {
  const task = await fs.readTextFile(`.task-scripter/tasks/${name}/task.json`, {
    dir: BaseDirectory.Home,
  });

  return JSON.parse(task) as ITask;
}
