import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Home,
  FileText,
  Heart,
  StickyNote,
  Layers,
  Plus,
  Upload,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Sparkles,
  Brain,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const menuItems = [
  { title: "Agenda", url: "dashboard", icon: Home },
  { title: "Questões", url: "questions", icon: FileText },
  { title: "Favoritas", url: "favorites", icon: Heart },
  { title: "Resumos", url: "summaries", icon: StickyNote },
  { title: "Flashcards", url: "flashcards", icon: Layers },
  { title: "Adicionar", url: "add-question", icon: Plus },
  { title: "Importar", url: "import", icon: Upload },
  { title: "Prática", url: "practice-config", icon: GraduationCap },
  { title: "Simulados", url: "simulados", icon: ClipboardList },
  { title: "Estatísticas", url: "statistics", icon: BarChart3 },
  { title: "Análise", url: "detailed-statistics", icon: Sparkles },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  questionsCount: number;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  questionsCount,
}: AppSidebarProps) {
  const { state, setOpen } = useSidebar();
  const { theme, setTheme } = useTheme();

  const isCollapsed = state === "collapsed";
  const isMobile = window.innerWidth < 768;

  return (
    <Sidebar collapsible="offcanvas" className="border-r">
      <SidebarContent className="bg-sidebar flex flex-col">
        {/* HEADER */}
        <div className="p-4 flex items-center gap-3">
          <SidebarTrigger className="p-2 rounded-lg hover:bg-sidebar-accent">
            <Brain className="h-6 w-6" />
          </SidebarTrigger>
          {!isCollapsed && (
            <span className="text-lg font-bold">NeuroQBank</span>
          )}
        </div>

        {/* MENU */}
        <SidebarGroup className="flex-1 px-2 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              <TooltipProvider delayDuration={0}>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => {
                            onTabChange(item.url);

                            // 🔴 FECHA SEMPRE NO MOBILE / PWA / TWA
                            if (isMobile) {
                              setOpen(false);
                            }
                          }}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                            activeTab === item.url
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "hover:bg-sidebar-accent"
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          {!isCollapsed && (
                            <span className="truncate">
                              {item.title}
                              {item.url === "questions" &&
                                ` (${questionsCount})`}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </TooltipTrigger>

                      {isCollapsed && (
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* FOOTER */}
        <div className="p-4 border-t">
          <button
            onClick={() =>
              setTheme(theme === "dark" ? "light" : "dark")
            }
            className="flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {!isCollapsed && "Tema"}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
