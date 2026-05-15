import React, { createContext, useContext, ReactNode } from 'react';

interface StudentInfoContext {
  id: string; // This is the profile_id
  cpf: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  created_at: string;
  status: 'pending' | 'active';
}

interface StudentContextType {
  studentProfileId: string;
  institutionalProfileId: string | null;
  student: StudentInfoContext | null;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

interface StudentProviderProps {
  children: ReactNode;
  studentProfileId: string;
  institutionalProfileId: string | null;
  student: StudentInfoContext | null;
}

export const StudentProvider = ({ children, studentProfileId, institutionalProfileId, student }: StudentProviderProps) => {
  return (
    <StudentContext.Provider value={{ studentProfileId, institutionalProfileId, student }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudentContext = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentContext must be used within a StudentProvider');
  }
  return context;
};
