import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/AppSidebar";
import { MobileSidebar } from "@/components/MobileSidebar";

import { Dashboard } from "@/components/Dashboard";
import { QuestionBank } from "@/components/QuestionBank";
import { FavoriteQuestions } from "@/components/FavoriteQuestions";
import { Summaries } from "@/components/Summaries";
import { Flashcards } from "@/components/Flashcards";
import { Statistics } from "@/components/Statistics";
import { DetailedStatistics } from "@/components/DetailedStatistics";
import { QuestionForm } from "@/components/QuestionForm";
import { ImportQuestions } from "@/components/ImportQuestions";
import { PracticeConfig } from "@/components/PracticeConfig";
import { SimuladoConfig } from "@/components/SimuladoConfig";

import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuestions } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const {
    questions,
    loading,
    hasMore,
    loadMore,
    loadQuestionsByCategory,
    getAllCategories,
    getAllCategoriesWithCounts,
    addQuestion,
    importQuestions,
    updateQuestion,
    deleteQuestion,
    refetch,
  } = useQuestions();

  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  /* ================= CONTENT ================= */

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard questions={questions} />;

      case "questions":
        return (
          <QuestionBank
            questions={questions}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onEdit={() => {}}
            onDelete={deleteQuestion}
          />
        );

      case "favorites":
        return <FavoriteQuestions questions={questions} />;

      case "summaries":
        return <Summaries />;

      case "flashcards":
        return <Flashcards />;

      case "add-question":
        return (
          <QuestionForm
            onAddQuestion={addQuestion}
            onCancel={() => setActiveTab("questions")}
          />
        );

      case "import":
        return (
          <ImportQuestions
            onImportQuestions={importQuestions}
            onCancel={() => setActiveTab("dashboard")}
          />
        );

      case "practice-config":
        return (
          <PracticeConfig
            questions={questions}
            loading={loading}
            loadQuestionsByCategory={loadQuestionsByCategory}
            getAllCategories={getAllCategories}
            getAllCategoriesWithCounts={getAllCategoriesWithCounts}
            onStartPractice={() => {}}
            onBack={() => setActiveTab("dashboard")}
          />
        );

      case "simulados":
        return (
          <SimuladoConfig
            questions={questions}
            loading={loading}
            loadQuestionsByCategory={loadQuestionsByCategory}
            onStartSimulado={() => {}}
            onBack={() => setActiveTab("dashboard")}
          />
        );

      case "statistics":
        return <Statistics />;

      case "detailed-statistics":
        return <DetailedStatistics />;

      default:
        return (
          <div className="text-muted-foreground">
            Aba não encontrada: {activeTab}
          </div>
        );
    }
  };

  /* ================= LAYOUT ================= */

  return (
    <SidebarProvider>
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

        {/* MAIN */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* HEADER */}
          <header className="h-14 border-b bg-card sticky top-0 z-40">
            <div className="flex items-center h-full px-4 gap-3">

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
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
              {renderContent()}
            </div>
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
