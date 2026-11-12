/* Jarvis Systems O2 copy. Commercial decision: Matas, 2026-11-08, current thread user2.
   One full package: 97 €/month; website + SEO/AEO/GEO + enquiry/SMS systems,
   one-click review requests, reactivation/marketing campaigns and connected app.
   30-day money-back guarantee replaces first-five / 50 € setup / free-trial offer.
   User3: guarantee starts with the first 97 € payment.
   User4 (2026-11-09): refund 60 % of the first payment (58,20 €); ~25 € setup is a fixed cost.
   Do not invent refund restrictions,
   usage caps, unlimited messaging, billing mechanics or promised search/AI results.
   Accepted Stone design, real proof and verified Betono media remain unchanged.
   SMS provider is not active; demos do not prove real delivery.
   2026-11-10 closed terms (~/WebAgency Biz/brains/v2/OFFER.md §1): no setup fee, cancel anytime,
   7-day launch, domain included, 100 SMS/month then 0,08 € each (same monthly invoice), everything
   switched off on cancel, 999 € one-off to keep the website, business number switched off at exit.
   Marketing texts carry no STOP line (OFFER.md §6). */
import { brand } from './content.js';

export const NAME = 'Jarvis Systems';
export const O2_CTA = 'Užsiregistruoti pokalbiui';
export const APP_URL = 'https://jarvisweb-sistema.jarvisworks-co.workers.dev/';
export const O2_OFFER = {
  price: '97 €', per: '/mėn.', monthly: '97 €/mėn.',
  guarantee: '30 dienų pinigų grąžinimo garantija',
  guaranteeDetails: '30 dienų skaičiuojame nuo pirmo 97 € mokėjimo. Per šį laikotarpį paprašius grąžinti pinigus, grąžiname 60 % pirmo mokėjimo (58,20 €). Likusi dalis padengia jau atliktus paleidimo darbus.',
  setup: 'Be įrengimo mokesčio',
  launch: 'Paleidžiame per 7 dienas',
  cancel: 'Atsisakyti galite bet kada',
  domain: 'Domenas įskaičiuotas į kainą',
  sms: '100 SMS per mėnesį įskaičiuota, kiekviena papildoma SMS – 0,08 €',
  smsDetails: 'Į kainą įskaičiuota 100 SMS per mėnesį. Kiekviena papildoma SMS kainuoja 0,08 € ir pridedama prie tos pačios mėnesio sąskaitos. Ilga žinutė arba žinutė su lietuviškomis raidėmis gali būti skaičiuojama kaip kelios SMS.',
  cancelDetails: 'Prenumerata mėnesinė, atsisakyti galite bet kada. Atsisakius viskas išjungiama, taip pat ir svetainė.',
  keepSite: 'Jei norite pasilikti svetainę, ją galite išsipirkti už 999 € vienkartinai. Svetainė lieka be sistemų, su paprasta el. pašto forma.',
  number: 'Verslo numeris išjungiamas ir neperduodamas. Jūsų paties numeris niekada nesikeičia, todėl Google ir kitur tiesiog vėl nurodote jį.',
  includes: [
    'Svetainės sukūrimas ir prijungimas prie sistemos',
    'Optimizavimas Google ir AI paieškai: SEO, AEO ir GEO',
    'Svetainės užklausos – SMS pokalbiai ir pranešimai Jums',
    'Automatinė žinutė po praleisto skambučio',
    'Atsiliepimų prašymai vienu paspaudimu ir automatinis priminimas',
    'Buvusių klientų susigrąžinimo kampanijos',
    'Rinkodaros kampanijos vienu paspaudimu',
    'Verslo numeris ir viską sujungianti programėlė',
  ],
};
export const GOOGLE = { rating: '5,0', count: '1 atsiliepimas', url: brand.gbp };

export const o2 = {
  meta: {
    title: 'Jarvis Systems – svetainės ir rinkodaros sistemos Jūsų verslui',
    description: `Svetainė, SEO, AEO, GEO, automatinės žinutės, atsiliepimų prašymai ir klientų kampanijos vienoje programėlėje. Pilnas paketas – ${O2_OFFER.monthly} ${O2_OFFER.guarantee}.`,
  },
  nav: [
    { label: 'Funkcijos', href: '/funkcijos' },
    { label: 'Kainos', href: '/kainos' },
    { label: 'Atsiliepimai', href: '/atsiliepimai' },
    { label: 'Mūsų darbai', href: '/musu-darbai' },
    { label: 'Apie', href: '/apie' },
  ],
  login: 'Prisijungti',
  menu: 'Meniu', close: 'Uždaryti',
  hero: {
    title: ['Svetainės ir', 'rinkodaros sistemos', 'Jūsų verslui'],
    lead: ['Be pasakų – rinkodara nėra raketų mokslas.', `Svetainė, optimizavimas Google ir AI paieškai bei klientų sistemos vienoje programėlėje. Viskas už ${O2_OFFER.monthly}, be įrengimo mokesčio, su 30 dienų pinigų grąžinimo garantija.`],
    mascotAlt: 'Jarvis Systems talismanas – statybininkas geltona liemene, rankos sukryžiuotos',
  },
  features: {
    title: ['Paprastos sistemos, kurios tiesiog veikia', 'Naudotis jomis diplomo nereikia'],
    demoBtn: 'Trumpa demonstracija', moreBtn: 'Plačiau',
    items: [
      {
        id: 'svetaine', scene: 'web', title: 'Funkcionali svetainė',
        quote: 'Svetainė, kuri užklausas iškart paverčia SMS pokalbiais, keliaujančiais TIESIAI į Jūsų telefoną.',
        points: [
          ['Jus tikrai randa internete', 'Jei klientas ieško Jūsų Google ir neranda – nejauku… Nesijaudinkite, pasirūpinsime, kad taip nenutiktų.'],
          ['Parodykite tikrus atsiliepimus', 'Tikri klientų atsiliepimai svetainėje parodo naujam klientui, kad Jumis jau pasitiki kiti.'],
          ['Patogi telefone', 'Dauguma žmonių svetaines naršo telefone. Pasirūpinsime, kad Jūsų verslas telefone atrodytų puikiai.'],
          ['Pritaikyta Google ir AI paieškai', 'Svetainę optimizuojame Google paieškai ir AI atsakymams. SEO, AEO ir GEO įeina į bendrą paketą.'],
        ],
      },
      {
        id: 'atsiliepimai-sistema', scene: 'reviews', title: 'Atsiliepimų rinkimo sistema',
        quote: '„Būtinai parašysiu atsiliepimą“, – sako visi, bet žmonės pamiršta. Mes mandagiai priminsime.',
        points: [
          ['Nuoroda tiesiai į Google', 'Pažymite darbą atliktu, ir klientas gauna SMS su nuoroda į Jūsų Google profilį.'],
          ['Automatinis priminimas', '„Būtinai parašysiu“, bet pamiršta. Vienas mandagus priminimas – ne dešimt.'],
          ['Prašymas vienu paspaudimu', 'Kaip žadėjome – paprasta. Jei susipainiosite, kalti mes ir mums labai gėda.'],
          ['Nebereikia spėlioti', 'Nuorodą gauna kiekvienas klientas, o programėlėje matote, kas ją atidarė.'],
        ],
      },
      {
        id: 'skambuciai', scene: 'missed', title: 'Žinutė po praleisto skambučio',
        quote: 'Skambučių praleidžia visi, bet atrašo ne visi. Būkite tas, kuris atrašo, ir aplenkite konkurentus.',
        points: [
          ['Išsiskirkite iš konkurentų', 'Visi praleidžia skambučius, bet ne visi atrašo. Atrašykite Jūs ir būsite pastebėti.'],
          ['Nebeprarastos užklausos', 'Dirbate objekte ir negalite atsiliepti? Ne bėda – išsiųsime žinutę ir pradėsime pokalbį už Jus.'],
          ['Parodykite, kad Jums rūpi', 'Buvusiai antrai pusei nepatiko, kai neatsiliepdavote – klientams irgi. Bent parašykite, kad žinotų: Jums rūpi.'],
          ['Pasiekiami visą parą', 'Praleidote skambutį po darbo? Žinutė išeis ir tada, kai Jūs jau ilsitės.'],
        ],
      },
      {
        id: 'kampanijos', scene: 'campaign', title: 'Kampanijos vienu paspaudimu',
        quote: 'Jūs žinote, ir mes žinome… Rekomendacijos ir grįžtantys klientai – tai, ko reikia labiausiai. Gaukime abu!',
        points: [
          ['Paruošta už Jus', 'Vėl – paprastai. Paruoštą žinutę peržiūrite ir paleidžiate vienu paspaudimu.'],
          ['Rekomendacijų kampanijos', 'Dirbate gerai, ir klientai Jus mėgsta. Priminkime jiems papasakoti apie Jus draugams.'],
          ['Grįžtančių klientų kampanijos', 'Lojalūs klientai – sėkmingo verslo pagrindas. Priminkite apie save su specialiu pasiūlymu.'],
          ['Kampanijos po ranka', 'Peržiūrite žinutę ir paleidžiate kampaniją vienu paspaudimu. Žinutės išeina palaipsniui, ne visos iš karto.'],
        ],
      },
      {
        id: 'seo', scene: 'seo', title: 'SEO, AEO ir GEO',
        quote: 'Kad Jūsų verslą būtų lengviau rasti Google ir AI paieškoje. Optimizavimas jau įeina į paketą.',
        points: [
          ['Google paieška ir žemėlapiai', 'Tvarkome svetainės struktūrą, paslaugų puslapius ir Google verslo profilį pagal Jūsų paslaugas bei vietoves.'],
          ['Aiškūs atsakymai klientams', 'AEO – atsakymų paieškos optimizavimas. Aiškiai atsakome į klausimus, kuriuos klientai užduoda apie Jūsų paslaugas.'],
          ['Turinys AI paieškai', 'GEO – optimizavimas generatyvinei paieškai. Sutvarkome turinį ir verslo informaciją, kad AI sistemoms būtų lengviau juos suprasti.'],
        ],
      },
    ],
  },
  trades: {
    title: 'Dirbame su visomis šiomis sritimis ir ne tik…',
    cta: 'Paklauskite apie savo sritį',
    prev: 'Ankstesnės sritys', next: 'Kitos sritys',
  },
  process: {
    title: 'Kaip atrodo darbas su mumis…',
    steps: [
      ['Pokalbis', '(15–20 min.)', 'Iš tikrųjų tai pardavimo pokalbis – tik nenorėjome Jūsų išgąsdinti. O rimtai: atsakysime į klausimus ir parodysime, kaip sistema veiktų Jūsų versle.'],
      ['Paruošiame visą paketą', '(per 7 dienas)', 'Sukuriame svetainę, optimizuojame ją Google ir AI paieškai, prijungiame užklausas, žinutes, atsiliepimų prašymus ir kampanijas prie vienos programėlės.'],
      ['Paleidžiame ir parodome', `(${O2_OFFER.monthly})`, 'Kartu patikriname svetainę ir sistemas, parodome programėlę bei atsakome į klausimus. Įrengimo mokesčio nėra, o pilnam paketui taikoma 30 dienų pinigų grąžinimo garantija.'],
    ],
  },
  why: {
    title: ['Kodėl mes „visiškai unikalūs“…', 'kaip ir visi kiti, tiesa?'],
    items: [
      ['easy', 'Paprasta naudoti', 'Jarvis Systems kūrėme su viena pagrindine mintimi – kad būtų paprasta naudoti. Todėl viskas taip ir veikia.'],
      ['price', 'Viena aiški kaina', `Svetainė, SEO, AEO, GEO ir klientų sistemos – viename pakete už ${O2_OFFER.monthly}`],
      ['contract', '30 dienų garantija', O2_OFFER.guaranteeDetails],
      ['straight', 'Be pasakų', 'Netikime tuščiais žodžiais: tiksliai pasakome, ką padarysime, ir tai padarome. Taškas.'],
      ['proof', 'Turime įrodymų', ['Žinome, kas veikia, o mūsų ', ['atliktus darbus', '/musu-darbai'], ' galite patikrinti patys.']],
      ['improve', 'Nuolat tobuliname', 'Reguliariai atnaujiname ir tobuliname sistemas, kad už savo pinigus gautumėte kuo daugiau.'],
    ],
  },
  faq: {
    title: 'Dažniausi klausimai',
    items: [
      { q: 'Kada pamatysiu rezultatus?', a: 'Sistema pradeda veikti nuo paleidimo dienos: užklausa iš svetainės ar praleistas skambutis iškart sulaukia žinutės. Daugiau užsakymų nežadame – ar žmogus taps klientu, vis dar priklauso ir nuo Jūsų.' },
      { q: 'Kiek kainuoja?', a: `Pilnas paketas kainuoja ${O2_OFFER.monthly} Įrengimo mokesčio nėra, domenas įskaičiuotas. Svetainė, SEO, AEO, GEO, automatinės žinutės, atsiliepimų prašymai, klientų kampanijos ir bendra programėlė įeina į šią kainą. Taikoma 30 dienų pinigų grąžinimo garantija.` },
      { q: 'Kiek SMS įeina?', a: O2_OFFER.smsDetails },
      { q: 'Ar galiu atsisakyti?', a: `Taip, bet kada – prenumerata mėnesinė. Atsisakius viskas išjungiama, taip pat ir svetainė. ${O2_OFFER.keepSite}` },
      { q: 'Per kiek laiko paleidžiate?', a: 'Per 7 dienas nuo tada, kai gauname informaciją apie Jūsų verslą ir prieigas. Prieš paleidimą kartu patikriname svetainę ir SMS tekstus.' },
      { q: 'Ar yra pinigų grąžinimo garantija?', a: `Taip. ${O2_OFFER.guaranteeDetails}` },
      { q: 'Ar įeina optimizavimas Google ir AI paieškai?', a: 'Taip. Į paketą įeina svetainė ir jos optimizavimas Google bei vietinei paieškai (SEO), aiškiems atsakymams į klientų klausimus (AEO) ir generatyvinei AI paieškai (GEO). Konkreti pozicija Google ar paminėjimas AI atsakyme nėra garantuojami.' },
      { q: 'Kam to reikia, jei klientų atveda rekomendacijos?', a: 'Rekomenduotas žmogus vis tiek pirmiausia paskambina ar parašo. Sistema pasirūpina, kad toks skambutis ar užklausa neliktų be atsakymo, o laimingi klientai būtų paprašyti atsiliepimo.' },
      { q: 'Ar už svetainę ir SEO reikės mokėti papildomai?', a: `Ne. Svetainė ir SEO, AEO bei GEO optimizavimas yra pilno ${O2_OFFER.monthly} paketo dalis, kartu su užklausų, žinučių, atsiliepimų ir kampanijų sistemomis.` },
      { q: 'Ar pasikeis mano numeris?', a: 'Ne. Jūsų telefonas ir numeris lieka. Papildomai gaunate verslo numerį, kurį skelbiate ten, kur norite gauti užklausų. Nutraukus paslaugą verslo numeris išjungiamas ir neperduodamas, o skelbimuose vėl nurodote savo numerį.' },
      { q: 'Ar veiks mano telefone? Ar atsako robotas?', a: 'Taip, ir iPhone, ir Android: programėlė atsidaro naršyklėje ir įsidiegia į telefono ekraną. Automatinė yra tik pirma žinutė – toliau su klientu rašote Jūs, kaip įprastai.' },
    ],
  },
  talk: {
    title: 'Norite susitarti dėl pokalbio?',
    text: `Parodysime, kaip svetainė, SEO, AI paieškos optimizavimas ir klientų sistemos veiktų Jūsų versle. Pilnas paketas – ${O2_OFFER.monthly}, atsisakyti galite bet kada.`,
    name: 'Vardas', phone: 'Telefono numeris', email: 'El. paštas (nebūtina)', errEmail: 'Patikrinkite el. pašto adresą.', company: 'Įmonė ar veikla (nebūtina)', time: 'Kada patogu?',
    times: [['morning', 'Rytą'], ['day', 'Dieną'], ['evening', 'Vakare']],
    submit: 'Užsiregistruoti pokalbiui', open: 'Užsiregistruoti pokalbiui', dialogTitle: 'Užsiregistruoti pokalbiui', close: 'Uždaryti', sending: 'Siunčiama…',
    dialogText: '15–20 minučių. Parodysime, kaip tai veiktų Jūsų versle. Jei netiks – pasakysime patys.',
    ok: 'Ačiū{name}. Paskambinsime {time}.',
    timesSpoken: { morning: 'rytą', day: 'dieną', evening: 'vakare', '': 'artimiausiu metu' },
    previewOk: 'Tai peržiūros versija, todėl registracija neišsiųsta. Pokalbiui paskambinkite:',
    err: `Nepavyko išsiųsti. Skambinkite ${brand.phone}.`, errPhone: 'Patikrinkite telefono numerį.',
    orCall: 'Arba paskambinkite', context: 'Jarvis Systems: pokalbis dėl sistemos',
    mascotAlt: 'Jarvis Systems talismanas rodo į pokalbio mygtuką',
  },
  demo: { close: 'Uždaryti demonstraciją' },
  footer: {
    ready: 'Pasiruošę pradėti?', learn: 'Norite sužinoti daugiau, kaip galime padėti?',
    colLinks: 'Nuorodos', colAbout: 'Apie', colFeatures: 'Funkcijos',
    links: [['Kainos', '/kainos'], ['Atsiliepimai', '/atsiliepimai'], ['Mūsų darbai', '/musu-darbai'], ['Svetainės', '/funkcijos/funkcionali-svetaine']],
    about: [['Kaip dirbame', '/kaip-dirbame'], ['Sritys', '/sritys'], ['Apie', '/apie'], ['Kontaktai', '/kontaktai']],
    privacy: 'Privatumo politika', terms: 'Taisyklės',
  },
};
