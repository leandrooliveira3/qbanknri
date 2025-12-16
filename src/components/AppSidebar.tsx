import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  Home,
  FileText,
  Heart,
  StickyNote,
  Layers,
  ClipboardList,
  BarChart3,
  Sparkles,
} from "lucide-react";

const menuItems = [
  { title: "Agenda", url: "dashboard", icon: Home },
  { title: "Questões", url: "questions", icon: FileText },
  { title: "Favoritas", url: "favorites", icon: Heart },
  { title: "Resumos", url: "summaries", icon: StickyNote },
  { title: "Flashcards", url: "flashcards", icon: Layers },
  { title: "Simulados", url: "simulados", icon: ClipboardList },
  { title: "Estatísticas", url: "statistics", icon: BarChart3 },
  { title: "Análise", url: "detailed-statistics", icon: Sparkles },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  closeSidebar: () => void;
  questionsCount: number;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  closeSidebar,
  questionsCount,
}: AppSidebarProps) {
  function handleClick(tab: string) {
    closeSidebar();      // 🔑 FECHA PRIMEIRO
    onTabChange(tab);    // 🔑 TROCA DEPOIS
  }

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarContent className="bg-sidebar flex flex-col">

        <div className="p-4 font-bold text-lg">
          NeuroQBank
        </div>

        <SidebarGroup className="flex-1 px-2 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => handleClick(item.url)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                      activeTab === item.url
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "hover:bg-sidebar-accent"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>
                      {item.title}
                      {item.url === "questions" &&
                        ` (${questionsCount})`}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
