import React, { useState } from 'react';
import { CaseList, CaseWorkflow } from '@/components/case-workflow';
import type { Case } from '@/types/case.types';

const CasesPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'workflow'>('list');
  const [editingCaseId, setEditingCaseId] = useState<string | undefined>();

  const handleNewCase = () => {
    setEditingCaseId(undefined);
    setView('workflow');
  };

  const handleEditCase = (id: string) => {
    setEditingCaseId(id);
    setView('workflow');
  };

  const handleComplete = (caseData: Case) => {
    setView('list');
    setEditingCaseId(undefined);
  };

  const handleCancel = () => {
    setView('list');
    setEditingCaseId(undefined);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      {view === 'list' ? (
        <CaseList 
          onNewCase={handleNewCase} 
          onEditCase={handleEditCase}
        />
      ) : (
        <CaseWorkflow
          caseId={editingCaseId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CasesPage;
