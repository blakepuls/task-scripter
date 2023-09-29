// Copyright 2020-2022 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;
use window_shadows::set_shadow;
use dirs;
use std::fs;
use std::path::PathBuf;


#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct Task {
  id: String,
  name: String,
  description: String,
  schedule: Option<String>,
  enabled: bool,
}

// #[tauri::command]
// fn get_tasks(task: Task) -> Vec<Task> {
//   // For every folder in the tasks directory, read the file and parse it as a task
//   let mut tasks: Vec<Task> = Vec::new();
//   let paths = fs::read_dir("./tasks").unwrap();

//   for path in paths {
//     let file = fs::read_to_string(path.unwrap().path()).unwrap();
//     let task: Task = serde_json::from_str(&file).unwrap();
//     tasks.push(task);
//   }

//   println!("{:?}", tasks);
//   return tasks;
// }
#[tauri::command]
fn get_tasks() -> Vec<Task> {
  // For every folder in the $HOME/.task-scripter/tasks directory, read the file and parse it as a task
  let mut tasks: Vec<Task> = Vec::new();
  let home_path = dirs::home_dir().unwrap();
  let tasks_path = home_path.join(".task-scripter/tasks");
  
  if let Ok(paths) = fs::read_dir(tasks_path) {
      for path in paths {
          if let Ok(entry) = path {
              let folder_path = entry.path();
              if folder_path.is_dir() {
                  let mut task_json_path = folder_path.clone();
                  task_json_path.push("task.json");
                  
                  if task_json_path.exists() {
                      let file = fs::read_to_string(task_json_path).unwrap();
                      let task: Task = serde_json::from_str(&file).unwrap();
                      tasks.push(task);
                  }
              }
          }
      }
  }

  println!("{:?}", tasks);
  return tasks;
}

fn main() {
  tauri::Builder::default()
      .invoke_handler(tauri::generate_handler![get_tasks])
      .setup(|app| {
          let window = app.get_window("main").unwrap();
          set_shadow(&window, true).expect("Unsupported platform!");
          Ok(())
      })
      .run(tauri::generate_context!())
      .expect("error while running tauri application");

}