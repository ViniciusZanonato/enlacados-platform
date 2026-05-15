import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Trash2, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/admin/DataTable"
import { FormBuilder } from "@/components/admin/FormBuilder"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

import * as profilesApi from "@/features/profiles/api"
import { Profile } from "@/features/profiles/api"
import { toast } from "sonner"

const profileSchema = z.object({
    full_name: z.string().min(2, "Nome muito curto"),
    email: z.string().email("Email inválido"),
    profile_type: z.enum(["student", "professional", "institutional"]),
    institution_name: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfileManagement() {
    const queryClient = useQueryClient()
    const [editingProfile, setEditingProfile] = React.useState<Profile | null>(null)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const { data: profiles = [], isLoading } = useQuery({
        queryKey: ["adminProfiles"],
        queryFn: profilesApi.getProfiles,
    })

    const updateMutation = useMutation({
        mutationFn: (values: ProfileFormValues) =>
            profilesApi.updateProfile(editingProfile!.id, values),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminProfiles"] })
            toast.success("Perfil atualizado com sucesso!")
            setIsDialogOpen(false)
        },
        onError: (error: Error) => {
            toast.error(`Erro ao atualizar: ${error.message}`)
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => profilesApi.deleteProfile(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["adminProfiles"] })
            toast.success("Perfil removido com sucesso!")
        },
        onError: (error: Error) => {
            toast.error(`Erro ao remover: ${error.message}`)
        }
    })

    const columns: ColumnDef<Profile>[] = [
        {
            accessorKey: "full_name",
            header: "Nome",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium">{row.getValue("full_name")}</span>
                    {row.original.is_verified && (
                        <CheckCircle2 className="h-3 w-3 text-blue-500" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "profile_type_display",
            header: "Tipo",
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.getValue("profile_type_display")}
                </Badge>
            ),
        },
        {
            accessorKey: "institution_name",
            header: "Instituição",
            cell: ({ row }) => row.getValue("institution_name") || "-",
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const profile = row.original

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="SR-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                                setEditingProfile(profile)
                                setIsDialogOpen(true)
                            }}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Remover
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o perfil
                                            e removerá os dados associados de nossos servidores.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => deleteMutation.mutate(profile.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Sim, remover perfil
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
        },
    ]

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={profiles}
                searchKey="full_name"
                placeholder="Buscar usuários..."
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar Perfil</DialogTitle>
                        <DialogDescription>
                            Altere as informações do usuário abaixo.
                        </DialogDescription>
                    </DialogHeader>
                    <FormBuilder
                        schema={profileSchema}
                        fields={[
                            { name: "full_name", label: "Nome Completo", type: "text" },
                            { name: "email", label: "Email", type: "email" },
                            {
                                name: "profile_type",
                                label: "Tipo de Perfil",
                                type: "select",
                                options: [
                                    { label: "Estudante", value: "student" },
                                    { label: "Profissional", value: "professional" },
                                    { label: "Institucional", value: "institutional" },
                                ]
                            },
                            { name: "institution_name", label: "Instituição", type: "text" },
                        ]}
                        defaultValues={editingProfile ? {
                            full_name: editingProfile.full_name,
                            email: editingProfile.email,
                            profile_type: editingProfile.profile_type,
                            institution_name: editingProfile.institution_name || "",
                        } : undefined}
                        onSubmit={(values) => updateMutation.mutate(values)}
                        isLoading={updateMutation.isPending}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
