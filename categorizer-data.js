/* YouBudget categorisation data — Italy, Singapore, UK/US and global brands.
   Pure data: edit or extend freely, no code changes needed.
   Keywords are matched as whole words on the normalised text (upper case, no accents, punctuation -> space).
   A trailing * means "word starting with" (SUPERMERCAT* matches SUPERMERCATO, SUPERMERCATI).
   When several keywords match, the longest one wins ("UBER EATS" beats "UBER", "ENI PLENITUDE" beats "ENI"). */
window.YB_CATEGORIZER_DATA = {
  version: 1,

  // Categories the categoriser may assign in addition to the app defaults.
  extraCategories: ['Cash', 'Taxes', 'Loans'],

  // Categories supplied by the bank in the export (Fineco "Moneymap", Intesa/BPER "Categoria", Monzo/Revolut/Starling "Category"...).
  // null = too generic, let the other levels decide.
  bankCategories: {
    // Fineco Moneymap
    'alimentari': 'Groceries', 'hotel ristoranti e viaggi': 'Dining', 'e commerce': 'Shopping', 'trasporti': 'Transport',
    'prelievo contante': 'Cash', 'giochi cultura e spettacoli': 'Entertainment', 'casa': 'Housing', 'salute e bellezza': 'Health',
    'abbigliamento e accessori': 'Shopping', 'altre entrate': 'Income', 'internet telefono e tecnologia': 'Utilities',
    'stipendio': 'Income', 'stipendi': 'Income', 'utenze': 'Utilities', 'tasse': 'Taxes', 'imposte': 'Taxes', 'assicurazioni': 'Insurance',
    'istruzione': 'Education', 'viaggi': 'Travel', 'carburante': 'Transport', 'auto': 'Transport', 'commissioni': 'Fees',
    'investimenti': 'Transfers', 'giroconti': 'Transfers', 'altre spese': null, 'bonifici': null,
    // Intesa Sanpaolo
    'imposte sul reddito e tasse varie': 'Taxes', 'bonifici ricevuti': null, 'bonifici in uscita': null, 'addebiti vari': null,
    'entrate varie': 'Income', 'spettacoli e musei': 'Entertainment', 'manutenzione veicoli': 'Transport', 'carburanti': 'Transport',
    'generi alimentari e supermercato': 'Groceries', 'ristoranti e bar': 'Dining', 'stipendi e pensioni': 'Income', 'affitto': 'Housing',
    'utenze domestiche': 'Utilities', 'telefonia internet e tv': 'Utilities', 'farmacia e salute': 'Health', 'viaggi e vacanze': 'Travel',
    'tempo libero': 'Entertainment', 'shopping': 'Shopping', 'prelievi': 'Cash', 'commissioni e spese': 'Fees',
    // BPER (mostly operation types)
    'addebito sdd rid': null, 'portafoglio': null, 'bonifico': null, 'pagamento': null, 'canone': 'Fees', 'prelievo': 'Cash',
    'rata finanziamento': 'Loans', 'rata mutuo': 'Housing',
    // English-language banks and fintechs (Monzo, Starling, Revolut, Wise, US banks)
    'groceries': 'Groceries', 'eating out': 'Dining', 'restaurants': 'Dining', 'food and drink': 'Dining', 'transport': 'Transport',
    'transportation': 'Transport', 'travel': 'Travel', 'holidays': 'Travel', 'bills': 'Utilities', 'utilities': 'Utilities',
    'entertainment': 'Entertainment', 'shopping': 'Shopping', 'general': null, 'cash': 'Cash', 'atm': 'Cash', 'personal care': 'Health',
    'health': 'Health', 'healthcare': 'Health', 'medical': 'Health', 'insurance': 'Insurance', 'education': 'Education', 'income': 'Income',
    'salary': 'Income', 'savings': 'Transfers', 'transfers': 'Transfers', 'transfer': 'Transfers', 'fees': 'Fees', 'fees and charges': 'Fees',
    'taxes': 'Taxes', 'tax': 'Taxes', 'rent': 'Housing', 'mortgage': 'Housing', 'home': 'Housing', 'housing': 'Housing', 'fuel': 'Transport',
    'gas': 'Transport', 'services': null, 'expenses': null, 'family': null, 'charity': null, 'finances': null
  },

  // Operation types: recognised from the wording of the description, before looking at the merchant.
  // Order matters: the first matching rule wins (fees before cash, so "COMMISSIONE PRELIEVO" is a fee).
  // sign: 'in' = only money in, 'out' = only money out.
  typeRules: [
    { cat: 'Transfers', label: 'credit card settlement', re: /\b(UTILIZZO CARTA DI CREDITO|ESTRATTO CONTO (AL \S+ )?CARTA|PAGAMENTO PER UTILIZZO CARTE|ADDEBITO CARTA DI CREDITO|ADDEBITO SALDO CARTA|CREDIT CARD (BILL )?PAYMENT|PAYMENT TO (CREDIT )?CARD|CARD BILL PAYMENT|AMEX PAYMENT|CARD REPAYMENT)\b/ },
    { cat: 'Transfers', label: 'own transfer / top-up', re: /\b(GIROCONTO|GIROFONDI|GIRO CONTO|TRASFERIMENTO TRA (I )?(MIEI|PROPRI) CONTI|RICARICA (POSTEPAY|SATISPAY|REVOLUT|HYPE|CARTA|PREPAGATA|CONTO)|RICARICA DA|TOP ?UP|OWN ACCOUNT|TRANSFER TO SAVINGS|TRANSFER FROM SAVINGS|INTERNAL TRANSFER|SAVINGS POT|SALVADANAIO)\b/ },
    { cat: 'Fees', label: 'bank fees', re: /\b(COMMISSION\w*|COMM\.? ?PREL\w*|CANONE (MENSILE|ANNUO|CONTO|CARTA)\w*|SPESE (TENUTA CONTO|BONIFICO|INVIO|DI GESTIONE|ISTRUTTORIA)|COMPETENZE|INTERESSI PASSIVI|INTERESSI DEBITORI|ACCOUNT FEE|MONTHLY FEE|ANNUAL FEE|SERVICE CHARGE|OVERDRAFT (FEE|INTEREST|CHARGE)|LATE (PAYMENT )?FEE|FOREIGN TRANSACTION FEE|FX FEE|NON STERLING|BANK CHARGE)\b/ },
    { cat: 'Taxes', label: 'taxes', re: /\b(F24|IMPOSTA DI BOLLO|IMPOSTA BOLLO|BOLLO (AUTO|E C|CONTO|DOSSIER)|RITENUTA\w*|TRIBUTI|TASSA RIFIUTI|TARI|IMU|AGENZIA (DELLE )?ENTRATE|IRAS|HMRC|IRS (USATAXPYMT|TREAS)|COUNCIL TAX|TAX PAYMENT|STAMP DUTY|PROPERTY TAX)\b/ },   // also money in: a tax refund stays a tax item
    { cat: 'Cash', label: 'cash withdrawal', re: /\b(PRELIEVO|PRELIEVI|PRELEVAMENTO|PREL CON CARTA|MAXIPRELIEVO|PR FINECOCARD ATM|ATM WITHDRAWAL|CASH WITHDRAWAL|CASH MACHINE|ATM CASH|WITHDRAWAL ATM|ATM(?! MILANO))\b/, sign: 'out' },
    { cat: 'Income', label: 'salary / pension', re: /\b(STIPENDIO|STIPENDI|EMOLUMENTI|ACCREDITO EMOLUMENTI|PENSIONE|INPS|CEDOLINO|SALARY|SALARIES|PAYROLL|WAGES|PAYSLIP|BACS CREDIT SALARY|GIRO SALARY)\b/, sign: 'in' },
    { cat: 'Income', label: 'interest / dividends / tax refund', re: /\b(INTERESSI ATTIVI|INTERESSI CREDITORI|CEDOLE?|DIVIDEND\w*|INTEREST (EARNED|CREDIT|PAID)|RIMBORSO (730|IRPEF|FISCALE)|TAX REFUND)\b/, sign: 'in' },
    { cat: 'Housing', label: 'rent / mortgage', re: /\b(AFFITTO|CANONE (DI )?LOCAZIONE|LOCAZIONE|CONDOMINIO|RATA MUTUO|MUTUO|RENT|MORTGAGE|HDB (RENT|LOAN)|SERVICE CONSERVANCY|TOWN COUNCIL)\b/, sign: 'out' },
    { cat: 'Loans', label: 'loan instalment', re: /\b(RATA (PRESTITO|FINANZIAMENTO)|FINANZIAMENTO|PRESTITO PERSONALE|LOAN (REPAYMENT|PAYMENT|INSTALMENT)|STUDENT LOAN)\b/, sign: 'out' },
    { cat: 'Insurance', label: 'insurance', re: /\b(ASSICURAZ\w*|POLIZZA|PREMIO ASSICURATIVO|INSURANCE)\b/, sign: 'out' },
    { cat: 'Transfers', label: 'peer-to-peer', re: /\b(PAYLAH|PAYNOW TRANSFER|VENMO|ZELLE|CASH APP)\b/ }
  ],

  // Patterns that pull the merchant / counterpart name out of a raw bank description (first match wins).
  merchantPatterns: [
    /\bPRESSO:?\s+(.+?)(?:\s+CARTA\b|\s+CARD\b|\s+ALLE ORE\b|$)/,
    /\bC\/O\s+(.+?)(?:\s+(?:RIF|MANDATO)\b|$)/,
    /\b(?:BENEFICIARIO|BENEF|BEN|A FAVORE DI)\s*:?\s+(.+?)(?:\s+(?:IBAN|IB AN|DATA|INS|DA|CAUSALE|CAU|RIF|TRN|BIC|PER)\b|$)/,
    /\b(?:ORDINANTE|ORD|ANAGRAFICA ORDINANTE)\s*[:.]?\s*(.+?)(?:\s+(?:DT|BENEFICIARIO|CAUSALE|RIF|TRN|NOTE|BANCA)\b|$)/,
    /\b(?:CREDITORE|AZIENDA)\s*:?\s+(.+?)(?:\s+(?:MANDATO|ID|RIF|CODICE)\b|$)/,
    /\b(?:CARD PAYMENT TO|PAYMENT TO|PURCHASE AT|POS PURCHASE|VISA PURCHASE|DEBIT CARD PURCHASE|CONTACTLESS PAYMENT|NETS QR|NETS)\s+(.+?)(?:\s+ON\s+\d|$)/
  ],

  // Words removed from merchant names (payment processors, card noise, countries, big cities).
  noisePrefixes: ['SUMUP', 'SQ', 'SQU', 'ZETTLE', 'IZETTLE', 'PAYPAL', 'NYX', 'SATISPAY', 'STRIPE', 'IZ', 'PP', 'TST', 'CRV', 'GOOGLE PAY', 'APPLE PAY', 'POS', 'VISA', 'MASTERCARD', 'MAESTRO', 'PAGOBANCOMAT', 'BANCOMAT', 'PAGAMENTO', 'PAG', 'CONTACTLESS'],
  noiseWords: ['IT', 'ITA', 'ITALIA', 'GB', 'GBR', 'UK', 'SG', 'SGP', 'SINGAPORE', 'US', 'USA', 'LU', 'LUX', 'IE', 'IRL', 'NL', 'NLD', 'DE', 'DEU', 'FR', 'FRA', 'ES', 'ESP',
    'ROMA', 'MILANO', 'TORINO', 'NAPOLI', 'FIRENZE', 'BOLOGNA', 'GENOVA', 'VENEZIA', 'PALERMO', 'BARI', 'VERONA', 'PADOVA', 'LONDON', 'MANCHESTER', 'NEW YORK', 'NY', 'CA', 'SAN FRANCISCO',
    'SRL', 'S R L', 'SPA', 'S P A', 'SNC', 'SAS', 'LTD', 'LIMITED', 'PLC', 'INC', 'LLC', 'PTE', 'CO', 'EU', 'SARL'],

  // Merchant dictionary by region. Regions are all active: brand names rarely collide across countries.
  merchants: {
    GLOBAL: {
      Shopping: ['AMAZON', 'AMZN', 'AMZN MKTP', 'AMAZON MKTPLACE', 'EBAY', 'ALIEXPRESS', 'TEMU', 'SHEIN', 'ZALANDO', 'IKEA', 'DECATHLON', 'ZARA', 'H M', 'UNIQLO', 'PRIMARK',
        'APPLE STORE', 'SEPHORA', 'ETSY', 'VINTED', 'WISH'],
      Entertainment: ['NETFLIX', 'SPOTIFY', 'DISNEY PLUS', 'DISNEYPLUS', 'DISNEY', 'PRIME VIDEO', 'AMAZON PRIME', 'YOUTUBE', 'APPLE COM BILL', 'ITUNES', 'GOOGLE PLAY', 'DAZN',
        'PLAYSTATION', 'STEAM', 'STEAMGAMES', 'XBOX', 'NINTENDO', 'AUDIBLE', 'TWITCH', 'PARAMOUNT', 'CRUNCHYROLL', 'TICKETMASTER'],
      Utilities: ['MICROSOFT', 'OFFICE 365', 'ADOBE', 'DROPBOX', 'GOOGLE STORAGE', 'GOOGLE ONE', 'ICLOUD', 'OPENAI', 'CHATGPT', 'CANVA', 'NOTION', 'GITHUB'],
      Transport: ['UBER', 'BOLT', 'FREE NOW', 'FREENOW', 'LIME', 'SHELL', 'ESSO', 'BP', 'TOTALENERGIES', 'HERTZ', 'AVIS', 'EUROPCAR', 'SIXT'],
      Dining: ['MCDONALD', 'MCDONALDS', 'BURGER KING', 'KFC', 'STARBUCKS', 'SUBWAY', 'DOMINO S', 'DOMINOS', 'PIZZA HUT', 'UBER EATS', 'UBEREATS', 'DELIVEROO', 'JUST EAT', 'GLOVO',
        'FOODPANDA', 'FIVE GUYS', 'TIM HORTONS'],
      Travel: ['BOOKING', 'BOOKING COM', 'AIRBNB', 'EXPEDIA', 'HOTELS COM', 'AGODA', 'TRIVAGO', 'RYANAIR', 'EASYJET', 'WIZZ AIR', 'WIZZAIR', 'VUELING', 'VOLOTEA', 'LUFTHANSA',
        'EMIRATES', 'QATAR AIRWAYS', 'KLM', 'AIR FRANCE', 'BRITISH AIRWAYS', 'MARRIOTT', 'HILTON', 'ACCOR', 'NH HOTEL', 'BEST WESTERN', 'HOTEL', 'HOSTEL', 'MOTEL'],
      Health: ['PHARMACY', 'CLINIC', 'DENTAL', 'DENTIST', 'HOSPITAL', 'OPTICIAN', 'OPTICAL', 'MEDICAL'],
      Education: ['UNIVERSITY', 'SCHOOL', 'COLLEGE', 'TUITION', 'UDEMY', 'COURSERA'],
      Transfers: ['WISE', 'TRANSFERWISE', 'REVOLUT', 'N26']
    },
    IT: {
      Groceries: ['ESSELUNGA', 'CONAD', 'COOP', 'IPERCOOP', 'LIDL', 'EUROSPIN', 'CARREFOUR', 'PAM', 'PANORAMA', 'DESPAR', 'EUROSPAR', 'INTERSPAR', 'SPAR', 'SIGMA', 'CRAI',
        'MD DISCOUNT', 'MD SPA', 'PENNY', 'PENNY MARKET', 'IPER', 'BENNET', 'TIGRE', 'TODIS', 'IN S MERCATO', 'FAMILA', 'UNES', 'IL GIGANTE', 'ALDI', 'NATURASI', 'DECO',
        'SISA', 'PRIX', 'TUODI', 'DPIU', 'SUPERMERCAT*', 'IPERMERCAT*', 'MINIMARKET', 'MINI MARKET', 'ALIMENTARI', 'MACELLERIA', 'ORTOFRUTTA', 'FRUTTA E VERDURA',
        'PEWEX', 'PANIFICIO', 'FORNO', 'SALUMERIA', 'PESCHERIA', 'DROGHERIA'],
      Dining: ['BAR', 'BAR TABACCHI', 'CAFFE', 'CAFFETTERIA', 'CAFE', 'RISTORANTE', 'RISTORAZIONE', 'TRATTORIA', 'OSTERIA', 'PIZZERIA', 'PIZZA', 'PASTICCERIA', 'GELATERIA', 'ROSTICCERIA',
        'PANINOTECA', 'BIRRERIA', 'ENOTECA', 'SUSHI', 'KEBAB', 'AUTOGRILL', 'CHEF EXPRESS', 'SARNI', 'OLD WILD WEST', 'ROADHOUSE', 'SPONTINI', 'TAVOLA CALDA', 'BRACERIA', 'POKE'],
      Transport: ['TRENITALIA', 'ITALO TRENO', 'ITALOTRENO', 'ITALO SPA', 'NTV', 'TRENORD', 'ATAC', 'ATM MILANO', 'GTT', 'ANM', 'TPER', 'AMT', 'COTRAL', 'ACTV', 'BUSITALIA', 'FLIXBUS', 'ITABUS',
        'BLABLACAR', 'TELEPASS', 'AUTOSTRADE', 'AUTOSTRADE PER L ITALIA', 'PEDAGGIO', 'ENI', 'ENILIVE', 'ENI STATION', 'AGIP', 'Q8', 'TAMOIL', 'IP STATION', 'ITALIANA PETROLI',
        'TOTALERG', 'CARBURANT*', 'DISTRIBUTORE', 'STAZIONE DI SERVIZIO', 'PARCHEGG*', 'EASYPARK', 'MYCICERO', 'TAXI', 'ITTAXI', 'RADIOTAXI', 'MOOVIT', 'ENJOY', 'SHARE NOW',
        'GOMMISTA', 'AUTOFFICINA', 'OFFICINA', 'CARROZZERIA', 'REVISIONE'],
      Utilities: ['ENEL', 'ENEL ENERGIA', 'SERVIZIO ELETTRICO NAZIONALE', 'A2A', 'HERA', 'IREN', 'ACEA', 'EDISON', 'SORGENIA', 'ENI PLENITUDE', 'PLENITUDE', 'ILLUMIA', 'OCTOPUS',
        'E ON', 'ENEGAN', 'ACQUEDOTTO', 'SMAT', 'GORI', 'ABBANOA', 'TIM SPA', 'TELECOM ITALIA', 'TIM S P A', 'VODAFONE', 'WINDTRE', 'WIND TRE', 'ILIAD', 'FASTWEB', 'HO MOBILE',
        'VERY MOBILE', 'KENA', 'POSTEMOBILE', 'COOPVOCE', 'TISCALI', 'LINKEM', 'EOLO', 'SKY WIFI'],
      Entertainment: ['SKY ITALIA', 'SKY', 'NOW TV', 'TIMVISION', 'INFINITY', 'MEDIASET', 'CINEMA', 'UCI CINEMAS', 'THE SPACE', 'TICKETONE', 'VIVATICKET', 'MUSEO', 'TEATRO',
        'PALESTRA', 'PISCINA', 'LOTTOMATICA', 'SISAL', 'SNAI', 'GRATTA E VINCI'],
      Health: ['FARMACIA', 'PARAFARMACIA', 'SANITARIA', 'OSPEDALE', 'POLIAMBULATORIO', 'POLICLINICO', 'STUDIO DENTISTICO', 'DENTIST*', 'ODONTOIATR*', 'OTTICA', 'LABORATORIO ANALISI',
        'ASL', 'ASST', 'AUSL', 'TICKET SANITARIO', 'VETERINARI*', 'FISIOTERAPI*', 'MEDICO'],
      Shopping: ['MEDIAWORLD', 'MEDIA WORLD', 'UNIEURO', 'EURONICS', 'TRONY', 'EXPERT', 'OVS', 'COIN', 'RINASCENTE',
        'CALZEDONIA', 'INTIMISSIMI', 'TEZENIS', 'BENETTON', 'KIKO', 'DOUGLAS', 'ACQUA E SAPONE', 'TIGOTA', 'PITTARELLO', 'FELTRINELLI', 'MONDADORI', 'LIBRERIA', 'TABACCHI',
        'TABACCHERIA', 'EDICOLA', 'PROFUMERIA', 'PAGA IN 3 RATE', 'ABBIGLIAMENTO', 'CALZATURE', 'TERRANOVA', 'PIAZZA ITALIA',
        'TEDI', 'FLYING TIGER', 'ARCAPLANET', 'ZOOPLUS'],
      Housing: ['FERRAMENTA', 'LEROY MERLIN', 'BRICOMAN', 'BRICOCENTER', 'BRICOFER', 'OBI', 'BRICO', 'MAISONS DU MONDE', 'JYSK', 'MONDO CONVENIENZA',
        'CASALINGHI', 'ARREDAMENT*', 'MOBILIFICIO', 'TENDAGGI', 'DITUTTO'],
      Insurance: ['GENERALI', 'UNIPOL', 'UNIPOLSAI', 'ALLIANZ', 'AXA', 'ZURICH', 'REALE MUTUA', 'CATTOLICA', 'PRIMA ASSICURAZIONI', 'LINEAR', 'GENIALLOYD', 'VERTI', 'HELVETIA',
        'GROUPAMA', 'SARA ASSICURAZIONI', 'VITTORIA ASSICURAZIONI', 'POSTE ASSICURA'],
      Education: ['SCUOLA', 'UNIVERSITA*', 'ATENEO', 'POLITECNICO', 'ASILO', 'NIDO', 'MENSA SCOLASTICA', 'LIBRI SCOLASTICI'],
      Travel: ['ALBERGO', 'B B', 'BED AND BREAKFAST', 'AGRITURISMO', 'ITA AIRWAYS', 'ALITALIA', 'AEROPORTO', 'MOBY', 'TIRRENIA', 'GRIMALDI', 'GNV', 'TRAGHETT*', 'CAMPEGGIO'],
      Transfers: ['SATISPAY EUROPE', 'HYPE', 'POSTEPAY', 'BUDDYBANK']
    },
    SG: {
      Groceries: ['NTUC FAIRPRICE', 'FAIRPRICE', 'FAIRPRICE FINEST', 'COLD STORAGE', 'GIANT', 'SHENG SIONG', 'DON DON DONKI', 'DONKI', 'PRIME SUPERMARKET', 'REDMART', 'MARKS SPENCER',
        'U STARS', 'HAO MART', 'MUSTAFA', 'CS FRESH', 'JASONS DELI'],
      Dining: ['KOPITIAM', 'FOOD REPUBLIC', 'FOOD JUNCTION', 'TOAST BOX', 'YA KUN', 'BREADTALK', 'OLD CHANG KEE', 'DIN TAI FUNG', 'JOLLIBEE', 'MOS BURGER', 'SUKIYA', 'HAWKER',
        'FOOD COURT', 'COFFEE BEAN', 'GRABFOOD', 'GRAB FOOD', 'KOI', 'LIHO', 'CHAGEE', 'MR BEAN', 'ALCHEMIST', 'POKE THEORY'],
      Transport: ['GRAB', 'GOJEK', 'COMFORTDELGRO', 'CDG TAXI', 'TADA', 'RYDE', 'SMRT', 'TRANSITLINK', 'SIMPLYGO', 'EZ LINK', 'EZLINK', 'BUS MRT', 'SINGAPORE PETROLEUM', 'SPC',
        'CALTEX', 'ERP', 'LTA', 'PARKING COM SG', 'CARPARK'],
      Utilities: ['SP SERVICES', 'SP GROUP', 'SINGTEL', 'STARHUB', 'M1 LIMITED', 'M1', 'CIRCLES LIFE', 'MYREPUBLIC', 'VIEWQWEST', 'GENECO', 'SENOKO', 'TUAS POWER', 'KEPPEL ELECTRIC'],
      Health: ['GUARDIAN', 'WATSONS', 'UNITY', 'POLYCLINIC', 'RAFFLES MEDICAL', 'PARKWAY', 'MOUNT ELIZABETH', 'TAN TOCK SENG', 'NUH', 'SGH', 'KKH'],
      Shopping: ['LAZADA', 'SHOPEE', 'QOO10', 'TAOBAO', 'COURTS', 'HARVEY NORMAN', 'BEST DENKI', 'CHALLENGER', 'POPULAR BOOKSTORE', 'DAISO', 'MUJI', 'TAKASHIMAYA', 'ION ORCHARD',
        'CHARLES KEITH', 'LOVE BONITO', 'COTTON ON'],
      Entertainment: ['GOLDEN VILLAGE', 'SHAW THEATRES', 'CATHAY CINEPLEXES', 'SENTOSA', 'MANDAI', 'UNIVERSAL STUDIOS SINGAPORE', 'KLOOK', 'SISTIC', 'ACTIVESG'],
      Insurance: ['NTUC INCOME', 'INCOME INSURANCE', 'AIA', 'GREAT EASTERN', 'PRUDENTIAL', 'MSIG', 'AVIVA', 'SINGLIFE', 'FWD INSURANCE', 'TOKIO MARINE', 'HSBC LIFE', 'MANULIFE'],
      Education: ['NATIONAL UNIVERSITY OF SINGAPORE', 'NANYANG TECHNOLOGICAL', 'SINGAPORE MANAGEMENT UNIVERSITY', 'SIM GLOBAL', 'SKILLSFUTURE', 'KUMON', 'MINISTRY OF EDUCATION'],
      Travel: ['SINGAPORE AIRLINES', 'SCOOT', 'JETSTAR', 'AIRASIA', 'CHANGI', 'CATHAY PACIFIC', 'MALAYSIA AIRLINES'],
      Housing: ['HDB', 'HOUSING DEVELOPMENT BOARD', 'TOWN COUNCIL'],
      Taxes: ['IRAS'],
      Transfers: ['CPF', 'PAYNOW', 'YOUTRIP', 'DBS PAYLAH']
    },
    UK: {
      Groceries: ['TESCO', 'SAINSBURY', 'SAINSBURYS', 'ASDA', 'MORRISONS', 'WAITROSE', 'CO OP', 'COOPERATIVE', 'ICELAND FOODS', 'OCADO', 'M S SIMPLY FOOD', 'MARKS SPENCER', 'MARKS AND SPENCER',
        'BUDGENS', 'NISA', 'LONDIS', 'SPAR', 'FARMFOODS', 'ABEL COLE', 'GOUSTO', 'HELLOFRESH'],
      Dining: ['PRET', 'PRET A MANGER', 'GREGGS', 'COSTA COFFEE', 'CAFFE NERO', 'NANDOS', 'WAGAMAMA', 'ITSU', 'WASABI', 'PIZZA EXPRESS', 'WETHERSPOON',
        'JD WETHERSPOON', 'TOBY CARVERY', 'HONEST BURGERS', 'DISHOOM', 'PUB'],
      Transport: ['TFL', 'TRANSPORT FOR LONDON', 'TRAINLINE', 'NATIONAL RAIL', 'AVANTI', 'LNER', 'GWR', 'SOUTHERN RAIL', 'THAMESLINK', 'SOUTH WESTERN RAILWAY', 'NORTHERN TRAINS',
        'SCOTRAIL', 'NATIONAL EXPRESS', 'STAGECOACH', 'ADDISON LEE', 'RINGGO', 'PAYBYPHONE', 'JUSTPARK', 'DVLA', 'CONGESTION CHARGE', 'ULEZ', 'HALFORDS', 'KWIK FIT'],
      Utilities: ['BRITISH GAS', 'OCTOPUS ENERGY', 'EDF', 'EDF ENERGY', 'E ON', 'EON NEXT', 'OVO', 'SCOTTISH POWER', 'SSE', 'THAMES WATER', 'ANGLIAN WATER', 'SEVERN TRENT',
        'UNITED UTILITIES', 'YORKSHIRE WATER', 'BT', 'BT GROUP', 'VIRGIN MEDIA', 'TALKTALK', 'PLUSNET', 'HYPEROPTIC', 'COMMUNITYFIBRE', 'EE', 'O2', 'THREE UK', 'GIFFGAFF',
        'SKY UK', 'SKY DIGITAL', 'TV LICENCE', 'TV LICENSING'],
      Health: ['BOOTS', 'SUPERDRUG', 'LLOYDS PHARMACY', 'NHS', 'SPECSAVERS', 'BUPA', 'VISION EXPRESS', 'PUREGYM', 'THE GYM GROUP', 'DAVID LLOYD'],
      Shopping: ['ARGOS', 'JOHN LEWIS', 'CURRYS', 'ASOS', 'BOOHOO', 'NEXT RETAIL', 'NEXT PLC', 'TK MAXX', 'SPORTS DIRECT', 'JD SPORTS', 'WHSMITH', 'WATERSTONES', 'B Q STORES', 'WICKES',
        'SCREWFIX', 'TOOLSTATION', 'DUNELM', 'HOMEBASE', 'WILKO', 'POUNDLAND', 'B M STORES', 'THE RANGE', 'SELFRIDGES', 'HARRODS', 'SAVERS', 'HOBBYCRAFT', 'PETS AT HOME'],
      Insurance: ['AVIVA', 'DIRECT LINE', 'ADMIRAL', 'LV INSURANCE', 'CHURCHILL', 'HASTINGS', 'LEGAL GENERAL', 'ROYAL LONDON', 'VITALITY', 'AXA'],
      Entertainment: ['ODEON', 'CINEWORLD', 'VUE', 'NOW TV', 'BRITBOX', 'SKY CINEMA', 'NATIONAL LOTTERY', 'BET365', 'PADDY POWER', 'WILLIAM HILL'],
      Travel: ['EUROSTAR', 'PREMIER INN', 'TRAVELODGE', 'JET2', 'TUI', 'HEATHROW', 'GATWICK'],
      Taxes: ['HMRC', 'COUNCIL TAX'],
      Transfers: ['MONZO', 'STARLING', 'CHASE UK', 'PAYPAL TRANSFER']
    },
    US: {
      Groceries: ['WALMART', 'KROGER', 'SAFEWAY', 'WHOLE FOODS', 'WHOLEFDS', 'TRADER JOE', 'TRADER JOES', 'COSTCO', 'PUBLIX', 'ALBERTSONS', 'HEB', 'WEGMANS', 'FOOD LION',
        'GIANT EAGLE', 'STOP SHOP', 'HARRIS TEETER', 'MEIJER', 'SPROUTS', 'INSTACART', 'SAMS CLUB', 'VONS', 'RALPHS', 'HY VEE', 'WINCO'],
      Dining: ['CHIPOTLE', 'DUNKIN', 'TACO BELL', 'WENDY S', 'WENDYS', 'CHICK FIL A', 'PANERA', 'SHAKE SHACK', 'IN N OUT', 'POPEYES', 'ARBY S', 'SONIC', 'DOORDASH', 'GRUBHUB',
        'POSTMATES', 'SEAMLESS', 'PANDA EXPRESS', 'OLIVE GARDEN', 'APPLEBEE', 'IHOP', 'DENNY S', 'CHILI S', 'JAMBA'],
      Transport: ['LYFT', 'MTA', 'AMTRAK', 'BART', 'CLIPPER', 'VENTRA', 'SEPTA', 'WMATA', 'CHEVRON', 'EXXON', 'EXXONMOBIL', 'MOBIL', 'SPEEDWAY', 'SUNOCO', 'MARATHON PETRO', 'VALERO',
        'CIRCLE K', 'WAWA', 'QUIKTRIP', 'SHEETZ', 'ARCO', 'EZPASS', 'E ZPASS', 'FASTRAK', 'SUNPASS', 'PARKMOBILE', 'SPOTHERO', 'JIFFY LUBE', 'AUTOZONE'],
      Utilities: ['COMCAST', 'XFINITY', 'VERIZON', 'AT T', 'T MOBILE', 'TMOBILE', 'SPECTRUM', 'CHARTER COMM', 'COX COMMUNICATIONS', 'PG E', 'CON EDISON', 'CONED', 'DUKE ENERGY',
        'SOUTHERN CALIFORNIA EDISON', 'NATIONAL GRID', 'DOMINION ENERGY', 'XCEL ENERGY', 'GEORGIA POWER', 'FPL', 'WATER UTILITY', 'GOOGLE FI', 'MINT MOBILE', 'CRICKET WIRELESS'],
      Health: ['CVS', 'WALGREENS', 'RITE AID', 'KAISER', 'LABCORP', 'QUEST DIAGNOSTICS', 'PLANET FITNESS', 'EQUINOX', 'ONE MEDICAL'],
      Shopping: ['TARGET', 'HOME DEPOT', 'LOWE S', 'LOWES', 'BEST BUY', 'MACY S', 'MACYS', 'NORDSTROM', 'KOHL S', 'TJ MAXX', 'MARSHALLS', 'ROSS STORES', 'OLD NAVY', 'GAP',
        'BED BATH', 'WAYFAIR', 'CHEWY', 'PETSMART', 'PETCO', 'DOLLAR TREE', 'DOLLAR GENERAL', 'FAMILY DOLLAR', '7 ELEVEN', 'BARNES NOBLE', 'STAPLES', 'ULTA', 'NIKE'],
      Insurance: ['GEICO', 'STATE FARM', 'PROGRESSIVE', 'ALLSTATE', 'LIBERTY MUTUAL', 'NATIONWIDE', 'FARMERS INSURANCE', 'USAA', 'LEMONADE', 'METLIFE', 'AFLAC', 'CIGNA',
        'AETNA', 'UNITEDHEALTH', 'BLUE CROSS', 'BCBS', 'HUMANA', 'KAISER PERMANENTE'],
      Entertainment: ['HULU', 'HBO', 'MAX COM', 'PEACOCK', 'SIRIUSXM', 'AMC THEATRES', 'REGAL', 'FANDANGO', 'LIVE NATION', 'STUBHUB', 'DRAFTKINGS', 'FANDUEL'],
      Travel: ['DELTA AIR', 'UNITED AIRLINES', 'AMERICAN AIRLINES', 'SOUTHWEST AIR', 'JETBLUE', 'ALASKA AIR', 'SPIRIT AIRL', 'FRONTIER AIRLINES', 'HYATT', 'IHG', 'HOLIDAY INN', 'VRBO'],
      Housing: ['ZILLOW', 'APARTMENTS COM', 'RENT PAYMENT', 'HOA'],
      Taxes: ['IRS', 'USATAXPYMT', 'FRANCHISE TAX BOARD', 'DEPT OF REVENUE'],
      Transfers: ['VENMO', 'ZELLE', 'CASH APP', 'SQUARE CASH', 'CHIME', 'COINBASE', 'ROBINHOOD', 'FIDELITY', 'VANGUARD', 'SCHWAB']
    }
  },

  // Words that never identify a merchant on their own (ignored by the similarity level).
  stopWords: ['PAGAMENTO', 'PAG', 'POS', 'CARTA', 'CARD', 'DEBIT', 'VISA', 'MASTERCARD', 'BANCOMAT', 'DATA', 'OPERAZIONE', 'ORE', 'DEL', 'DI', 'DA', 'A', 'IL', 'LA', 'LE', 'E',
    'PER', 'CON', 'IN', 'THE', 'AND', 'OF', 'TO', 'AT', 'ON', 'FOR', 'PAYMENT', 'PURCHASE', 'CONTACTLESS', 'ADDEBITO', 'ACCREDITO', 'BONIFICO', 'SEPA', 'SDD', 'N', 'NR', 'EUR',
    'USD', 'GBP', 'SGD', 'IT', 'ITA', 'SRL', 'SPA', 'LTD', 'PTE', 'INC', 'DEBITO', 'CREDITO', 'TRANSFER', 'GIRO', 'FAST', 'NETS', 'ATM', 'ISTANTANEO', 'STORNO', 'REFUND']
};
