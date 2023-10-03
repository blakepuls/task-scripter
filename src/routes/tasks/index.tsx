import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import {
  AiFillDelete,
  AiFillEdit,
  AiOutlineEdit,
  AiOutlinePlus,
} from "react-icons/ai";
import { FaCode } from "react-icons/fa";
import { HiCodeBracket, HiPencilSquare, HiTrash } from "react-icons/hi2";
import { TaskModal } from "./CreateTask";
import { ITask } from "../../types";
import { tasks as taskUtil } from "../../utils/";
import { Link } from "react-router-dom";
import py from "../../assets/py.svg";
import bat from "../../assets/bat.svg";
import ps from "../../assets/ps.svg";

function LanguageIcon({ language }: { language: string }) {
  switch (language) {
    case "py":
      return <img src={py} className="w-7" />;
    case "bat":
      return <img src={bat} className="w-7" />;
    case "ps":
      return <img src={ps} className="w-7" />;
    default:
      return <img src={py} className="w-7" />;
  }
}

function Task({
  task,
  tasks,
  setTasks,
}: {
  task: ITask;
  tasks: ITask[];
  setTasks: (tasks: ITask[]) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const editTask = (newTask: ITask) => {
    setTasks(tasks.map((t) => (t.id === newTask.id ? newTask : t)));
  };

  async function showModal() {
    setModalOpen(true);
    // @ts-ignore
    document.getElementById(`task_modal_${task.id}`)?.showModal();
  }

  function removeTask() {
    setTasks(tasks.filter((t) => t.id !== task.id));
    taskUtil.deleteTask(task.name);
  }

  function openEditor() {}

  return (
    <div className="flex flex-row gap-3 bg-base-200 rounded-md p-3 ">
      <TaskModal addTask={editTask} initialTask={task} onDelete={removeTask} />
      <div className="flex flex-col w-full">
        <div className="flex items-center gap-3 w-full">
          <LanguageIcon language={task.language} />
          <h1 className="text-2xl mb-0.5">{task.name}</h1>
          <div className="flex text-2xl ml-auto gap-3 items-center">
            <Link to={`/tasks/editor/${task.name}`}>
              <HiCodeBracket
                className="hover:text-primary cursor-pointer transition duration-300"
                onClick={openEditor}
              />
            </Link>
            <HiPencilSquare
              className="hover:text-primary cursor-pointer transition duration-300"
              onClick={showModal}
            />
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              onChange={(e) => {
                editTask({ ...task, enabled: e.target.checked });
                taskUtil.updateTask({ ...task, enabled: e.target.checked });
                invoke("toggle_task", { task: task });
              }}
              checked={task.enabled}
            />
          </div>
        </div>
        <p>{task.description}</p>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState<ITask[]>([]);

  useEffect(() => {
    taskUtil.getTasks().then((tasks) => setTasks(tasks));
  }, []);

  const addTask = (newTask: ITask) => {
    setTasks([...tasks, newTask]);
  };

  async function showModal() {
    // @ts-ignore
    document.getElementById("create_task_modal")?.showModal();
  }

  return (
    <div className="flex flex-col h-full w-full p-5">
      <TaskModal addTask={addTask} />
      <button className="btn pl-2.5" onClick={() => showModal()}>
        <AiOutlinePlus className="text-xl" />
        New Task
      </button>
      <div className="divider"></div>
      <section className="flex flex-col gap-3 overflow-y-auto">
        {tasks.map((task) => (
          <Task tasks={tasks} setTasks={setTasks} task={task} key={task.id} />
        ))}
      </section>
    </div>
  );
}
