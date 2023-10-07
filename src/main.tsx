import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layout";
import ErrorPage from "./error-page";
import Settings from "./routes/settings";
import { TauriProvider } from "./context/TauriProvider";
import "./styles.css";
import { SettingsProvider } from "./context/SettingsProvider";
import Tasks from "./routes/tasks";
import Logs from "./routes/logs";
import Editor from "./routes/tasks/editor/Editor";
import { KeybindContext, KeybindProvider } from "./context/KeybindsProvider";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Tasks />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/logs",
        element: <Logs />,
      },
      {
        path: "/tasks/editor/:id",
        element: <Editor />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TauriProvider>
      <SettingsProvider>
        <KeybindProvider>
          <RouterProvider router={router} />
        </KeybindProvider>
      </SettingsProvider>
    </TauriProvider>
  </React.StrictMode>
);
