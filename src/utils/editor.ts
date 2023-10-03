import { fs } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import { Console } from "console";

interface IEditorConfig {
  last_tab?: string;
  tab_history?: string[];
}

// Removes the file from the given path, example src\src\index - Copy - Copy (2).py -> src\src\
function getDirFromFile(path: string) {
  const split = path.split("\\");
  split.pop();
  return split.join("\\");
}

// Used for creating a temporary file for the editor to use before saving.
export async function createTempFile(path: string, content: string) {
  console.log(path);
  const task = path
    .split(".task-scripter/tasks/")[1]
    .split(".task")[0]
    .split("/")[0];

  const file = path.split(".task-scripter/tasks/")[1].split("/")[1];
  await fs.createDir(
    `.task-scripter/tasks/${task}/temp/${getDirFromFile(file)}`,
    {
      dir: BaseDirectory.Home,
      recursive: true,
    }
  );

  fs.writeFile(`.task-scripter/tasks/${task}/temp/${file}`, content, {
    dir: BaseDirectory.Home,
  });
}

export async function getEditorConfig(task: string) {
  const content = await fs.readTextFile(
    `.task-scripter/tasks/${task}/editor.json`,
    {
      dir: BaseDirectory.Home,
    }
  );

  return JSON.parse(content) as IEditorConfig;
}

export async function updateEditorConfig(task: string, config: IEditorConfig) {
  fs.writeFile(
    `.task-scripter/tasks/${task}/editor.json`,
    JSON.stringify(config),
    {
      dir: BaseDirectory.Home,
    }
  );
}

export async function deleteTempFile(path: string) {
  const task = path
    .split(".task-scripter/tasks/")[1]
    .split(".task")[0]
    .split("/")[0];

  const file = path.split(".task-scripter/tasks/")[1].split("/")[1];
  await fs.removeFile(file, { dir: BaseDirectory.Home });
}

export function getTempFile(path: string) {
  return fs.readTextFile(path, { dir: BaseDirectory.Home });
}
