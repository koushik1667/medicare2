export interface MedicalShorthand {
  code: string;
  latinMeaning: string;
  englishMeaning: string;
  teluguMeaning: string;
  hindiMeaning: string;
  spanishMeaning: string;
}

export const MEDICAL_SHORTHANDS: MedicalShorthand[] = [
  { code: 'b.i.d / bid', latinMeaning: 'bis in die', englishMeaning: 'Twice a day (every 12 hours)', teluguMeaning: 'రోజుకు 2 సార్లు (ఉదయం & రాత్రి)', hindiMeaning: 'दिन में 2 बार (सुबह और रात)', spanishMeaning: 'Dos veces al día' },
  { code: 't.i.d / tid', latinMeaning: 'ter in die', englishMeaning: 'Three times a day (every 8 hours)', teluguMeaning: 'రోజుకు 3 సార్లు (ఉదయం, మధ్యాహ్నం, రాత్రి)', hindiMeaning: 'दिन में 3 बार (सुबह, दोपहर, रात)', spanishMeaning: 'Tres veces al día' },
  { code: 'q.i.d / qid', latinMeaning: 'quater in die', englishMeaning: 'Four times a day (every 6 hours)', teluguMeaning: 'రోజుకు 4 సార్లు', hindiMeaning: 'दिन में 4 बार', spanishMeaning: 'Cuatro veces al día' },
  { code: 'q.d / qd', latinMeaning: 'quaque die', englishMeaning: 'Once daily (every day)', teluguMeaning: 'రోజుకు 1 సారి పరిమిత మోతాదు', hindiMeaning: 'दिन में 1 बार प्रतिदिन', spanishMeaning: 'Una vez al día' },
  { code: 'p.o / po', latinMeaning: 'per os', englishMeaning: 'Orally by mouth with water', teluguMeaning: 'నోటి ద్వారా నీటితో మింగవలెను', hindiMeaning: 'मुंह से पानी के साथ लें', spanishMeaning: 'Por vía oral' },
  { code: 'p.r.n / prn', latinMeaning: 'pro re nata', englishMeaning: 'As needed for symptoms (e.g. pain/fever)', teluguMeaning: 'అవసరమైనప్పుడు మాత్రమే (నొప్పి/జ్వరం వస్తే)', hindiMeaning: 'आवश्यकता पड़ने पर (जैसे दर्द/बुखार में)', spanishMeaning: 'Según sea necesario' },
  { code: 'a.c. / ac', latinMeaning: 'ante cibum', englishMeaning: 'Before meals (30 mins prior)', teluguMeaning: 'భోజనానికి ముందు (30 నిమిషాలు ముందు)', hindiMeaning: 'भोजन से 30 मिनट पहले', spanishMeaning: 'Antes de las comidas' },
  { code: 'p.c. / pc', latinMeaning: 'post cibum', englishMeaning: 'After meals (within 30 mins after)', teluguMeaning: 'భోజనం చేసిన తర్వాత', hindiMeaning: 'भोजन के बाद', spanishMeaning: 'Después de las comidas' },
  { code: 'h.s. / hs', latinMeaning: 'hora somni', englishMeaning: 'At bedtime before sleep', teluguMeaning: 'రాత్రి పడుకునే ముందు నిద్రవేళలో', hindiMeaning: 'सोने से पहले रात को', spanishMeaning: 'Al acostarse' },
  { code: 'q4h', latinMeaning: 'quaque 4 hora', englishMeaning: 'Every 4 hours', teluguMeaning: 'ప్రతి 4 గంటలకు ఒకసారి', hindiMeaning: 'हर 4 घंटे में', spanishMeaning: 'Cada 4 horas' },
];

export interface TranslatedPrescription {
  targetLanguage: string;
  patientName: string;
  doctorName: string;
  diagnosis: string;
  translatedMedications: Array<{
    name: string;
    dosage: string;
    frequencyTranslated: string;
    durationTranslated: string;
    instructionsTranslated: string;
    shorthandNotes: string;
  }>;
  generalAdvice: string;
}

export const translatePrescriptionText = async (
  medications: Array<{ name: string; dosage: string; frequency: string; duration: string; instructions?: string }>,
  patientName: string,
  doctorName: string,
  diagnosis: string,
  targetLang: string
): Promise<TranslatedPrescription> => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const lang = targetLang.toLowerCase();
  const isTelugu = lang.includes('telugu') || lang === 'te';
  const isHindi = lang.includes('hindi') || lang === 'hi';
  const isSpanish = lang.includes('spanish') || lang === 'es';
  const isFrench = lang.includes('french') || lang === 'fr';
  const isTamil = lang.includes('tamil') || lang === 'ta';
  const isMarathi = lang.includes('marathi') || lang === 'mr';
  const isGerman = lang.includes('german') || lang === 'de';
  const isBengali = lang.includes('bengali') || lang === 'bn';

  const translatedMedications = medications.map((med) => {
    let freqTrans = med.frequency;
    let durTrans = med.duration;
    let instTrans = med.instructions || 'Take with water';
    let shorthand = 'Standard Prescription Note';

    const freqLower = med.frequency.toLowerCase();
    if (freqLower.includes('b.i.d') || freqLower.includes('twice')) {
      shorthand = 'b.i.d = bis in die (Twice Daily)';
      if (isTelugu) freqTrans = 'రోజుకు 2 సార్లు (ఉదయం, రాత్రి)';
      else if (isHindi) freqTrans = 'दिन में 2 बार (सुबह, रात)';
      else if (isSpanish) freqTrans = 'Dos veces al día';
      else if (isFrench) freqTrans = 'Deux fois par jour';
      else if (isTamil) freqTrans = 'நாளைக்கு 2 முறை (காலை, இரவு)';
      else if (isMarathi) freqTrans = 'दिवसातून 2 वेळा (सकाळ, रात्र)';
      else if (isGerman) freqTrans = 'Zweimal täglich';
      else if (isBengali) freqTrans = 'দিনে ২ বার (সকাল, রাত)';
    } else if (freqLower.includes('t.i.d') || freqLower.includes('three')) {
      shorthand = 't.i.d = ter in die (Three Times Daily)';
      if (isTelugu) freqTrans = 'రోజుకు 3 సార్లు (ఉదయం, మధ్యాహ్నం, రాత్రి)';
      else if (isHindi) freqTrans = 'दिन में 3 बार';
      else if (isSpanish) freqTrans = 'Tres veces al día';
      else if (isFrench) freqTrans = 'Trois fois par jour';
      else if (isTamil) freqTrans = 'நாளைக்கு 3 முறை';
      else if (isMarathi) freqTrans = 'दिवसातून 3 वेळा';
      else if (isGerman) freqTrans = 'Dreimal täglich';
      else if (isBengali) freqTrans = 'দিনে ৩ বার';
    } else if (freqLower.includes('h.s') || freqLower.includes('bedtime')) {
      shorthand = 'h.s. = hora somni (At Bedtime)';
      if (isTelugu) freqTrans = 'రాత్రి పడుకునే ముందు';
      else if (isHindi) freqTrans = 'रात को सोने से पहले';
      else if (isSpanish) freqTrans = 'Al acostarse';
      else if (isFrench) freqTrans = 'Au coucher';
      else if (isTamil) freqTrans = 'இரவு தூங்கும் முன்';
      else if (isMarathi) freqTrans = 'रात्री झोपण्यापूर्वी';
      else if (isGerman) freqTrans = 'Vor dem Schlafengehen';
      else if (isBengali) freqTrans = 'রাতে ঘুমানোর আগে';
    } else if (freqLower.includes('q.d') || freqLower.includes('once')) {
      shorthand = 'q.d. = quaque die (Once Daily)';
      if (isTelugu) freqTrans = 'రోజుకు 1 సారి మాత్రమే';
      else if (isHindi) freqTrans = 'प्रतिदिन 1 बार';
      else if (isSpanish) freqTrans = 'Una vez al día';
      else if (isFrench) freqTrans = 'Une fois par jour';
      else if (isTamil) freqTrans = 'நாளைக்கு 1 முறை';
      else if (isMarathi) freqTrans = 'दिवसातून 1 वेळ';
      else if (isGerman) freqTrans = 'Einmal täglich';
      else if (isBengali) freqTrans = 'দিনে ১ বার';
    }

    if (durTrans.includes('days')) {
      const num = durTrans.match(/\d+/)?.[0] || '';
      if (isTelugu) durTrans = `${num} రోజులు`;
      else if (isHindi) durTrans = `${num} दिन`;
      else if (isSpanish) durTrans = `${num} días`;
      else if (isFrench) durTrans = `${num} jours`;
      else if (isTamil) durTrans = `${num} நாட்கள்`;
      else if (isMarathi) durTrans = `${num} दिवस`;
      else if (isGerman) durTrans = `${num} Tage`;
      else if (isBengali) durTrans = `${num} দিন`;
    }

    if (instTrans.toLowerCase().includes('meal') || instTrans.toLowerCase().includes('food')) {
      if (isTelugu) instTrans = 'భోజనం చేసిన తర్వాత మింగవలెను';
      else if (isHindi) instTrans = 'भोजन के बाद पानी के साथ लें';
      else if (isSpanish) instTrans = 'Tomar después de los alimentos con agua';
      else if (isFrench) instTrans = 'À prendre après les repas avec de l eau';
      else if (isTamil) instTrans = 'உணவுக்குப் பிறகு தண்ணீர் அருந்தி உட்கொள்ளவும்';
      else if (isMarathi) instTrans = 'जेवणानंतर पाण्यासोबत घ्यावे';
      else if (isGerman) instTrans = 'Nach den Mahlzeiten mit Wasser einnehmen';
      else if (isBengali) instTrans = 'খাবারের পর জল দিয়ে খাবেন';
    }

    return {
      name: med.name,
      dosage: med.dosage,
      frequencyTranslated: freqTrans,
      durationTranslated: durTrans,
      instructionsTranslated: instTrans,
      shorthandNotes: shorthand,
    };
  });

  let advice = 'Keep all medicines stored in a cool, dry place. Complete full course as prescribed by doctor.';
  if (isTelugu) {
    advice = 'మందులను చల్లని, పొడి ప్రదేశంలో నిల్వ చేయండి. డాక్టర్ చెప్పిన వ్యవధి వరకు మందుల కోర్సును తప్పక పూర్తి చేయండి.';
  } else if (isHindi) {
    advice = 'दवाइयों को ठंडी और सूखी जगह पर रखें। डॉक्टर द्वारा बताई गई पूरी अवधि तक दवा अवश्य लें।';
  } else if (isSpanish) {
    advice = 'Mantenga los medicamentos en un lugar fresco y seco. Complete todo el tratamiento prescrito.';
  } else if (isFrench) {
    advice = 'Conservez les médicaments dans un endroit frais et sec. Suivez le traitement complet prescrit par le médecin.';
  } else if (isTamil) {
    advice = 'மருந்துகளை குளிர்ந்த, உலர்ந்த இடத்தில் வைக்கவும். மருத்துவர் கூறியபடி முழு கோர்ஸையும் முடிக்கவும்.';
  } else if (isMarathi) {
    advice = 'औषधे थंड आणि कोरड्या जागी ठेवा. डॉक्टरांनी सांगितल्यानुसार पूर्ण कोर्स पूर्ण करा.';
  } else if (isGerman) {
    advice = 'Medikamente kühl und trocken lagern. Nehmen Sie die verordnete Dosis vollständig ein.';
  } else if (isBengali) {
    advice = 'ওষুধগুলি ঠান্ডা ও শুষ্ক জায়গায় রাখুন। ডাক্তারের পরামর্শ অনুযায়ী পুরো কোর্স শেষ করুন।';
  }

  return {
    targetLanguage: targetLang,
    patientName,
    doctorName,
    diagnosis,
    translatedMedications,
    generalAdvice: advice,
  };
};
