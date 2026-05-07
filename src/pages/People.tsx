import { useState } from "react";
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
import { Loader2, Plus, Trash2, CreditCard, AlertTriangle, Sparkles, Pencil } from "lucide-react";
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
import { usePerPersonSaaSDuplicates } from "@/hooks/usePerPersonSaaSDuplicates";
import type { PaymentCard, TeamMember } from "@/types/spendo";
import { useSubscriptionGate } from "@/hooks/useSubscriptionGate";
import { PaywallOverlay } from "@/components/PaywallOverlay";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value);
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

  const guesses = useCardGuesses(expenses, cards, members);

  const guessAssignments = new Map<string, string>();
  guesses.forEach((g, expId) => guessAssignments.set(expId, g.member_id));

  const duplicates = usePerPersonSaaSDuplicates(expenses, members, guessAssignments);

  // Build per-person spend (using assigned + guesses)
  const memberStats = members.map((m) => {
    let total = 0;
    let manualCount = 0;
    let guessCount = 0;
    expenses.forEach((e) => {
      const assignedHere =
        e.assigned_member_id === m.id ||
        (!e.assigned_member_id && guesses.get(e.id)?.member_id === m.id);
      if (assignedHere) {
        total += Number(e.amount);
        if (e.assigned_member_id === m.id) manualCount++;
        else guessCount++;
      }
    });
    return { member: m, total, manualCount, guessCount };
  });
  memberStats.sort((a, b) => b.total - a.total);

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
              Vem spenderar mest? Koppla kort till personer så gissar Spendo automatiskt — du
              bekräftar.
            </p>
          </div>
          <AddMemberButton onAdd={(name, email) => addMember.mutate({ name, email })} />
        </div>

        {/* Honest disclaimer */}
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Vi gissar — du bestämmer</AlertTitle>
          <AlertDescription>
            Spendo försöker matcha utgifter mot personer baserat på kort och sökord. Gissningar
            visas alltid med en <Badge variant="secondary" className="ml-1">Gissad</Badge> -etikett.
            Klicka på en person på en utgift för att bekräfta eller ändra.
          </AlertDescription>
        </Alert>

        {/* Per-person SaaS duplicate warnings (THE big idea) */}
        {duplicates.length > 0 && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Möjliga dubblett-licenser ({duplicates.length})
              </CardTitle>
              <CardDescription>
                Samma SaaS betalas av flera personer separat. Slå ihop till team-licens.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {duplicates.map((d) => (
                <div
                  key={d.vendor_id}
                  className="rounded-lg border bg-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold">{d.vendor_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.members
                        .map((m) => m.member?.name || "Okänd")
                        .join(", ")}{" "}
                      betalar varsin licens
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Möjlig besparing/månad</p>
                    <p className="font-bold text-lg text-primary">
                      {formatCurrency(d.potentialSavings)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Top spenders */}
        <Card>
          <CardHeader>
            <CardTitle>Topplista — vem spenderar mest</CardTitle>
            <CardDescription>
              Inkluderar både bekräftade tilldelningar och Spendos gissningar.{" "}
              {unassignedCount > 0 && (
                <span className="text-muted-foreground">
                  ({unassignedCount} utgifter saknar fortfarande person)
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {memberStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Lägg till personer för att börja se vem som spenderar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Bekräftade</TableHead>
                    <TableHead>Gissade</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberStats.map(({ member, total, manualCount, guessCount }) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{manualCount}</TableCell>
                      <TableCell>
                        {guessCount > 0 ? (
                          <Badge variant="secondary">{guessCount} gissad</Badge>
                        ) : (
                          "0"
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(total)}
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
                              <AlertDialogTitle>Ta bort {member.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Personen och alla kopplade kort tas bort. Utgifter blir
                                otilldelade.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMember.mutate(member.id)}
                              >
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
            )}
          </CardContent>
        </Card>

        {/* Cards */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Kort
              </CardTitle>
              <CardDescription>
                Koppla ett kort till en person + lägg till sökord (t.ex. "*1234", initialer
                "AB", eller hela namnet) som vi letar efter i transaktionstexten.
              </CardDescription>
            </div>
            <CardActionAddCard members={members} onSave={(v) => upsertCard.mutate(v)} />
          </CardHeader>
          <CardContent>
            {cards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Inga kort ännu. Lägg till ett kort så börjar Spendo gissa automatiskt.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kortnamn</TableHead>
                    <TableHead>Sista 4</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Sökord</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.label}</TableCell>
                      <TableCell>
                        {c.last4 ? (
                          <Badge variant="outline">**** {c.last4}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{c.member?.name || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {c.match_keywords.length === 0 ? (
                            <span className="text-muted-foreground text-xs">
                              Inga sökord
                            </span>
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
                          <CardActionAddCard
                            members={members}
                            existing={c}
                            onSave={(v) => upsertCard.mutate(v)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteCard.mutate(c.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

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
        <Button className="gap-2">
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

function CardActionAddCard({
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
            för att gissa rätt person.
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
              placeholder="anna, ab, *1234"
            />
            <p className="text-xs text-muted-foreground">
              Vi söker dessa i transaktionstexten. Skriv initialer, namn, eller en del av
              kortets referens.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Avbryt
          </Button>
          <Button
            disabled={!label.trim() || !memberId}
            onClick={() => {
              onSave({
                id: existing?.id,
                member_id: memberId,
                label: label.trim(),
                last4: last4.trim() || undefined,
                match_keywords: keywordsText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
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
