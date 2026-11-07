/* Jarvis Systems homepage copy — Stone source-match (USER7, 2026-11-07). Lithuanian translation of the
   source page structure (docs/jarvis-stone-source-match/SPEC.md); wording review comes after the full page.
   Source claims that are not true for us were rewritten to the real mechanism (no review gating, no
   unverified statistics, own process facts). Single text source for src/pages/index.astro + O2Layout.

   Facts (do not change without a new decision):
   - Bundle: website enquiry/form → SMS conversation + owner alert; review requests + one reminder;
     missed call → SMS; past-customer campaigns (STOP opt-out, preview/schedule/cancel); one client app.
   - First 5 only: 50 € preparation upfront, 30 days free from a verified working launch, then 97 €/mėn.
     only after an explicit "tęsiam". Needed new domain is client-owned and extra. New website / ads /
     local SEO are separate agency work, not part of the 50 € setup.
   - SMS provider is NOT active. Feature media are visual demonstrations, never proof of delivery.
   - Google: only the small hero badge (own JarvisCo profile 5,0). USER13: no big proof slot, no Google boast elsewhere.
   - NOT decided, never stated: SMS allowance, later setup price, setup duration, support hours. */
import { brand } from './content.js';

export const NAME = 'Jarvis Systems';
export const O2_CTA = 'Užsiregistruoti pokalbiui';
export const APP_URL = 'https://jarvisweb-sistema.jarvisworks-co.workers.dev/';
export const GOOGLE = { rating: '5,0', count: '1 atsiliepimas', url: brand.gbp };

export const o2 = {
  meta: {
    title: 'Jarvis Systems – svetainės ir rinkodaros sistemos Jūsų verslui',
    description: 'Svetainės užklausos tampa SMS pokalbiais, praleistas skambutis gauna žinutę, atsiliepimų prašymai ir kampanijos buvusiems klientams – vienoje programėlėje. Pirmiems 5: 50 € paruošimas ir 30 dienų nemokamai.',
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
    lead: ['Be pasakų – rinkodara nėra raketų mokslas.', 'Nė viena agentūra (net ir mūsų) neturi stebuklingo sprendimo visoms Jūsų problemoms. Duosime įrankius laimėti, bet naudotis jais turėsite patys!'],
    mascotAlt: 'Jarvis Systems talismanas – statybininkas geltona liemene, rankos sukryžiuotos',
  },
  features: {
    title: ['Paprastos sistemos, kurios tiesiog veikia', 'Diplomo nereikia'],
    demoBtn: 'Trumpa demonstracija', moreBtn: 'Plačiau',
    items: [
      {
        id: 'svetaine', scene: 'web', title: 'Funkcionali svetainė',
        quote: 'Svetainė, kuri užklausas iškart paverčia SMS pokalbiais, keliaujančiais TIESIAI į Jūsų telefoną.',
        points: [
          ['Jus tikrai randa internete', 'Jei klientas ieško Jūsų Google ir neranda – nejauku… Nesijaudinkite, pasirūpinsime, kad taip nenutiktų.'],
          ['Parodykite tikrus atsiliepimus', 'Tikri klientų atsiliepimai svetainėje parodo naujam klientui, kad Jumis jau pasitiki kiti.'],
          ['Patogi telefone', 'Dauguma žmonių svetaines naršo telefone. Pasirūpinsime, kad Jūsų verslas telefone atrodytų puikiai.'],
          ['Pritaikyta vietinei Google paieškai', 'Turėtų būti savaime suprantama, bet vis tiek pasakysime: pasirūpiname, kad Jūsų verslą rastų Google.'],
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
          ['Kampanijos po ranka', 'Spaudžiate mygtuką, o žinutės išeina tik tiems, kurie neatsisakė (STOP). Rinkodaros komandos nereikia.'],
        ],
      },
      {
        id: 'seo', scene: 'seo', title: 'Vietinis SEO',
        quote: '„Pirma vieta Google per savaitę!“ Juokaujame – SEO reikia laiko…',
        points: [
          ['Tikslingos užklausos', 'Skamba geriau nei mokėti už užklausą, kurios autorius net neatsiliepia į skambutį, tiesa?'],
          ['Nebemokėkite už netikslingas užklausas', 'Kaip sakydavo mama: kokybė svarbiau už kiekį. Ar sutinkame su ja? Taip.'],
          ['Organinių užklausų sistema', 'Kurkite savo tikslingas užklausas, užuot mokėję už smalsuolius.'],
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
      ['Paruošiame sistemą', '(50 € pirmiems 5)', 'Surenkame pagrindinę informaciją apie verslą. Tada paruošiame verslo numerį, programėlę, SMS tekstus Jūsų vardu ir formos prijungimą.'],
      ['Paleidimo pokalbis', '(30 dienų nemokamai)', 'Parodome, kaip „viskas“ veikia, ir atsakome į klausimus. O „viskas“ – tai iš esmės du mygtukai. Toliau mokate tik pasakę „tęsiam“.'],
    ],
  },
  why: {
    title: ['Kodėl mes „visiškai unikalūs“…', 'kaip ir visi kiti, tiesa?'],
    items: [
      ['easy', 'Paprasta naudoti', 'Jarvis Systems kūrėme su viena pagrindine mintimi – kad būtų paprasta naudoti. Todėl viskas taip ir veikia.'],
      ['price', 'Prieinama kaina', 'Kainos sukurtos tam, kad liktumėte 10 metų, o ne 10 savaičių. Planuojame dirbti ilgai.'],
      ['contract', 'Jokių sutarčių', 'Jei prieinama ir veikia puikiai, kam mums ilgalaikė sutartis… Jei būsite patenkinti, liksite.'],
      ['straight', 'Be pasakų', 'Netikime tuščiais žodžiais: tiksliai pasakome, ką padarysime, ir tai padarome. Taškas.'],
      ['proof', 'Turime įrodymų', ['Žinome, kas veikia, o mūsų ', ['atliktus darbus', '/rezultatai'], ' galite patikrinti patys.']],
      ['improve', 'Nuolat tobuliname', 'Reguliariai atnaujiname ir tobuliname sistemas, kad už savo pinigus gautumėte kuo daugiau.'],
    ],
  },
  faq: {
    title: 'Dažniausi klausimai',
    items: [
      { q: 'Kada pamatysiu rezultatus?', a: 'Sistema pradeda veikti nuo paleidimo dienos: užklausa iš svetainės ar praleistas skambutis iškart sulaukia žinutės. Daugiau užsakymų nežadame – ar žmogus taps klientu, vis dar priklauso ir nuo Jūsų.' },
      { q: 'Kiek kainuoja?', a: 'Pirmiems 5 klientams: 50 € paruošimas, mokamas iš anksto. Tada 30 dienų nemokamai, skaičiuojant nuo dienos, kai patikriname, kad viskas veikia. Toliau 97 € per mėnesį – tik jei aiškiai pasakote, kad tęsiame. Niekas savaime nenuskaičiuojama.' },
      { q: 'Kas nutinka, jei nuspręsiu nutraukti?', a: 'Ilgalaikės sutarties nėra. Persigalvojote, kol dar nepradėjome darbų – grąžiname visus 50 €. Dėl mūsų kaltės nepavyko paleisti to, ką sutarėme – grąžiname visus 50 €. Nutraukiate paruošimo metu – grąžiname likutį, atskaičiavę jau atliktą sutartą darbą. Viskas veikia, bet nusprendėte netęsti – 50 € lieka už paruošimą, mėnesinio mokesčio nėra.' },
      { q: 'Ar mano svetainę ras Google?', a: 'Sistema prijungiama prie Jūsų esamos svetainės formos. Naują svetainę ar vietinį SEO darome atskirai, ir tai į 50 € paruošimą neįeina – aptarsime pokalbio metu. Pirmos vietos per savaitę nežadame.' },
      { q: 'Kam to reikia, jei klientų atveda rekomendacijos?', a: 'Rekomenduotas žmogus vis tiek pirmiausia paskambina ar parašo. Sistema pasirūpina, kad toks skambutis ar užklausa neliktų be atsakymo, o laimingi klientai būtų paprašyti atsiliepimo.' },
      { q: 'Kas į kainą neįeina?', a: 'Naujas domenas, jei jo prireikia (registruojamas Jūsų vardu, apmokamas atskirai). Nauja svetainė, vietinis SEO ir reklamos biudžetas – aptariame atskirai. SMS naudojimo, pagalbos ir nutraukimo sąlygas surašome raštu prieš mokėjimą.' },
      { q: 'Ar pasikeis mano numeris?', a: 'Ne. Jūsų telefonas ir numeris lieka. Papildomai gaunate verslo numerį, kurį skelbiate ten, kur norite gauti užklausų. Nutraukus paslaugą verslo numeris išjungiamas ir neperduodamas.' },
      { q: 'Ar veiks mano telefone? Ar atsako robotas?', a: 'Taip, ir iPhone, ir Android: programėlė atsidaro naršyklėje ir įsidiegia į telefono ekraną. Automatinė yra tik pirma žinutė – toliau su klientu rašote Jūs, kaip įprastai.' },
    ],
  },
  talk: {
    title: 'Norite susitarti dėl pokalbio?',
    text: 'Parodysime viską, ką darome, kad Jūsų verslas augtų – galėsite tai daryti patys arba leisti tai padaryti mums.',
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
    links: [['Kainos', '/kainos'], ['Atsiliepimai', '/atsiliepimai'], ['Mūsų darbai', '/musu-darbai'], ['Svetainės', '/svetaines']],
    about: [['Kaip dirbame', '/kaip-dirbame'], ['Sritys', '/sritys'], ['Apie', '/apie'], ['Kontaktai', '/kontaktai']],
    privacy: 'Privatumo politika', terms: 'Taisyklės',
  },
};
