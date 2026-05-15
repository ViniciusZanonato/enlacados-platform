import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, Check, X, Shield, Plus, Save, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

interface ClassAttendanceTabProps {
    classId: string;
}

export function ClassAttendanceTab({ classId }: ClassAttendanceTabProps) {
    const queryClient = useQueryClient();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);
    const [description, setDescription] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Fetch Attendance Dates
    const { data: attendanceList, isLoading: isLoadingAttendance } = useQuery({
        queryKey: ['classAttendance', classId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('class_attendance')
                .select('*')
                .eq('class_id', classId)
                .order('date', { ascending: false });
            if (error) throw error;
            return data;
        }
    });

    // Fetch Students for Roll Call
    const { data: students } = useQuery({
        queryKey: ['classStudents', classId],
        queryFn: async () => {
            // We need students names.
            // Link class_students -> profiles
            const { data, error } = await supabase
                .from('class_students')
                .select(`
student_id,
    profiles: student_id(id, full_name, avatar_url)
        `)
                .eq('class_id', classId);

            if (error) throw error;
            // Flatten
            return data.map((item: any) => ({
                student_id: item.student_id,
                name: item.profiles?.full_name || 'Aluno Desconhecido'
            }))
        }
    });

    // Fetch Attendance Records for Selected Date
    const { data: attendanceRecords, isLoading: isLoadingRecords } = useQuery({
        queryKey: ['attendanceRecords', selectedAttendanceId],
        queryFn: async () => {
            if (!selectedAttendanceId) return [];
            const { data, error } = await supabase
                .from('student_attendance_records')
                .select('*')
                .eq('attendance_id', selectedAttendanceId);
            if (error) throw error;
            return data;
        },
        enabled: !!selectedAttendanceId
    });

    // Local state for roll call editing
    const [editedRecords, setEditedRecords] = useState<Record<string, string>>({}); // student_id -> status

    // Initialize editedRecords when selectedAttendanceId changes
    React.useEffect(() => {
        if (attendanceRecords) {
            const map: Record<string, string> = {};
            attendanceRecords.forEach((r: any) => {
                map[r.student_id] = r.status;
            });
            setEditedRecords(map);
        } else {
            setEditedRecords({});
        }
    }, [attendanceRecords]);


    const createAttendanceMutation = useMutation({
        mutationFn: async () => {
            if (!date) return;
            const formattedDate = format(date, 'yyyy-MM-dd');

            const { data, error } = await supabase
                .from('class_attendance')
                .insert({ class_id: classId, date: formattedDate, description })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            toast.success("Dia letivo criado!");
            queryClient.invalidateQueries({ queryKey: ['classAttendance'] });
            setSelectedAttendanceId(data.id);
            setIsCreating(false);
            setDescription('');
        },
        onError: (err: any) => toast.error(err.message)
    });

    const saveRollCallMutation = useMutation({
        mutationFn: async () => {
            if (!selectedAttendanceId) return;

            const upserts = students?.map((s: any) => ({
                attendance_id: selectedAttendanceId,
                student_id: s.student_id,
                status: editedRecords[s.student_id] || 'present'
            })) || [];

            if (upserts.length === 0) return;

            const { error } = await supabase
                .from('student_attendance_records')
                .upsert(upserts, { onConflict: 'attendance_id, student_id' });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Frequência salva!");
            queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
        },
        onError: (err: any) => toast.error(err.message)
    });

    const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'excused') => {
        setEditedRecords(prev => ({ ...prev, [studentId]: status }));
    };

    const currentAttendance = attendanceList?.find(a => a.id === selectedAttendanceId);

    return (
        <div className="flex gap-6 h-[600px] border rounded-lg bg-background p-4">
            {/* Sidebar: Dates List */}
            <div className="w-1/3 border-r pr-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Dias Letivos</h3>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 space-y-4">
                            <h4 className="font-medium text-sm">Adicionar Dia Letivo</h4>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Conteúdo / Observação</Label>
                                <Textarea
                                    placeholder="O que foi dado nesta aula?"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={() => createAttendanceMutation.mutate()} disabled={createAttendanceMutation.isPending}>
                                {createAttendanceMutation.isPending ? "Criando..." : "Criar Aula"}
                            </Button>
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2">
                    {isLoadingAttendance ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6" /></div>
                    ) : attendanceList?.map((att: any) => (
                        <div
                            key={att.id}
                            onClick={() => setSelectedAttendanceId(att.id)}
                            className={cn(
                                "p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors",
                                selectedAttendanceId === att.id ? "bg-accent border-primary" : "bg-card"
                            )}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold flex items-center gap-2">
                                    <CalendarIcon className="h-3 w-3" />
                                    {format(new Date(att.date), 'dd/MM/yyyy')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {att.description || "Sem descrição"}
                            </p>
                        </div>
                    ))}
                    {attendanceList?.length === 0 && (
                        <p className="text-sm text-center text-muted-foreground p-4">Nenhum dia registrado.</p>
                    )}
                </div>
            </div>

            {/* Main: Roll Call Table */}
            <div className="flex-1 flex flex-col">
                {selectedAttendanceId ? (
                    <>
                        <div className="mb-4 flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    Chamada: {format(new Date(currentAttendance?.date), "dd 'de' MMMM", { locale: ptBR })}
                                </h2>
                                <p className="text-muted-foreground">{currentAttendance?.description}</p>
                            </div>
                            <Button onClick={() => saveRollCallMutation.mutate()} disabled={saveRollCallMutation.isPending}>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Chamada
                            </Button>
                        </div>

                        <div className="border rounded-md flex-1 overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Aluno</TableHead>
                                        <TableHead className="text-center w-[120px]">Presente</TableHead>
                                        <TableHead className="text-center w-[120px]">Ausente</TableHead>
                                        <TableHead className="text-center w-[120px]">Justificado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students?.map((student: any) => {
                                        const status = editedRecords[student.student_id] || 'present'; // Default present
                                        return (
                                            <TableRow key={student.student_id}>
                                                <TableCell className="font-medium">{student.name}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        variant={status === 'present' ? 'default' : 'ghost'}
                                                        className={cn("h-8 w-8 rounded-full p-0", status === 'present' && "bg-green-600 hover:bg-green-700")}
                                                        onClick={() => handleStatusChange(student.student_id, 'present')}
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        variant={status === 'absent' ? 'destructive' : 'ghost'}
                                                        className="h-8 w-8 rounded-full p-0"
                                                        onClick={() => handleStatusChange(student.student_id, 'absent')}
                                                    >
                                                        <UserX className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        size="sm"
                                                        variant={status === 'excused' ? 'secondary' : 'ghost'}
                                                        className={cn("h-8 w-8 rounded-full p-0", status === 'excused' && "bg-amber-200 hover:bg-amber-300 text-amber-800")}
                                                        onClick={() => handleStatusChange(student.student_id, 'excused')}
                                                    >
                                                        J
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground">
                        <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                        <p>Selecione um dia letivo para realizar a chamada.</p>
                        <p className="text-sm">Ou clique em "+" para adicionar uma nova aula.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
