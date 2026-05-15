import * as React from "react"
import { useForm, UseFormReturn, FieldValues, Path, DefaultValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export type FieldConfig = {
    name: string
    label: string
    placeholder?: string
    description?: string
    type: "text" | "number" | "email" | "password" | "select" | "textarea"
    options?: { label: string; value: string }[]
}

interface FormBuilderProps<T extends FieldValues> {
    schema: z.ZodType<T>
    fields: FieldConfig[]
    onSubmit: (values: T) => void
    defaultValues?: DefaultValues<T>
    submitLabel?: string
    isLoading?: boolean
}

export function FormBuilder<T extends FieldValues>({
    schema,
    fields,
    onSubmit,
    defaultValues,
    submitLabel = "Salvar",
    isLoading = false,
}: FormBuilderProps<T>) {
    const form = useForm<T>({
        resolver: zodResolver(schema),
        defaultValues,
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {fields.map((field) => (
                    <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name as Path<T>}
                        render={({ field: formField }) => (
                            <FormItem>
                                <FormLabel>{field.label}</FormLabel>
                                <FormControl>
                                    {field.type === "select" ? (
                                        <Select
                                            onValueChange={formField.onChange}
                                            defaultValue={formField.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder={field.placeholder} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {field.options?.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : field.type === "textarea" ? (
                                        <Textarea
                                            placeholder={field.placeholder}
                                            {...formField}
                                        />
                                    ) : (
                                        <Input
                                            type={field.type}
                                            placeholder={field.placeholder}
                                            {...formField}
                                            onChange={(e) => {
                                                const val = field.type === "number" ? parseFloat(e.target.value) : e.target.value;
                                                formField.onChange(val);
                                            }}
                                        />
                                    )}
                                </FormControl>
                                {field.description && (
                                    <FormDescription>{field.description}</FormDescription>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {submitLabel}
                </Button>
            </form>
        </Form>
    )
}
