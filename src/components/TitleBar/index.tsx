import React from "react";
import {
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeRestore,
  VscChromeClose,
} from "react-icons/vsc";
import { appWindow } from "@tauri-apps/api/window";
import logo from "../../assets/logo.svg";
export default function TitleBar() {
  const [isMaximized, setIsMaximized] = React.useState(false);

  async function maximize() {
    await appWindow.maximize();
    setIsMaximized(await appWindow.isMaximized());
  }

  async function unmaximize() {
    await appWindow.unmaximize();
    setIsMaximized(await appWindow.isMaximized());
  }

  const style =
    "hover:bg-base-200 rounded-md rounded-t-none w-8 h-8 transition duration-300";

  return (
    <div
      data-tauri-drag-region
      className="h-8 align-middle flex items-center bg-base-200"
    >
      <img
        src={logo}
        alt="logo"
        className="w-6 h-6 ml-1.5 mt-1 overflow-visible"
      />
      <h1 className="text-md p-1.5 font-semibold truncate">Task Scripter</h1>
      <div className="ml-auto">
        <button className={style} onClick={() => appWindow.minimize()}>
          <VscChromeMinimize className="m-auto" />
        </button>
        {!isMaximized ? (
          <button className={style} onClick={maximize}>
            <VscChromeMaximize className="m-auto" />
          </button>
        ) : (
          <button className={style} onClick={unmaximize}>
            <VscChromeRestore className="m-auto" />
          </button>
        )}
        <button
          className={style + " hover:!bg-red-500 rounded-br-none"}
          onClick={() => appWindow.close()}
        >
          <VscChromeClose className="m-auto" />
        </button>
      </div>
    </div>
  );
}
