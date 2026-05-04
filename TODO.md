# SunTanApp - ToDo List per la Pubblicazione

Questo file contiene tutte le cose che abbiamo lasciato in sospeso e che dovremo sistemare PRIMA di inviare l'app ad Apple per la revisione finale.

## 📌 App Store Connect (Burocrazia e Store)
- [ ] **Aggiornare gli Screenshot degli Abbonamenti**: Attualmente abbiamo inserito uno screenshot "a caso" nella sezione *Informazioni per la verifica* di App Store Connect (sui pacchetti mensile, trimestrale e annuale). Quando avremo completato il design finale della `PremiumModal`, dovremo fare uno screenshot reale della pagina di pagamento e caricarlo al posto di quello finto, altrimenti Apple ci boccia l'abbonamento.
- [ ] **Iscriversi all'Apple Small Business Program**: Fare richiesta ufficiale su [developer.apple.com/programs/app-store-small-business-program/](https://developer.apple.com/programs/app-store-small-business-program/) per ridurre la commissione di Apple dal 30% al 15%. Una volta approvati, aggiornare la data di inizio su RevenueCat.
- [ ] **Caricare gli Screenshot dell'App Store**: Fare gli screenshot promozionali delle varie schermate (Home, Timer, Profilo) da inserire nella pagina principale dell'App Store.
- [ ] **Testo Promozionale e Descrizione**: Scrivere la descrizione completa in inglese e italiano per l'App Store.

## 💻 Sviluppo e Codice (Next Steps)
- [ ] **Design della Premium Modal**: Trasformare l'attuale pagina di pagamento di base in una vera e propria landing page accattivante con i 3 pacchetti.
- [ ] **Gating delle Funzionalità Premium**: Inserire i lucchetti su Biometrics Vault, Strategia Domani, ecc.
- [ ] **Collegamento RevenueCat**: Integrare gli ID (`glowy_annual`, ecc.) nel codice per gestire i pagamenti reali tramite RevenueCat.
