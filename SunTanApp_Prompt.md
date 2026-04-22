# Specifiche e Funzionalità per lo Sviluppo: Sun Tanning Tracker App

## 1. Descrizione Generale
Un'applicazione mobile premium in stile nativo iOS dedicata al mondo del Tanning (abbronzatura). L'app funziona come un "coach" personale: mappa l'indice UV locale, calcola o gestisce i tempi al sole per prevenire ustioni, monitora l'idratazione e tiene traccia dei progressi visivi e statistici dell'utente.

## 2. Direzione Artistica ed Estetica
L'app deve sembrare un prodotto di lusso moderno e super fluido:
- **Gradienti Vibranti in Background**: Lo sfondo globale dell'applicazione deve essere ricoperto da un bellissimo gradiente dinamico e caldo (colori da interpolare: `#FFDE00` (giallo scuro), `#fb693dff` (arancione neon), `#ff0000ff` (rosso)). Niente sfondi bianchi o neri piatti.
- **Effetto Glassmorphism 3D**: Tutti i menu, i blocchi di testo, i bottoni e in particolare le "caselle" (widget della dashboard) devono avere quell'effetto acrilico di iOS (sfocato, semi-trasparente, con ombre morbide 3D e bordi chiari).
- **Tipografia Premium**: Testi grandi, ad alto contrasto per essere letti al sole, ed elementi dei timer in "tabular-nums" perché non ballino durante il conteggio dei secondi.

## 3. Architettura delle Pagine (3 Tab in Basso)

### 📊 Tab 1 (Sinistro): Dashboard Dati e UV
Questa schermata è il centro di controllo giornaliero:
1. **Radar UV**: In alto, una lista/grafico dei giorni e degli orari con il relativo **Indice UV previsto per ogni ora**, insieme in grande all'Indice UV attuale di quel momento.
2. **Griglia Widget (Dashboard Salute)**: Sotto la sezione UV ci sarà una griglia di caselle d'impatto (con forte effetto Glassmorphism 3D, ombreggiature e blur). Queste mostreranno:
   - Tempo totale passato sotto il sole (oggi/settimana).
   - Livello (o quantitativo) di Vitamina D assimilata.
   - Quanta acqua/idratazione è stata stimata/persa.
   - Cronologia Comparativa: un confronto grafico di quanto tempo si è passati al sole rispetto alla settimana o al mese precedente.
3. **Sezione Collabora**: A fondo pagina, un piccolo ma accattivante form o un banner/bottone che invita a "Premere qui per collaborare con noi" o per i contatti, in modo da creare community/coinvolgimento.

### ⏱️ Tab 2 (Centrale): Smart Tracker (Home App)
La pagina principale in cui si avvia la sessione al sole. Offre due modalità:
1. **Timer Automatico (Smart Coach)**: 
   - L'utente fa partire il sistema. 
   - In alto compare un grande e bellissimo timer. 
   - *Sotto il timer*, compaiono gradualmente elencate le varie fasi. Si vede visivamente lo stato della progressione (es. Fase 1: "Mettere la Crema", poi Fase 2: "Fronte", Fase 3: "Dorso" o intervalli per girarsi), permettendo all'utente di sapere sempre a che punto è della sua sessione.
2. **Timer Manuale (Personal Timeout)**:
   - Permette all'utente di definire "Quanto tempo ho a disposizione oggi" (tramite classiche ruote stile iOS / wheel picker).
   - Sulla base del tempo inserito manualmente, il sistema setta tutto in modo dettagliato calcolando da solo e riadattando gli eventuali blocchi sotto il timer in base al tempo scelto.

### 👤 Tab 3 (Destro): Profilo e Progressione
Questa è la schermata dedicata alla cronologia visiva e personale:
1. **Header Utente**: In altissimo appare l'Immagine o Avatar dell'utente. Appena sotto, in grandissima evidenza, lo stato o "Il grado" a cui è arrivato l'utente (es. livello o fototipo abbronzatura, "Grado Oro", ecc.).
2. **Galleria / Timeline Grafica**: Nella parte alta ci sarà la voce "Cronologia" o "I tuoi Progressi". Premendola, l'utente potrà scorrere e vedere la rassegna di tutte le sue foto e le immagini caricate nel tempo per vedere visivamente l'avanzamento della sua colorazione.
3. **Statistiche Profilo**: Al centro/basso, la schermata dovrà fare un riepilogo delle statistiche di vita del profilo, ricalcando quelle presenti nella prima Tab (quantitativo di tempo totale rimasto sotto il sole, acqua persa nel totale e le varie progressioni sommate).
4. **Conclusioni**: Nel footer della pagina troveranno spazio tutti i vari pulsanti sistema per contatti, settings e log-out.

---
**Nota per l'AI che svilupperà il codice:** Usa React Native con framework recenti (es. Expo), crea un sistema di gestione del layout estremamente premium appoggiandoti a tecnologie moderne per grafiche sfocate (es. `expo-blur`) e concentrati fortissimamente sull'effetto estetico finale.
