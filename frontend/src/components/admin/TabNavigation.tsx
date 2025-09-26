type Tab = {
    value: string;
    label: string;
  };
  
  interface TabNavigationProps {
    tabs: Tab[];
    activeTab: string;
    setActiveTab: (value: string) => void;
  }
  
  export default function TabNavigation({ tabs, activeTab, setActiveTab }: TabNavigationProps) {
    return (
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {tabs.map((tab: Tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.value
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={activeTab === tab.value ? 'page' : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    )
  }