import React from "react";

interface Task {
  id: string;
  name: string;
  script: string;
  description: string;
}

export default function Tasks() {
  const [tasks, setTasks] = React.useState([]);

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task: Task) => {
        return (
          <div key={task.id} className="flex flex-col gap-1">
            <h1 className="text-lg font-semibold">{task.name}</h1>
            <p className="text-sm">{task.description}</p>
          </div>
        );
      })}
    </div>
  );
}
