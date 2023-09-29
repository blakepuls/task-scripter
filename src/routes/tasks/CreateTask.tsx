import { useEffect, useState } from "react";
import { AiOutlinePlus } from "react-icons/ai";
import { ITask } from "../../types";
import { invoke } from "@tauri-apps/api/tauri";
import { updateTask } from "../../utils/tasks";

interface CreateTaskButtonProps {
  addTask: (task: ITask) => void;
  initialTask?: ITask; // Optional initial task for editing
  onDelete?: () => void; // Optional delete function
}

export function TaskModal({
  addTask,
  initialTask,
  onDelete,
}: CreateTaskButtonProps) {
  const [taskName, setTaskName] = useState(initialTask?.name || "");
  const [taskDescription, setTaskDescription] = useState(
    initialTask?.description || ""
  );
  const [cronSchedule, setCronSchedule] = useState(initialTask?.schedule || "");
  const [background, setBackground] = useState(true);

  useEffect(() => {
    setTaskName(initialTask?.name || "");
    setTaskDescription(initialTask?.description || "");
    setCronSchedule(initialTask?.schedule || "");
    setBackground(true); // You can also reset this if needed
  }, [initialTask]);

  const closeModal = () => {
    setTaskName("");
    setTaskDescription("");
    setCronSchedule("");
    setBackground(true);
  };

  const createOrEditTask = () => {
    if (!background && !cronSchedule) {
      console.log("Cron Schedule must be filled out!");
      return;
    }
    const task: ITask = {
      id: initialTask?.id || Math.random().toString(36).substr(2, 9),
      name: taskName,
      description: taskDescription,
      schedule: cronSchedule,
      enabled: true,
    };

    // invoke("add_or_edit_task", { task: task });
    updateTask(task);
    addTask(task);
    closeModal();
  };

  return (
    <>
      <dialog
        id={
          initialTask?.id
            ? `task_modal_${initialTask?.id}`
            : `create_task_modal`
        }
        className="modal p-2"
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg pb-4 ">Create Task</h3>
          <section className="flex flex-col gap-3">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Name"
                className="input input-bordered"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <textarea
              placeholder="Description"
              className="textarea textarea-bordered resize-none"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
            <div className="flex gap-2 h-12">
              <label className="label cursor-pointer">
                <span className="label-text">Background</span>
                <input
                  type="radio"
                  name="radio-10"
                  className="ml-2 radio radio-primary"
                  onChange={() => setBackground(true)}
                  checked={true}
                />
              </label>
              <label className="label cursor-pointer">
                <span className="label-text">Schedule</span>
                <input
                  type="radio"
                  name="radio-10"
                  className="ml-2 radio radio-primary"
                  onChange={() => setBackground(false)}
                  checked={!background}
                />
              </label>
              {!background && (
                <input
                  type="text"
                  placeholder="Cron Schedule"
                  className="input  ml-auto input-bordered w-[8.5]"
                  value={cronSchedule}
                  onChange={(e) => setCronSchedule(e.target.value)}
                />
              )}
            </div>
            <form method="dialog" className="ml-auto">
              {initialTask && onDelete && (
                <button className="btn btn-danger" onClick={onDelete}>
                  Delete
                </button>
              )}
              <button
                className="btn btn-primary ml-3"
                onClick={createOrEditTask}
              >
                {initialTask ? "Edit" : "Create"}
              </button>
            </form>
          </section>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => closeModal()}>close</button>
        </form>
      </dialog>
    </>
  );
}
