import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

const contractSchema = z.object({
  base_price_per_month: z.coerce.number().min(0, 'Måste vara minst 0'),
  extra_user_price: z.coerce.number().min(0, 'Måste vara minst 0'),
  max_users_included: z.coerce.number().min(1, 'Måste vara minst 1'),
  max_manual_expenses: z.coerce.number().min(0, 'Måste vara minst 0'),
  subscription_status: z.enum(['trialing', 'active', 'past_due', 'canceled', 'unpaid']),
  trial_ends_at: z.string().nullable(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

interface EditContractDialogProps {
  companyId: string;
  initialValues: {
    base_price_per_month: number;
    extra_user_price: number;
    max_users_included: number;
    max_manual_expenses: number;
    subscription_status: string;
    trial_ends_at: string | null;
  };
  onSuccess: () => void;
}

export function EditContractDialog({ companyId, initialValues, onSuccess }: EditContractDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      base_price_per_month: initialValues.base_price_per_month,
      extra_user_price: initialValues.extra_user_price,
      max_users_included: initialValues.max_users_included,
      max_manual_expenses: initialValues.max_manual_expenses,
      subscription_status: initialValues.subscription_status as ContractFormValues['subscription_status'],
      trial_ends_at: initialValues.trial_ends_at ? initialValues.trial_ends_at.split('T')[0] : null,
    },
  });

  const onSubmit = async (data: ContractFormValues) => {
    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        base_price_per_month: data.base_price_per_month,
        extra_user_price: data.extra_user_price,
        max_users_included: data.max_users_included,
        subscription_status: data.subscription_status,
        trial_ends_at: data.trial_ends_at ? new Date(data.trial_ends_at).toISOString() : null,
      };

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (error) throw error;

      toast.success('Avtalet har uppdaterats');
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Kunde inte uppdatera avtalet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Redigera avtal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Redigera avtal</DialogTitle>
          <DialogDescription>
            Uppdatera prissättning och avtalsinställningar för detta företag.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="base_price_per_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grundpris (kr/månad)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="extra_user_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Extra användare (kr/månad)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_users_included"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Användare inkluderade</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_manual_expenses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max manuella utgifter</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>Under trial</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="subscription_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prenumerationsstatus</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trialing">Trial</SelectItem>
                      <SelectItem value="active">Aktiv</SelectItem>
                      <SelectItem value="past_due">Förfallen betalning</SelectItem>
                      <SelectItem value="canceled">Avslutad</SelectItem>
                      <SelectItem value="unpaid">Obetald</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trial_ends_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trial slutar</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value || ''} 
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>Lämna tomt om ingen trial</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sparar...' : 'Spara ändringar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
