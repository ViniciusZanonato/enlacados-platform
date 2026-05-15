export interface AcademicHistory {
  id: string;
  student_profile_id: string;
  institutional_profile_id: string;
  course_code: string;
  course_name: string;
  grade: number | null;
  absences: number | null;
  semester: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipNote {
  id: string;
  student_profile_id: string;
  mentor_id: string;
  note: string;
  created_at: string;
}

export interface ExtracurricularActivity {
  id: string;
  student_profile_id: string;
  activity_name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at?: string;
}

export interface StudentGoal {
  id: string;
  student_profile_id: string;
  goal_description: string;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ScheduledExam {
  id: string;
  student_profile_id: string;
  course_name: string;
  exam_date: string;
  topic: string;
  created_at: string;
  updated_at: string;
}



}







export interface PersonalProfile {



    date_of_birth: string | null;



    address: {



        street?: string;



        city?: string;



        state?: string;



        postal_code?: string;



    } | null;



    registration_number: string | null;



    current_course_id: string | null;



    current_semester: string | null;



    academic_status: 'Ativo' | 'Trancado' | 'Formando' | 'EAD' | 'Presencial' | 'Concluído' | 'Evadido' | null;



    shift: 'Matutino' | 'Noturno' | 'Integral' | 'Online' | null;



    entry_date: string | null;



    entry_method: string | null;



    gpa: number | null;



    phone_number: string | null;



    gender: 'Masculino' | 'Feminino' | 'Outro' | 'Prefiro não informar' | null;



    emergency_contact_name: string | null;



    emergency_contact_phone: string | null;



    rg: string | null;



    rne: string | null;



    passport: string | null;



    status_tags: string[] | null;



    course_name: string | null;



}







export interface Professor {



    id: string;



    name: string;



    email: string;



    bio: string | null;



    avatar_url: string | null;



    attendance_hours: { [key: string]: string } | null;



}




