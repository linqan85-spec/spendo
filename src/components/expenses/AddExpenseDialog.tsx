import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { CATEGORY_LABEL_KEYS, ExpenseCategory } from "@/types/spendo";
import { useTranslation } from "react-i18next";

type ExpenseFormValues = {
  vendor_name: string;
  amount: number;
  transaction_date: Date;
  category: ExpenseCategory;
  type: "expense" | "invoice";
  description?: string;
};

interface AddExpenseDialogProps {
  onAdd: (expense: ExpenseFormValues) => void;
  manualExpenseCount: number;
  maxManualExpenses: number;
  isTrialing: boolean;
}

export function AddExpenseDialog({
  onAdd,
  manualExpenseCount,
  maxManualExpenses,
  isTrialing,
}: AddExpenseDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const remainingExpenses = maxManualExpenses - manualExpenseCount;
  const canAddMore = remainingExpenses > 0 || !isTrialing;

  const expenseSchema = useMemo(
    () =>
      z.object({
        vendor_name: z
          .string()
          .trim()
          .min(1, t("validation.vendor_required"))
          .max(100, t("validation.vendor_max", { max: 100 })),
        amount: z
          .coerce
          .number()
          .positive(t("validation.amount_positive"))
          .max(10000000, t("validation.amount_max", { max: 10000000 })),
        transaction_date: z.date({ required_error: t("validation.date_required") }),
        category: z.enum([
          "saas",
          "resor",
          "kontor",
          "marknadsforing",
          "it_verktyg",
          "ovrigt",
        ] as const),
        type: z.enum(["expense", "invoice"] as const),
        description: z
          .string()
          .trim()
          .max(500, t("validation.description_max", { max: 500 }))
          .optional(),
      }),
    [t]
  );

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vendor_name: "",
      amount: undefined,
      category: "ovrigt",
      type: "expense",
      description: "",
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    onAdd(data);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!canAddMore}>
          <Plus className="h-4 w-4 mr-2" />
          {t("expenses.add.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("expenses.add.title")}</DialogTitle>
          <DialogDescription>{t("expenses.add.description")}</DialogDescription>
        </DialogHeader>

        {isTrialing && (
          <Alert variant={remainingExpenses <= 5 ? "destructive" : "default"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t("expenses.add.trial_remaining", {
                remaining: remainingExpenses,
                max: maxManualExpenses,
              })}
              {remainingExpenses <= 5 && ` ${t("expenses.add.trial_upgrade")}`}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vendor_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expenses.add.field.vendor")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("expenses.add.placeholder.vendor")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("expenses.add.field.amount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={t("expenses.add.placeholder.amount")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t("expenses.add.field.date")}</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>{t("expenses.add.placeholder.date")}</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("2020-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expenses.add.field.category")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("expenses.add.placeholder.category")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABEL_KEYS).map(([key, labelKey]) => (
                        <SelectItem key={key} value={key}>
                          {t(labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expenses.add.field.type")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("expenses.add.placeholder.type")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">{t("expenses.type.expense")}</SelectItem>
                      <SelectItem value="invoice">{t("expenses.type.invoice")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("expenses.add.field.description")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("expenses.add.placeholder.description")} {...field} />
                  </FormControl>
                  <FormDescription>{t("expenses.add.description_optional")}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
