import React, { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileSidebar } from "@/components/MobileSidebar";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useQuestions } from "@/hooks/useQuestions";

const Index = () => {
  const { questions } = useQuestions();
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-background">

      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:block">
        <AppSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          questionsCount={questions.length}
        />
      </div>

      {/* SIDEBAR MOBILE */}
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setMobileOpen(false);
        }}
        questionsCount={questions.length}
      />

      <div className="flex-1 flex flex-col min-w-0">

        {/* HEADER */}
        <header className="h-14 border-b bg-card sticky top-0 z-40">
          <div className="flex items-center h-full px-4 gap-3">

            {/* BOTÃO MOBILE */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-lg font-semibold truncate">
              NeuroQBank
            </h1>

            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-auto p-4">
          {/* seu renderContent aqui */}
        </main>

      </div>
    </div>
  );
};

export default Index;
