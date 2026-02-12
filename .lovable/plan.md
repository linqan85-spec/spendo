
# Fortnox-integration -- fullständig OAuth2 + synk

## Nuläge

Fortnox-kopplingen är idag en stub. ConnectFortnoxDialog sparar Client ID/Secret direkt i databasen utan att faktiskt ansluta mot Fortnox API. Sync-knappen visar bara en toast. Det finns ingen OAuth2-flöde och ingen edge function för Fortnox.

## Vad som behöver byggas

Fortnox kräver ett **OAuth2 Authorization Code**-flöde:

1. Användaren klickar "Anslut" och skickas till Fortnox inloggning
2. Fortnox skickar tillbaka en authorization code via redirect
3. Vi byter koden mot access_token + refresh_token via en edge function
4. Vi använder access_token för att hämta leverantörsfakturor
5. Tokens refreshas automatiskt vid behov

```text
+------------------+       +-------------------+       +------------------+
| Spendo Frontend  | ----> | Fortnox OAuth     | ----> | fortnox-callback |
| (redirect)       |       | (user authorizes) |       | (edge function)  |
+------------------+       +-------------------+       +------------------+
                                                               |
                                                     Exchange code for tokens
                                                     Save to integrations table
                                                               |
                                                        +------v------+
                                                        | fortnox-sync|
                                                        | (edge func) |
                                                        +-------------+
                                                               |
                                                     Fetch supplier invoices
                                                     Save as expenses + vendors
```

## Steg-för-steg

### 1. Spara Fortnox Client ID och Client Secret som Supabase secrets

Dessa behövs i edge functions och ska **inte** lagras i koden. Jag kommer be dig mata in:
- `FORTNOX_CLIENT_ID`
- `FORTNOX_CLIENT_SECRET`

### 2. Ny edge function: `fortnox-callback`

Hanterar OAuth2-callbacken:
- Tar emot `code` och `state` (state = company_id) från Fortnox redirect
- Byter authorization code mot access_token + refresh_token via `POST https://apps.fortnox.se/oauth-v1/token`
- Sparar tokens i `integrations`-tabellen (med service role key)
- Redirectar tillbaka till `/integrations` i appen

### 3. Ny edge function: `fortnox-sync`

Hämtar utgiftsdata från Fortnox API:
- Läser access_token från `integrations`-tabellen
- Om token är utgången, refreshar den automatiskt via refresh_token
- Hämtar **leverantörsfakturor** (`GET https://api.fortnox.se/3/supplierinvoices`) med paginering
- Hämtar **leverantörer** (`GET https://api.fortnox.se/3/suppliers`) för leverantörsnamn
- Skapar/uppdaterar vendors och expenses i databasen
- Uppdaterar `last_synced_at` på integrationen

### 4. Uppdatera ConnectFortnoxDialog

Istället för att be om Client ID/Secret i formuläret:
- Knappen "Anslut Fortnox" startar OAuth-flödet genom att öppna Fortnox auth-URL i ett nytt fönster/redirect
- Auth-URL:en inkluderar redirect_uri som pekar mot `fortnox-callback` edge function
- State-parametern sätter vi till company_id för att koppla rätt

### 5. Uppdatera FortnoxIntegration sync-knapp

- "Synka"-knappen anropar `fortnox-sync` edge function
- Visar loading-state medan synken pågår
- Visar resultat (antal hämtade fakturor) eller felmeddelande

### 6. Redirect URI-konfiguration

Du behöver sätta redirect URI i Fortnox Developer Portal till:
```
https://jbvjzepgltpxwojrnrpo.supabase.co/functions/v1/fortnox-callback
```

## Teknisk detalj

### Scopes som behövs i Fortnox-appen
- `supplierinvoice` -- leverantörsfakturor (huvuddata)
- `supplier` -- leverantörsinfo (namn, org.nr)
- `companyinformation` -- företagsinfo (för verifiering)

### Token-hantering
- Access tokens varar ca 1 timme
- Refresh tokens varar tills de används (engångs)
- Varje refresh ger nya access_token + refresh_token
- Edge function hanterar detta transparent

### Data-mappning
| Fortnox-fält | Spendo-fält |
|---|---|
| SupplierInvoice.Total | expenses.amount |
| SupplierInvoice.InvoiceDate | expenses.transaction_date |
| SupplierInvoice.SupplierName | vendors.name |
| SupplierInvoice.GivenNumber | expenses.external_id |
| SupplierInvoice.VAT | expenses.vat_amount |

### Filer som skapas/ändras
- **Ny**: `supabase/functions/fortnox-callback/index.ts`
- **Ny**: `supabase/functions/fortnox-sync/index.ts`
- **Ändra**: `supabase/config.toml` (verify_jwt = false för nya funktioner)
- **Ändra**: `src/components/integrations/ConnectFortnoxDialog.tsx` (OAuth-redirect istället för formulär)
- **Ändra**: `src/components/integrations/FortnoxIntegration.tsx` (riktig sync-funktion)
- **Ändra**: `src/locales/sv/translation.json` (nya översättningssträngar)
