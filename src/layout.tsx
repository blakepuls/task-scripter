import { Outlet, Link, useLocation } from "react-router-dom";
import { AiOutlineSetting, AiOutlineAlignLeft } from "react-icons/ai";
import { SiTask } from "react-icons/si";
import clsx from "clsx";
import { TitleBar } from "./components";
import { fs } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import { createDir } from "@tauri-apps/api/fs";
import { getTasks } from "./utils/tasks";

export default function Layout() {
  const location = useLocation();

  const selectedClass = "text-primary";
  const defaultClass = "w-10 h-7";
  const linkClass = "hover:text-primary w-10 h-10 transition duration-300";

  return (
    <div className="">
      <TitleBar />
      <div className="flex flex-row min-w-screen max-h-[calc(100vh-32px)] overflow-hidden bg-base-200">
        <div className="w-14 bg-base-200 flex flex-col gap-3 px-2 pt-3">
          <Link className={linkClass} to="/">
            <SiTask
              className={clsx(defaultClass, {
                [selectedClass]:
                  location.pathname === "/" ||
                  location.pathname.includes("/tasks"),
              })}
            />
          </Link>
          <Link className={linkClass} to="/logs">
            <AiOutlineAlignLeft
              className={clsx(defaultClass, {
                [selectedClass]: location.pathname === "/logs",
              })}
            />
          </Link>
          <div className="flex-grow" />
          <Link className={linkClass} to="/settings">
            <AiOutlineSetting
              className={clsx(defaultClass, {
                [selectedClass]: location.pathname === "/settings",
              })}
            />
          </Link>
        </div>
        <div className="w-screen max-w-[calc(100vw-55px)] h-screen max-h-[calc(100vh-32px)] rounded-tl-md bg-base-100 ">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
