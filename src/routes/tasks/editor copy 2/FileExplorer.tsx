// FileExplorer.tsx
import React, { memo, useEffect, useState } from "react";
import { ResizableBox, ResizableBoxProps } from "react-resizable";
import "react-resizable/css/styles.css";
import { fs } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import { FileEntry } from "@tauri-apps/api/fs";
import { AiFillFolder, AiFillFolderOpen } from "react-icons/ai";
import py from "../../../assets/py.svg";
import bat from "../../../assets/bat.svg";
import ps from "../../../assets/ps.svg";
import wav from "../../../assets/icons/audio.svg";
import FileIcon from "../../../components/FileIcon";
import { FaChevronDown } from "react-icons/fa";
import { VscCollapseAll, VscNewFile, VscNewFolder } from "react-icons/vsc";
import { AiOutlineCaretLeft } from "react-icons/ai";
import {
  ITabMeta,
  createTempFile,
  updateEditorConfig,
} from "../../../utils/editor";
import clsx from "clsx";
import { CreateItem } from "./CreateItem";

function normalize(path: string) {
  return path.replace(/\\/g, "/");
}

function getDirFromPath(path?: string | null) {
  if (!path) return "";

  const normalizedPath = path.replace(/\\/g, "/");
  const parts = normalizedPath.split("/");

  if (parts[parts.length - 1].includes(".")) {
    // Likely a file, so we'll snip off the last part to get the directory
    return parts.slice(0, -1).join("/");
  }

  // Likely a directory, so we'll return it as is
  return normalizedPath;
}

interface FileExplorerProps {
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  curTab?: ITabMeta | null;
  setSelectedTab: (tab: ITabMeta) => void;
}

interface IRenderFiles {
  setSelectedTreeTab: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTreeTab?: string | null;
  depth?: number;
  paths: FileEntry[];
  tabs: ITabMeta[];
  curTab?: ITabMeta | null;
  creatingFolder: string | null;
  setCreatingFolder: React.Dispatch<React.SetStateAction<string | null>>;
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  setSelectedTab: (tab: ITabMeta) => void;
  expandedFolders: string[];
  setExpandedFolders: React.Dispatch<React.SetStateAction<string[]>>;
  creatingFile: string | null;
  setCreatingFile: React.Dispatch<React.SetStateAction<string | null>>;
  loadPaths: () => void;
}

const RenderFiles = ({
  paths,
  setSelectedTab,
  curTab,
  tabs,
  setTabs,
  depth = 0,
  creatingFolder,
  setCreatingFolder,
  selectedTreeTab,
  setSelectedTreeTab,
  expandedFolders = [],
  setExpandedFolders,
  creatingFile,
  setCreatingFile,
  loadPaths,
}: IRenderFiles) => {
  useEffect(() => {}, [curTab]);

  function openFile(filePath: string) {
    filePath = normalize(filePath);
    setSelectedTreeTab(filePath);

    // First, check if the tab is already opened.
    const tabAlreadyOpen = tabs.some((tab) => tab.path === filePath);
    if (!tabAlreadyOpen) {
      // If not, create a temp file for it and add to the tabs list
      createTempFile(filePath, "").then(() => {
        setTabs([...tabs, { path: filePath, isDirty: false }]);
        setSelectedTab({ path: filePath, isDirty: false });
      });

      return;
    }

    // Otherwise, just set the selected tab to the one that's already open
    setSelectedTab(tabs.find((tab) => tab.path === filePath)!);
  }

  const toggleFolder = (folder: FileEntry) => {
    // console.log(selectedTreeTab);
    console.log("setting selected tree tab", folder.path);
    setSelectedTreeTab?.(folder.path);
    setExpandedFolders((prev) =>
      prev.includes(folder.name || "Untitled")
        ? prev.filter((name) => name !== folder.name || "Untitled")
        : [...prev, folder.name || "Untitled"]
    );
  };

  useEffect(() => {
    console.log("Selected", selectedTreeTab);
  }, [selectedTreeTab]);

  return (
    <div className="truncate">
      {/* <button
        onClick={() => {
          console.log(selectedTreeTab);
        }}
      >
        Test
      </button> */}
      {paths.map((path) => {
        return (
          <div key={path.name} className="text-lg  ">
            {path.children ? (
              <>
                <button
                  className={clsx(
                    "flex items-center w-full hover:bg-base-100 transition duration-3 p-0.5",
                    {
                      "bg-base-100":
                        normalize(path.path) ===
                        normalize(selectedTreeTab || ""),
                    }
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleFolder(path);
                  }}
                >
                  <div
                    className="flex items-center gap-1"
                    style={{ marginLeft: `${depth * 10}px` }}
                  >
                    <FileIcon
                      className="min-w-[26px] min-h-[26px]"
                      name={path.name!}
                      type="folder"
                      isFolderOpen={expandedFolders.includes(
                        path.name || "Untitled"
                      )}
                    />
                    {path.name}
                  </div>
                </button>

                {expandedFolders.includes(path.name || "Untitled") && (
                  <>
                    <CreateItem
                      onItemCreated={loadPaths}
                      creatingItem={creatingFolder}
                      setCreatingItem={setCreatingFolder}
                      path={`${path.path}`}
                      depth={depth + 1}
                      itemType="folder"
                    />
                    <RenderFiles
                      loadPaths={loadPaths}
                      creatingFile={creatingFile}
                      setCreatingFile={setCreatingFile}
                      setTabs={setTabs}
                      tabs={tabs}
                      expandedFolders={expandedFolders}
                      setExpandedFolders={setExpandedFolders}
                      paths={path.children}
                      curTab={curTab}
                      creatingFolder={creatingFolder}
                      setSelectedTreeTab={setSelectedTreeTab}
                      selectedTreeTab={selectedTreeTab}
                      setCreatingFolder={setCreatingFolder}
                      setSelectedTab={setSelectedTab}
                      depth={depth + 1}
                    />
                    <CreateItem
                      onItemCreated={loadPaths}
                      creatingItem={creatingFile}
                      setCreatingItem={setCreatingFile}
                      path={path.path}
                      depth={depth + 1}
                      itemType="file"
                    />
                  </>
                )}
              </>
            ) : (
              <button
                className={clsx(
                  "truncate text-left flex items-center hover:bg-base-100 w-full transition duration-3 p-0.5",
                  {
                    "bg-base-100":
                      normalize(path.path) === normalize(selectedTreeTab || ""),
                  }
                )}
                onClick={() => {
                  setSelectedTreeTab?.(path.path || "");
                  openFile(path.path || "");
                }}
              >
                <div
                  className="flex items-center gap-1"
                  style={{ marginLeft: `${depth * 10}px` }}
                >
                  <FileIcon
                    className="min-w-[26px] min-h-[26px] "
                    name={path.name?.split(".")[1]!}
                    type="file"
                  />
                  {path.name}
                </div>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface FileExplorerProps {
  tabs: ITabMeta[];
  setTabs: React.Dispatch<React.SetStateAction<ITabMeta[]>>;
  curTab?: ITabMeta | null;
  setSelectedTab: (tab: ITabMeta) => void;
  setSelectedTreeTab: React.Dispatch<React.SetStateAction<string | null>>;
  selectedTreeTab?: string | null;
  expandedFolders: string[];
  setExpandedFolders: React.Dispatch<React.SetStateAction<string[]>>;
}

function FileExplorer({
  tabs,
  curTab,
  setTabs,
  setSelectedTab,
  setSelectedTreeTab,
  selectedTreeTab,
  expandedFolders,
  setExpandedFolders,
}: FileExplorerProps) {
  const task = window.location.pathname.split("/")[3];
  const [paths, setPaths] = React.useState<FileEntry[]>([]);
  const resizableProps: ResizableBoxProps = {
    width: 200,
    height: 1000, // Replace with your desired height
    minConstraints: [1, 100],
    maxConstraints: [Infinity, 1000],
    axis: "x",
    className: "file-explorer",
  };
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null);
  const [creatingFile, setCreatingFile] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<string>("");

  function loadPaths() {
    fs.readDir(`.task-scripter/tasks/${task}/src`, {
      dir: BaseDirectory.Home,
      recursive: true,
    }).then((rawPaths) => {
      // Sort the paths by folders first, then files, all alphabetically
      rawPaths.sort((a, b) => {
        if (a.children && b.children) {
          return a.name!.localeCompare(b.name!);
        } else if (a.children) {
          return -1;
        } else if (b.children) {
          return 1;
        } else {
          return a.name!.localeCompare(b.name!);
        }
      });

      // Normalize the paths
      rawPaths.forEach((path) => {
        path.path = normalize(path.path);
      });

      // Set the root path
      setRootPath(rawPaths[0].path.split("src/")[0] + "src");

      setPaths(rawPaths);
    });
  }

  useEffect(() => {
    loadPaths();
  }, []);

  function goBack() {
    window.history.back();
  }

  async function newFolder() {
    setCreatingFolder(getDirFromPath(selectedTreeTab));
  }

  async function newFile() {
    setCreatingFile(getDirFromPath(selectedTreeTab));
  }

  async function collapseAll() {
    setExpandedFolders([]);
  }

  return (
    <ResizableBox {...resizableProps}>
      <div className="bg-base-200 h-screen p-3">
        <section className=" h-11 flex items-center ">
          <button
            onClick={goBack}
            className="hover:text-primary flex items-center transition duration-300"
          >
            <AiOutlineCaretLeft />
            <h1>BACK</h1>
          </button>
          <button className="btn p-1"></button>
        </section>
        <div className="flex items-center py-0">
          <h2 className="font-bold text-primary truncate">
            {task.toUpperCase()}
          </h2>
          <div className="flex gap-1 ml-auto p-1">
            <VscNewFolder
              className="w-6 h-6 cursor-pointer transition duration-300 hover:bg-base-100 p-1"
              onClick={newFolder}
            />
            <VscNewFile
              className="w-6 h-6 cursor-pointer transition duration-300 hover:bg-base-100 p-1"
              onClick={newFile}
            />
            <VscCollapseAll
              className="w-6 h-6 cursor-pointer transition duration-300 hover:bg-base-100 p-1"
              onClick={collapseAll}
            />
          </div>
        </div>
        <section className="flex flex-col  h-full flex-grow">
          <CreateItem
            onItemCreated={loadPaths}
            creatingItem={creatingFolder}
            setCreatingItem={setCreatingFolder}
            path={rootPath}
            depth={0.2}
            itemType="folder"
          />
          <RenderFiles
            loadPaths={loadPaths}
            creatingFile={creatingFile}
            setCreatingFile={setCreatingFile}
            setTabs={setTabs}
            tabs={tabs}
            curTab={curTab}
            paths={paths}
            expandedFolders={expandedFolders}
            setExpandedFolders={setExpandedFolders}
            selectedTreeTab={selectedTreeTab}
            setSelectedTreeTab={setSelectedTreeTab}
            setSelectedTab={setSelectedTab}
            setCreatingFolder={setCreatingFolder}
            creatingFolder={creatingFolder}
          />
          <CreateItem
            onItemCreated={loadPaths}
            creatingItem={creatingFile}
            setCreatingItem={setCreatingFile}
            path={rootPath}
            depth={0.2}
            itemType="file"
          />
          <div
            className="flex-grow w-full"
            onClick={(e) => {
              console.log("setting selected tree tab", rootPath);
              setSelectedTreeTab(rootPath);
            }}
          ></div>
        </section>
      </div>
    </ResizableBox>
  );
}

export default memo(FileExplorer);
