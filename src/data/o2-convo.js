/* Phone-animation conversations for the homepage scenes (S2, 17 Nov 2026, lead 692035c5; Matas 92ea6ba5: show the
   real conversation through to the call-back agreement + owner alert, not one text).
   Source: Drive management/dailius-system-preview-20261117/README.md, "Recorded real conversations" (verbatim Claude
   Haiku 5.5 output through the demo bridge, 17 Nov). Business texts keep the recorded GSM-7 spelling (no Lithuanian
   letters), as the customer really receives them.
   Adaptations (generic example, nothing real):
   - addresses: the recorded „Liepų g. 7, Garliava“ → „Pavyzdžio g. 7, Garliava“ (invented street); the form scene keeps the
     address already shown on the captured laptop form;
   - web scene (the laptop pixels are the pre-existing captured form with its example values; the phone/alert text repeats
     neither its street address nor its number): the form captured on the laptop says Jonas / 4 žiedai / „Kokia kaina su pristatymu į Kauno rajoną?“, so the
     recorded form conversation is adapted to that request (name Jonas, no lid line, delivery „bus patikslintas pagal adresą“,
     no transport figure invented);
   - numbers: the shown business number is the fictional +370 645 12980 from the preview; customer numbers are masked.
   `from: 'biz'` = the business texts the customer (grey, left, typing dots first); `from: 'cus'` = customer reply (blue, right). */
export const CONVO = {
  web: {
    steps: [
      { from: 'biz', text: 'Sveiki, cia Dailius ir Ko. 4 ziedai: 4 x 67 € = 268 €. Pristatymas bus patikslintas pagal adresa. Kada reiketu?' },
      { from: 'cus', text: 'Iki penktadienio butu gerai' },
      { from: 'biz', text: 'Aciu, Jonai. Paskambinsime is +370 645 12980 siandien iki 17 val. Tikslia suma su pristatymu patvirtinsime susiskambine.' },
    ],
    owner: 'Jonas (+370 612 •• •••) nori 4 vnt. šulinio žiedų su pristatymu į Kauną, iki penktadienio. Perskambinti šiandien iki 17 val.',
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
    owner: 'Tomas (+370 673 •• •••) nori 3 šulinio žiedų, 1 m skersmens, 70 cm aukščio, atvežti į Pavyzdžio g. 7, Garliava, kitą savaitę. Perskambinti šiandien iki 17 val.',
  },
};

/** Timeline in seconds. `start` = when the first typing dots appear; returns per-step times + loop length.
 *  Business texts get typing dots (`dotsA`→`at`); customer texts just appear. Reading pause grows with text length. */
export function buildConvo(kind, start) {
  const { steps, owner } = CONVO[kind];
  let t = start;
  const out = steps.map((s, i) => {
    const prev = i ? steps[i - 1].text.length : 0;
    if (i) t += 0.6 + prev / 100;
    if (s.from === 'biz') { const r = { ...s, dotsA: t, at: t + 0.6 }; t = r.at; return r; }
    return { ...s, at: t };
  });
  const own = t + 0.6 + steps[steps.length - 1].text.length / 100 + 1.0;
  return { steps: out, owner, own, T: +(own + 0.4 + 4.4).toFixed(2) };
}
