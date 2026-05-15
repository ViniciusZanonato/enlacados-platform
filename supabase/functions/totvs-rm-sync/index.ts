import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define as estruturas de dados que nossas funções RPC esperam.
// O código de transformação deverá converter a resposta da API do TOTVS para estes formatos.
interface Student {
  cpf: string;
  full_name: string;
  email: string;
}

interface AcademicHistoryRecord {
  student_cpf: string;
  course_code: string;
  course_name: string;
  grade: number;
  absences: number;
  semester: string;
}

interface TotvsStudent {
  cpf: string;
  nomeCompleto: string;
  emailPrincipal: string;
}

interface TotvsAcademicHistoryRecord {
  cpfAluno: string;
  codigoDisciplina: string;
  nomeDisciplina: string;
  notaFinal: number;
  numeroFaltas: number;
  periodoLetivo: string;
}

serve(async (req) => {
  try {
    // 1. Obter credenciais e configurações da API do TOTVS a partir de variáveis de ambiente
    // Estas devem ser configuradas no painel do Supabase em Settings > Edge Functions.
    const totvsApiBaseUrl = Deno.env.get("TOTVS_API_BASE_URL");
    const totvsApiToken = Deno.env.get("TOTVS_API_TOKEN"); // Exemplo, pode ser usuário/senha, etc.

    if (!totvsApiBaseUrl || !totvsApiToken) {
      throw new Error("As variáveis de ambiente da API do TOTVS não estão configuradas.");
    }

    // 2. Lógica de chamada à API do TOTVS (a ser implementada)
    // Esta seção é onde a integração real acontece.
    // Você precisará da documentação da API do TOTVS RM para implementar isso.

    // TODO: Implementar a chamada para buscar alunos
    // Exemplo:
    // const studentsResponse = await fetch(`${totvsApiBaseUrl}/students`, {
    //   headers: { "Authorization": `Bearer ${totvsApiToken}` }
    // });
    // const totvsStudentsData = await studentsResponse.json();
    const totvsStudentsData: TotvsStudent[] = []; // Placeholder

    // TODO: Implementar a chamada para buscar históricos acadêmicos
    // const historyResponse = await fetch(`${totvsApiBaseUrl}/academic-history`, {
    //   headers: { "Authorization": `Bearer ${totvsApiToken}` }
    // });
    // const totvsHistoryData = await historyResponse.json();
    const totvsHistoryData: TotvsAcademicHistoryRecord[] = []; // Placeholder


    // 3. Transformar os dados do formato TOTVS para o formato da nossa plataforma
    
    // TODO: Mapear os campos da resposta da API do TOTVS para o nosso modelo 'Student'
    const studentsToUpsert: Student[] = totvsStudentsData.map((item: TotvsStudent) => ({
      cpf: item.cpf, // Ajuste os nomes dos campos conforme a API do TOTVS
      full_name: item.nomeCompleto,
      email: item.emailPrincipal,
    }));

    // TODO: Mapear os campos da resposta da API do TOTVS para o nosso modelo 'AcademicHistoryRecord'
    const historyToUpsert: AcademicHistoryRecord[] = totvsHistoryData.map((item: TotvsAcademicHistoryRecord) => ({
      student_cpf: item.cpfAluno,
      course_code: item.codigoDisciplina,
      course_name: item.nomeDisciplina,
      grade: item.notaFinal,
      absences: item.numeroFaltas,
      semester: item.periodoLetivo,
    }));

    // Se não houver dados para processar, encerre com sucesso.
    if (studentsToUpsert.length === 0 && historyToUpsert.length === 0) {
        return new Response(JSON.stringify({ message: "Nenhum dado novo para sincronizar." }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    }

    // 4. Criar o cliente Supabase e chamar as funções RPC
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    let studentsResult, historyResult;

    if (studentsToUpsert.length > 0) {
        const { data, error } = await supabaseClient.rpc("bulk_upsert_students", { students_data: studentsToUpsert });
        if (error) throw new Error(`Erro ao sincronizar alunos: ${error.message}`);
        studentsResult = data;
    }

    if (historyToUpsert.length > 0) {
        const { data, error } = await supabaseClient.rpc("bulk_upsert_academic_history", { records_data: historyToUpsert });
        if (error) throw new Error(`Erro ao sincronizar históricos: ${error.message}`);
        historyResult = data;
    }

    // 5. Retornar a resposta final
    return new Response(
      JSON.stringify({
        message: "Sincronização concluída.",
        students_result: studentsResult || "Nenhum aluno para sincronizar.",
        history_result: historyResult || "Nenhum histórico para sincronizar.",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    // [SEC-PII-001] Safe logging pattern
    const errorMessage = error instanceof Error ? error.message : String(error);
    const sanitizedError = errorMessage
      .replace(/\b\d{11}\b/g, '***.***.***-**') // Mask CPFs
      .replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,}\b/g, '***@***.***'); // Mask Emails
    
    console.error("Erro na função de sincronização TOTVS:", sanitizedError);
    return new Response(JSON.stringify({ error: "Erro interno na sincronização" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});