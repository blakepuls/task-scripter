import { useState } from "react";

interface ITabMeta {
  path: string;
  isDirty: boolean;
}

function TabManager() {
  const [tabs, setTabs] = useState<ITabMeta[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<{
    backward: ITabMeta[];
    forward: ITabMeta[];
  }>({ backward: [], forward: [] });

  const openTab = (tab: ITabMeta) => {
    setTabs([...tabs, tab]);
    setActiveTabIndex(tabs.length); // Set the new tab as active
    setHistory({
      backward: [...history.backward, ...tabs.slice(0, activeTabIndex ?? 0)],
      forward: [],
    }); // Reset forward history
  };

  const closeTab = (index: number) => {
    const newTabs = tabs.filter((_, i) => i !== index);
    setTabs(newTabs);
    setActiveTabIndex(index > 0 ? index - 1 : newTabs.length > 0 ? 0 : null); // Set previous or next tab as active
    setHistory({ ...history, forward: [...history.forward, tabs[index]] }); // Add closed tab to forward history
  };

  const switchTab = (index: number) => {
    setActiveTabIndex(index);
    setHistory({
      backward: [...history.backward, ...tabs.slice(0, activeTabIndex ?? 0)],
      forward: [...tabs.slice((activeTabIndex ?? 0) + 1), ...history.forward],
    });
  };

  const goBackward = () => {
    if (history.backward.length > 0 && activeTabIndex !== null) {
      const lastTab = history.backward.pop()!;
      setHistory({
        backward: history.backward,
        forward: [tabs[activeTabIndex], ...history.forward],
      });
      openTab(lastTab);
    }
  };

  const goForward = () => {
    if (history.forward.length > 0 && activeTabIndex !== null) {
      const nextTab = history.forward.pop()!;
      setHistory({
        backward: [...history.backward, tabs[activeTabIndex]],
        forward: history.forward,
      });
      openTab(nextTab);
    }
  };

  return {
    tabs,
    activeTabIndex,
    openTab,
    closeTab,
    switchTab,
    goBackward,
    goForward,
  };
}

export default TabManager;
