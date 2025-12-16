import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { QuestionForm } from "@/components/QuestionForm";
import { QuestionEditor } from "@/components/QuestionEditor";
import { QuestionBank } from "@/components/QuestionBank";
import { FavoriteQuestions } from "@/components/FavoriteQuestions";
import { ImportQuestions } from "@/components/ImportQuestions";
import { PracticeMode } from "@/components/PracticeMode";
import { PracticeConfig } from "@/components/PracticeConfig";
import { SimuladoMode } from "@/components/SimuladoMode";
import { SimuladoConfig } from "@/components/SimuladoConfig";
import { Statistics } from "@/components/Statistics";
import { DetailedStatistics } from "@/components/DetailedStatistics";
import { Summaries } from "@/components/Summaries";
import { Flashcards } from "@/components/Flashcards";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useQuestions } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const { questions, loading, hasMore, loadMore, loadQuestionsByCategory,
    getAllCategories, getAllCategoriesWithCounts,
    addQuestion, importQuestions, updateQuestion, deleteQuestion, refetch } =
    useQuestions();

  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard questions={questions} />;
      case "questions":
        return <QuestionBank questions={questions} loading={loading} hasMore={hasMore} onLoadMore={loadMore} />;
      case "favorites":
        return <FavoriteQuestions questions={questions} />;
      case "summaries":
        return <Summaries />;
      case "flashcards":
        return <Flashcards />;
      case "statistics":
        return (
          <ErrorBoundary fallback={<Card><CardContent>Erro</CardContent></Card>}>
            <Statistics />
          </ErrorBoundary>
        );
      case "detailed-statistics":
        return (
          <ErrorBoundary fallback={<Card><CardContent>Erro</CardContent></Card>}>
            <DetailedStatistics />
          </ErrorBoundary>
        );
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">

        <AppSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          questionsCount={questions.length}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card sticky top-0 z-40">
            <div className="flex items-center h-full px-4 gap-3">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <h1 className="text-lg font-semibold">NeuroQBank</h1>
              <div className="ml-auto flex gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4">
            {renderContent()}
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
};

export default Index;
