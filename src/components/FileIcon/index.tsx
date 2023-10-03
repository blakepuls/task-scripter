import React, { useEffect, useState } from "react";
import icons from "./icons.json"; // Replace with the actual path to your icons.json
import { fs } from "@tauri-apps/api";
import { BaseDirectory, resolveResource } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/tauri";

async function getSvgDataUrl(filePath: string): Promise<string> {
  try {
    const source = await resolveResource(`../src/assets/${filePath}`);
    return convertFileSrc(source.replace("\\\\?\\", "").replaceAll("\\", "/"));
  } catch (error) {
    console.error("Couldn't read the SVG file, dude!", error);
    return "";
  }
}

interface FileIconProps {
  name: string;
  type: "file" | "folder";
  isFolderOpen?: boolean;
  className?: string;
}

export default function FileIcon({
  name,
  type,
  isFolderOpen,
  className,
}: FileIconProps) {
  const [iconDataUrl, setIconDataUrl] = useState<string>("");
  let iconName = icons.file as string; // Default for files

  const fileExtensions: { [key: string]: string } = icons.fileExtensions;
  const fileNames: { [key: string]: string } = icons.fileNames;
  const folderNames: { [key: string]: string } = icons.folderNames;
  const folderNamesExpanded: { [key: string]: string } =
    icons.folderNamesExpanded;

  if (type === "folder") {
    iconName = isFolderOpen
      ? (icons.folderExpanded as string)
      : (icons.folder as string); // Default for folders
  }

  // Check for file extensions
  if (type === "file") {
    const extension = name.split(".").pop();
    if (extension && fileExtensions[extension]) {
      iconName = fileExtensions[extension];
    }
  }

  // Check for specific file names
  if (fileNames[name]) {
    iconName = fileNames[name];
  }

  // Check for folder names
  if (type === "folder") {
    if (folderNames[name]) {
      iconName = isFolderOpen ? folderNamesExpanded[name] : folderNames[name];
    }
  }

  const iconPath =
    // @ts-ignore
    icons.iconDefinitions[iconName]?.iconPath ||
    icons.iconDefinitions._file.iconPath;

  useEffect(() => {
    // Get that Data URL, my dude!
    getSvgDataUrl(iconPath).then(setIconDataUrl);
  }, [iconPath]);

  return (
    <div className={className}>
      {iconDataUrl && <img src={iconDataUrl} alt={name} />}
    </div>
  );
}
