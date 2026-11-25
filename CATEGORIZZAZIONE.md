# Categorizzazione automatica dei movimenti

Funziona nel browser, senza server e senza intelligenza artificiale: solo regole e dizionari.
È composta da due file, caricati da `index.html` prima di `app.js`:

| File | Contenuto | Quando modificarlo |
|---|---|---|
| `categorizer-data.js` | Dati: categorie delle banche, parole chiave per tipo di operazione, dizionario degli esercenti (Italia, Singapore, Regno Unito, Stati Uniti, marchi globali) | Per aggiungere esercenti, banche o paesi |
| `categorizer.js` | Logica: pulizia del nome dell'esercente e cascata dei livelli | Raramente |

Sono file `.js` e non `.json` perché l'app si apre direttamente dal disco (`file://`), e in quel caso il browser non permette di leggere file JSON.

## Ordine di decisione
Vince il primo livello che riconosce il movimento:

1. **Scelta manuale**: non viene mai sovrascritta.
2. **Regole dell'utente**: quelle create in "Categories & rules" e quelle imparate dalle correzioni manuali.
3. **Categoria della banca** (`bank`): Fineco Moneymap, Intesa e BPER "Categoria", "Category" delle banche inglesi e americane.
4. **Tipo di operazione** (`type`): commissioni, tasse, prelievi, stipendio, affitto, rate, saldo della carta di credito, giroconti.
5. **Esercente conosciuto** (`merchant`): circa 900 marchi e parole tipiche (PIZZERIA, FARMACIA, SUPERMERCATO…).
6. **Simile a un movimento già categorizzato** (`similar`): almeno il 60% di parole in comune nel nome dell'esercente.
7. Altrimenti **Other**, da rivedere.

Nell'elenco dei movimenti l'etichetta "Auto · …" indica il livello che ha deciso. Passando il mouse sull'etichetta compare il motivo, per esempio "PASTICCERIA (IT)".

Quando correggi a mano la categoria di un movimento, l'app propone di imparare una regola per quell'esercente. I nomi vengono confrontati senza spazi, così "CONA D" e "CONAD" sono lo stesso negozio. Un nome di meno di 4 lettere non diventa mai una regola.

## Come aggiungere un esercente
In `categorizer-data.js`, nella sezione `merchants`, aggiungi il nome nella lista del paese e della categoria:

```js
IT: {
  Groceries: ['ESSELUNGA', 'CONAD', /* ... */ 'MIO SUPERMERCATO'],
```

Regole delle parole chiave:
- **Parole intere:** maiuscole senza accenti; la punteggiatura vale come spazio ("H&M" si scrive `'H M'`).
- **Inizio di parola:** `*` in fondo indica "parola che inizia con", per esempio `'SUPERMERCAT*'`.
- **Più corrispondenze:** vince la parola chiave più lunga, quindi `'UBER EATS'` vince su `'UBER'`.
- **Parole spezzate (Fineco):** le parole chiave di almeno 5 lettere vengono cercate anche nel testo senza spazi.
- **Parole ambigue:** evita parole comuni o nomi di persona (per esempio "ITALO", "SIA", "DELTA"). Usa la forma completa ("ITALO TRENO").

## Come aggiungere le categorie di una nuova banca
Nella sezione `bankCategories` aggiungi la categoria della banca, in minuscolo senza punteggiatura, e la categoria dell'app corrispondente:

```js
'spese mediche': 'Health',
'bonifici': null,   // null = troppo generica, decidono gli altri livelli
```

## Risultati misurati sul file Fineco reale (774 movimenti)
- **Con tutti i livelli:** 716 movimenti categorizzati da soli (92%).
- **Senza la categoria della banca:** 49% categorizzati, con il 96% corretto rispetto a Moneymap.
- **Simulazione d'uso, dal movimento più vecchio al più recente, con apprendimento delle correzioni:** il 79% è automatico (corretto al 97%). Gli interventi manuali sono 137 su 642, quasi tutti la prima volta che compare un piccolo esercente locale.
