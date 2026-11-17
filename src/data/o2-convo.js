/* Phone-animation conversations for the homepage scenes (S2, 17 Nov 2026, lead 692035c5; Matas 92ea6ba5: show the
   real conversation through to the call-back agreement + owner alert, not one text).
   Source: Drive management/dailius-system-preview-20261117/README.md, "Recorded real conversations" (verbatim Claude
   Haiku 5.5 output through the demo bridge, 17 Nov). Business texts keep the recorded GSM-7 spelling (no Lithuanian
   letters), as the customer really receives them.
   Adaptations (generic example, nothing real):
   - addresses: the recorded „Liepų g. 7, Garliava“ → „Pavyzdžio g. 7, Garliava“ (invented street); the form scene keeps the
     address already shown on the captured laptop form;
   - web scene (round 2: the laptop shows OUR two-step form filled with Šulinio žiedai / 4 / Reikia pristatymo / Kauno r. /
     Jonas / +370 612 34567; the phone/alert text never repeats the full number): the recorded form conversation is adapted
     to that request (name Jonas, no lid line, delivery „bus patikslintas pagal adresą“, no transport figure invented);
   - numbers: the shown business number is the fictional +370 645 12980 from the preview; customer numbers are masked.
   `from: 'biz'` = the business texts the customer (grey, left, typing dots first); `from: 'cus'` = customer reply (blue, right,
   typed in the input bar first). `ownerTitle` + `owner` = the owner's lock-screen notification from the Jarvis Systems app. */
export const CONVO = {
  web: {
    steps: [
      { from: 'biz', text: 'Sveiki, cia Dailius ir Ko. 4 ziedai: 4 x 67 € = 268 €. Pristatymas bus patikslintas pagal adresa. Kada reiketu?' },
      { from: 'cus', text: 'Iki penktadienio butu gerai' },
      { from: 'biz', text: 'Aciu, Jonai. Paskambinsime is +370 645 12980 siandien iki 17 val. Tikslia suma su pristatymu patvirtinsime susiskambine.' },
    ],
    ownerTitle: 'Perskambinti: Jonas, iki 17 val.',
    owner: 'Jonas (+370 612 •• •••) nori 4 šulinio žiedų su pristatymu į Kauno r., iki penktadienio.',
  },
  missed: {
    steps: [
      { from: 'biz', text: 'Sveiki, cia Dailius ir Ko. Praleidome Jusu skambuti. Kuo galime padeti?' },
      { from: 'cus', text: 'Sveiki, ar turit sulinio ziedu, kuriu skersmuo 1 m? Reiketu triju, 70 cm aukscio.' },
      { from: 'biz', text: 'Turim 1 m skersmens, 70 cm aukscio ziedu. Kuo Jus vardu?' },
      { from: 'cus', text: 'Tomas' },
      { from: 'biz', text: 'Aciu, Tomai. Kur reiketu atvezti? Reikia tikslaus adreso (gatve, namo nr., miestas).' },
      { from: 'cus', text: 'Atvezt reiketu, Pavyzdzio g. 7, Garliava. Kiek viskas kainuotu?' },
      { from: 'biz', text: 'Tomai, 3 x 67 € = 201 €. Pristatymas i Garliava preliminariai 6 €. Kada reiketu?' },
      { from: 'cus', text: 'Kita savaite' },
      { from: 'biz', text: 'Aciu, Tomai. Paskambinsim is +370 645 12980 siandien iki 17 val. Tikslia kaina ir pristatymo suma pasakysim susiskambine.' },
    ],
    ownerTitle: 'Perskambinti: Tomas, iki 17 val.',
    owner: 'Tomas (+370 673 •• •••) nori 3 šulinio žiedų, 1 m skersmens, 70 cm aukščio, atvežti į Pavyzdžio g. 7, Garliava, kitą savaitę.',
  },
};

/** Timeline in seconds (round 2, 17 Nov). `start` = when the first typing dots appear.
 *  Business texts: typing dots (`dotsA`→`at`). Customer texts: typed in the input bar (`typeA`→`at`), then sent.
 *  Reading pause before each step grows with the previous text's length. `own` = owner lock-screen alert. */
export function buildConvo(kind, start) {
  const { steps, owner, ownerTitle } = CONVO[kind];
  let t = start;
  const out = steps.map((s, i) => {
    if (i) t += 0.5 + steps[i - 1].text.length / 115;
    if (s.from === 'biz') { const r = { ...s, dotsA: t, at: t + 0.85 }; t = r.at; return r; }
    const d = Math.min(1.7, 0.35 + s.text.length * 0.02);
    const r = { ...s, typeA: t, at: +(t + d + 0.2).toFixed(2) }; t = r.at; return r;
  });
  const own = +(t + 0.6 + steps[steps.length - 1].text.length / 115 + 0.5).toFixed(2);
  return { steps: out, owner, ownerTitle, own, T: +(own + 0.7 + 4.8).toFixed(2) };
}
