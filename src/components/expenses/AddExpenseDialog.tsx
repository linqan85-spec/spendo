import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { CATEGORY_LABELS, ExpenseCategory, ExpenseType } from '@/types/spendo';

const expenseSchema = z.object({
  vendor_name: z.string().trim().min(1, 'Leverantör krävs').max(100, 'Max 100 tecken'),
  amount: z.coerce.number().positive('Belopp måste vara positivt').max(10000000, 'Max 10 miljoner'),
  transaction_date: z.date({ required_error: 'Datum krävs' }),
  category: z.enum(['saas', 'resor', 'kontor', 'marknadsforing', 'it_verktyg', 'ovrigt'] as const),
  type: z.enum(['expense', 'invoice'] as const),
  description: z.string().trim().max(500, 'Max 500 tecken').optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

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
  isTrialing 
}: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false);
  const remainingExpenses = maxManualExpenses - manualExpenseCount;
  const canAddMore = remainingExpenses > 0 || !isTrialing;

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      vendor_name: '',
      amount: undefined,
      category: 'ovrigt',
      type: 'expense',
      description: '',
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
          Lägg till utgift
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lägg till manuell utgift</DialogTitle>
          <DialogDescription>
            Lägg till en utgift manuellt för analys. Denna synkas inte till Kleer.
          </DialogDescription>
        </DialogHeader>

        {isTrialing && (
          <Alert variant={remainingExpenses <= 5 ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {remainingExpenses} av {maxManualExpenses} manuella utgifter kvar under trial.
              {remainingExpenses <= 5 && ' Uppgradera för obegränsade manuella utgifter.'}
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
                  <FormLabel>Leverantör</FormLabel>
                  <FormControl>
                    <Input placeholder="T.ex. Slack, AWS, SJ" {...field} />
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
                    <FormLabel>Belopp (SEK)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
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
                    <FormLabel>Datum</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'yyyy-MM-dd')
                            ) : (
                              <span>Välj datum</span>
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
                            date > new Date() || date < new Date('2020-01-01')
                          }
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
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
                    <FormLabel>Typ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Välj typ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="expense">Utlägg</SelectItem>
                        <SelectItem value="invoice">Faktura</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beskrivning (valfritt)</FormLabel>
                  <FormControl>
                    <Input placeholder="T.ex. Månadsprenumeration" {...field} />
                  </FormControl>
                  <FormDescription>
                    Kort beskrivning av utgiften
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit">
                Lägg till
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
