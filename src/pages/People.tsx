import { useState, useMemo, Fragment } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Plus,
  Trash2,
  CreditCard,
  Sparkles,
  Pencil,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import {
  useTeamMembers,
  usePaymentCards,
  useAddTeamMember,
  useDeleteTeamMember,
  useUpsertPaymentCard,
  useDeletePaymentCard,
} from "@/hooks/useTeamData";
import { useExpenses } from "@/hooks/useExpensesData";
import { useCardGuesses } from "@/hooks/useCardGuesses";
import type { PaymentCard, TeamMember, Expense } from "@/types/spendo";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { PaywallOverlay } from "@/components/PaywallOverlay";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("sv-SE");
}

export default function People() {
  const { data: members = [], isLoading: lm } = useTeamMembers();
  const { data: cards = [], isLoading: lc } = usePaymentCards();
  const { data: expenses = [], isLoading: le } = useExpenses();
  const { hasAccess, isLoading: lg, startCheckout } = useSubscriptionGate();

  const addMember = useAddTeamMember();
  const deleteMember = useDeleteTeamMember();
  const upsertCard = useUpsertPaymentCard();
  const deleteCard = useDeletePaymentCard();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const guesses = useCardGuesses(expenses, cards, members);

  const memberStats = useMemo(() => {
    const stats = members.map((m) => {
      let total = 0;
      let manualCount = 0;
      let suggestedCount = 0;
      const expensesForMember: Expense[] = [];
      expenses.forEach((e) => {
        const isManual = e.assigned_member_id === m.id;
        const isSuggested = !e.assigned_member_id && guesses.get(e.id)?.member_id === m.id;
        if (isManual || isSuggested) {
          total += Number(e.amount);
          if (isManual) manualCount++;
          else suggestedCount++;
          expensesForMember.push(e);
        }
      });
      const cardsForMember = cards.filter((c) => c.member_id === m.id);
      return { member: m, total, manualCount, suggestedCount, expenses: expensesForMember, cards: cardsForMember };
    });
    stats.sort((a, b) => b.total - a.total);
    return stats;
  }, [members, expenses, guesses, cards]);

  const unassignedCount = expenses.filter(
    (e) => !e.assigned_member_id && !guesses.has(e.id)
  ).length;

  const isLoading = lm || lc || le || lg;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!hasAccess) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Personer</h1>
            <p className="text-muted-foreground">Vem spenderar vad?</p>
          </div>
          <PaywallOverlay onUpgrade={startCheckout} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Personer</h1>
            <p className="text-muted-foreground">
              Vem i bolaget spenderar mest. Klicka på en rad för att se detaljer.
            </p>
          </div>
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Hantera personer & kort
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Hantera personer & kort</SheetTitle>
                <SheetDescription>
                  Lägg till personer och koppla deras betalkort. Spendo använder kortnummer
                  och sökord för att automatiskt föreslå rätt person på utgifter.
                </SheetDescription>
              </SheetHeader>
              <ManageMembersAndCards
                members={members}
                cards={cards}
                onAddMember={(name, email) => addMember.mutate({ name, email })}
                onDeleteMember={(id) => deleteMember.mutate(id)}
                onUpsertCard={(v) => upsertCard.mutate(v)}
                onDeleteCard={(id) => deleteCard.mutate(id)}
              />
            </SheetContent>
          </Sheet>
        </div>

        {/* Honest disclaimer */}
        {unassignedCount > 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertTitle>Vissa förslag är inte verifierade</AlertTitle>
            <AlertDescription>
              {unassignedCount} utgifter saknar fortfarande person. Lägg till fler kort eller
              sökord under "Hantera personer & kort" för att förbättra matchningen.
            </AlertDescription>
          </Alert>
        )}

        {/* Top spenders */}
        <Card>
          <CardHeader>
            <CardTitle>Topplista — vem spenderar mest</CardTitle>
            <CardDescription>
              Inkluderar både verifierade tilldelningar och Spendos förslag baserat på kort.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {memberStats.length === 0 ? (
              <p className="text-sm text-muted-foreground p-6">
                Inga personer ännu. Klicka på "Hantera personer & kort" för att lägga till.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Verifierade</TableHead>
                    <TableHead>Ej verifierade</TableHead>
                    <TableHead>Kort</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats.map((stat) => {
                    const isOpen = expandedId === stat.member.id;
                    return (
                      <Fragment key={stat.member.id}>
                        <TableRow
                          key={stat.member.id}
                          className="cursor-pointer hover:bg-accent/40"
                          onClick={() => setExpandedId(isOpen ? null : stat.member.id)}
                        >
                          <TableCell>
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{stat.member.name}</TableCell>
                          <TableCell>{stat.manualCount}</TableCell>
                          <TableCell>
                            {stat.suggestedCount > 0 ? (
                              <Badge variant="secondary">
                                {stat.suggestedCount} ej verifierad
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {stat.cards.length === 0 ? (
                              <span className="text-xs text-muted-foreground">Inget kort</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {stat.cards.map((c) => (
                                  <Badge key={c.id} variant="outline" className="text-xs">
                                    {c.last4 ? `**** ${c.last4}` : c.label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(stat.total)}
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow key={`${stat.member.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={6} className="p-4">
                              <PersonDetail
                                member={stat.member}
                                expenses={stat.expenses}
                                cards={stat.cards}
                                onOpenSettings={() => setSettingsOpen(true)}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

/* ----------------- Person detail (expanded row) ----------------- */

function PersonDetail({
  member,
  expenses,
  cards,
  onOpenSettings,
}: {
  member: TeamMember;
  expenses: Expense[];
  cards: PaymentCard[];
  onOpenSettings: () => void;
}) {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
  );
  const top = sorted.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <p className="font-medium">{member.name}s utgifter</p>
          <p className="text-xs text-muted-foreground">
            {expenses.length} utgifter · {cards.length} kopplade kort
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenSettings} className="gap-2">
          <Settings2 className="h-3 w-3" />
          Koppla kort
        </Button>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga utgifter ännu.</p>
      ) : (
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Leverantör</TableHead>
                <TableHead>Beskrivning</TableHead>
                <TableHead className="text-right">Belopp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="text-xs">{formatDate(e.transaction_date)}</TableCell>
                  <TableCell className="font-medium">{e.vendor?.name || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                    {e.description}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(e.amount))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sorted.length > 10 && (
            <p className="text-xs text-muted-foreground p-3 border-t">
              Visar 10 senaste av {sorted.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------- Manage members & cards (sheet) ----------------- */

function ManageMembersAndCards({
  members,
  cards,
  onAddMember,
  onDeleteMember,
  onUpsertCard,
  onDeleteCard,
}: {
  members: TeamMember[];
  cards: PaymentCard[];
  onAddMember: (name: string, email?: string) => void;
  onDeleteMember: (id: string) => void;
  onUpsertCard: (v: {
    id?: string;
    member_id: string;
    label: string;
    last4?: string;
    match_keywords: string[];
  }) => void;
  onDeleteCard: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-8">
      {/* Members */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Personer ({members.length})</h3>
          <AddMemberButton onAdd={onAddMember} />
        </div>
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Inga personer ännu.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Namn</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.email || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ta bort {m.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Personen och alla kopplade kort tas bort. Utgifter blir
                              otilldelade.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Avbryt</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDeleteMember(m.id)}>
                              Ta bort
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Kort ({cards.length})
          </h3>
          <CardDialog members={members} onSave={onUpsertCard} />
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Koppla ett kort till en person + lägg till sökord (t.ex. initialer "AB" eller
          namnet) som vi letar efter i transaktionstexten.
        </p>
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Inga kort ännu. Lägg till ett kort så börjar Spendo föreslå matchningar
            automatiskt.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kort</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Sökord</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cards.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="font-medium">{c.label}</div>
                      {c.last4 && (
                        <div className="text-xs text-muted-foreground">**** {c.last4}</div>
                      )}
                    </TableCell>
                    <TableCell>{c.member?.name || "—"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {c.match_keywords.length === 0 ? (
                          <span className="text-muted-foreground text-xs">—</span>
                        ) : (
                          c.match_keywords.map((k) => (
                            <Badge key={k} variant="secondary" className="text-xs">
                              {k}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <CardDialog
                          members={members}
                          existing={c}
                          onSave={onUpsertCard}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteCard(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ----------------- Add member dialog ----------------- */

function AddMemberButton({
  onAdd,
}: {
  onAdd: (name: string, email?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Lägg till person
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till person</DialogTitle>
          <DialogDescription>
            Personer behöver inte ha inlogg — det räcker att de finns för att kunna spåras.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Namn</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>E-post (valfri)</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            disabled={!name.trim()}
            onClick={() => {
              onAdd(name.trim(), email.trim() || undefined);
              setName("");
              setEmail("");
              setOpen(false);
            }}
          >
            Lägg till
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------- Card dialog ----------------- */

function CardDialog({
  members,
  existing,
  onSave,
}: {
  members: TeamMember[];
  existing?: PaymentCard;
  onSave: (v: {
    id?: string;
    member_id: string;
    label: string;
    last4?: string;
    match_keywords: string[];
  }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(existing?.label || "");
  const [last4, setLast4] = useState(existing?.last4 || "");
  const [memberId, setMemberId] = useState<string>(existing?.member_id || "");
  const [keywordsText, setKeywordsText] = useState(
    (existing?.match_keywords || []).join(", ")
  );

  const isEditing = !!existing;
  const canSave = label.trim() && memberId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Lägg till kort
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Redigera kort" : "Nytt kort"}</DialogTitle>
          <DialogDescription>
            Ju fler sökord, desto bättre matchning. Vi kombinerar sista 4 siffror + sökord
            för att föreslå rätt person.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Kortnamn (t.ex. "Annas företagskort")</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Sista 4 siffror</Label>
            <Input
              maxLength={4}
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
              placeholder="1234"
            />
          </div>
          <div className="space-y-1">
            <Label>Person</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Välj person" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Sökord (kommaseparerade)</Label>
            <Input
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="Anna, AB, anna@bolaget.se"
            />
            <p className="text-xs text-muted-foreground">
              Spendo letar efter dessa i transaktionstexten.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            disabled={!canSave}
            onClick={() => {
              const keywords = keywordsText
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean);
              onSave({
                id: existing?.id,
                member_id: memberId,
                label: label.trim(),
                last4: last4.trim() || undefined,
                match_keywords: keywords,
              });
              setOpen(false);
            }}
          >
            Spara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
