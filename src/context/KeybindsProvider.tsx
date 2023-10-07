import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  KeyboardEvent,
  ReactNode,
} from "react";

type KeybindAction = () => void;
type Keybinds = { [key: string]: KeybindAction | null };
type KeybindContextType = {
  keybinds: Keybinds;
  addKeybind: (key: string, action: KeybindAction | null) => void;
};

export const KeybindContext = createContext<KeybindContextType | undefined>(
  undefined
);

type KeybindProviderProps = {
  children: ReactNode;
};

export const KeybindProvider: React.FC<KeybindProviderProps> = ({
  children,
}) => {
  const [keybinds, setKeybinds] = useState<Keybinds>({});

  const addKeybind = (key: string, action: KeybindAction | null) => {
    setKeybinds((prevKeybinds) => ({
      ...prevKeybinds,
      [key]: action,
    }));
  };

  return (
    <KeybindContext.Provider value={{ keybinds, addKeybind }}>
      {children}
    </KeybindContext.Provider>
  );
};

export const useKeybinds = () => {
  const context = useContext(KeybindContext);
  if (!context) {
    throw new Error("useKeybinds must be used within a KeybindProvider");
  }

  const { keybinds, addKeybind } = context;

  const handleKeyPress = (event: KeyboardEvent<HTMLElement>) => {
    const key = `${event.ctrlKey ? "Ctrl+" : ""}${event.key}`;
    const action = keybinds[key];
    if (action) {
      event.preventDefault(); // Prevents the default browser action for the key combo
      action();
    }
  };

  return { handleKeyPress, addKeybind };
};
