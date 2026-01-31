
# Spendo - Nulägesanalys och Roadmap

## Vad som finns idag

### Gränssnittet (UI)
- **Landing page** med pricing och features
- **Dashboard** med KPI:er, kategoridiagram, top-leverantörer och SaaS-lista
- **Expenses** - lista med kostnader (sök, filter)
- **SaaS** - översikt över SaaS-prenumerationer
- **Vendors** - leverantörslista
- **Integrations** - Kleer och Fortnox-kort (UI klar)
- **Settings** - företagsinfo, team-inbjudan, prenumerationsstatus
- **Admin Dashboard** - superadmin-vy för att hantera alla företag

### Backend/Databas
- Supabase med tabeller för: companies, profiles, user_roles, vendors, expenses, integrations, monthly_summaries, category_summaries, saas_summaries, invitations
- RLS-policies för säker dataåtkomst
- Auth med e-post/lösenord

### Vad som INTE fungerar (mock-data)
- **All data på Dashboard, Expenses, SaaS, Vendors är hårdkodad mock-data**
- Ingen riktig koppling till databasen för utgifter
- Inga edge functions för integrationer
- Ingen betalning via Stripe

---

## Roadmap - Prioriterade funktioner

### Fas 1: Koppla gränssnittet till riktig data
Byt ut mock-data mot Supabase-queries så att:
- Dashboard hämtar summaries och expenses från databasen
- Expenses-sidan visar riktiga utgifter
- SaaS och Vendors visar riktiga leverantörer
- Settings visar det inloggade företagets info

### Fas 2: Edge Functions för integrationer
Bygg edge functions som:
- `kleer-sync`: Hämtar data från Kleer API och sparar i expenses/vendors
- `fortnox-sync`: Hämtar fakturor från Fortnox API
- `recalculate-summaries`: Uppdaterar monthly/category/saas_summaries efter synk

### Fas 3: Stripe-betalning
Integrera Stripe för att hantera prenumerationer:
- **Checkout** - När trial går ut eller användare klickar "Uppgradera"
- **Customer Portal** - För att hantera betalningsmetod och se fakturor
- **Webhooks** - Uppdatera subscription_status i databasen
- **Prismodell**: 499 kr/mån + 99 kr per extra användare

### Fas 4: Onboarding och registrering
- Skapa företag vid registrering (nu finns bara mock-länkning)
- Skicka välkomst-mail
- Guided onboarding-steg för att ansluta integration

### Fas 5: Team-funktionalitet
- Bjud in användare via e-post (invitations-tabellen finns)
- Acceptera inbjudan och koppla till företag
- Rollhantering (owner, admin, member)

### Fas 6: Export och rapporter
- PDF-export av månadsrapport
- CSV-export av utgifter

---

## Förslag: Nästa steg

Baserat på nuläget rekommenderar jag denna ordning:

```text
1. Stripe-integration        <- Du vill ha denna
   |
2. Riktig data (inte mock)   <- Förutsättning för att appen ska vara användbar
   |
3. Kleer/Fortnox sync        <- Kärnfunktionen
   |
4. Registrering + Onboarding <- Nya kunder kan komma igång
   |
5. Team/Inbjudningar         <- Fler användare per företag
   |
6. Export/Rapporter          <- Nice-to-have
```

---

## Teknisk plan: Stripe-integration

### Steg 1: Aktivera Stripe
Använd Lovables inbyggda Stripe-verktyg för att:
- Skapa produkter och priser (Spendo Pro 499 kr/mån)
- Konfigurera webhooks

### Steg 2: Skapa Edge Functions
```text
supabase/functions/
  ├── create-checkout-session/    # Startar betalning
  ├── create-portal-session/      # Öppnar Stripe kundportal
  └── stripe-webhook/             # Tar emot events från Stripe
```

### Steg 3: Uppdatera Settings-sidan
- "Uppgradera"-knappen startar checkout
- Visa aktuell prenumerationsstatus
- "Hantera betalning"-länk till kundportalen

### Steg 4: Webhook-logik
När Stripe skickar events:
- `checkout.session.completed` -> Sätt `subscription_status = 'active'`
- `customer.subscription.deleted` -> Sätt `subscription_status = 'canceled'`
- `invoice.payment_failed` -> Sätt `subscription_status = 'past_due'`

### Steg 5: Trial-hantering
- Vid registrering: `trial_ends_at = now() + 14 dagar`
- Visa nedräkning i UI
- Blockera/begränsa funktioner när trial gått ut

---

## Databas-schema (redan klart)
```text
companies.subscription_status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid'
companies.trial_ends_at: timestamp
companies.base_price_per_month: 499
companies.extra_user_price: 99
```

---

## Sammanfattning

**Vad du ska börja med:**
1. Aktivera Stripe via Lovables verktyg
2. Skapa checkout och webhook-funktioner
3. Koppla "Uppgradera"-knappen på Settings-sidan

**Parallellt:**
- Byt ut mock-data mot riktig data från Supabase
- Bygg synk-funktioner för Kleer/Fortnox

Ska jag börja med Stripe-integrationen?

