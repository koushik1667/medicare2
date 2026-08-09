export interface ExtractedMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export interface PrescriptionOCRResult {
  rawText: string;
  patientName: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  medications: ExtractedMedication[];
  overallConfidence: number;
  processedImageUrl?: string;
  bboxHighlights: Array<{ label: string; box: [number, number, number, number] }>;
}

export const processPrescriptionImage = async (
  _file: File | string
): Promise<PrescriptionOCRResult> => {
  // Simulate AI OCR scanning processing delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Intelligent OCR text extraction simulation based on MediScribe-OCR & TrOCR pipelines
  const defaultResult: PrescriptionOCRResult = {
    rawText: `Dr. Sarah Jenkins, MD - Cardiology
Patient Name: Johnathan Vance
Date: 2026-08-09
Diagnosis: Primary Hypertension & Hyperlipidemia

Rx:
1. Amoxicillin 500mg - 1 tab p.o. t.i.d. x 7 days (Take after meals)
2. Atorvastatin 20mg - 1 tab p.o. h.s. x 30 days (Bedtime)
3. Metoprolol Succinate ER 50mg - 1 tab p.o. q.d. x 30 days (Morning)
4. Metformin HCl 850mg - 1 tab p.o. b.i.d. x 30 days (With meals)

Refills: 2
Signature: S. Jenkins, MD`,
    patientName: 'Johnathan Vance',
    doctorName: 'Dr. Sarah Jenkins, MD',
    date: '2026-08-09',
    diagnosis: 'Primary Hypertension & Hyperlipidemia',
    overallConfidence: 94.8,
    bboxHighlights: [
      { label: 'Doctor Header', box: [20, 15, 250, 45] },
      { label: 'Patient Info', box: [20, 65, 300, 35] },
      { label: 'Med 1: Amoxicillin 500mg', box: [25, 115, 380, 30] },
      { label: 'Med 2: Atorvastatin 20mg', box: [25, 150, 380, 30] },
      { label: 'Med 3: Metoprolol 50mg', box: [25, 185, 380, 30] },
      { label: 'Med 4: Metformin 850mg', box: [25, 220, 380, 30] },
      { label: 'Doctor Signature', box: [220, 260, 180, 40] },
    ],
    medications: [
      {
        id: 'med-1',
        name: 'Amoxicillin',
        dosage: '500mg',
        frequency: 't.i.d. (3 times daily)',
        duration: '7 days',
        instructions: 'Take oral tablet after meals',
        confidence: 96.2,
      },
      {
        id: 'med-2',
        name: 'Atorvastatin',
        dosage: '20mg',
        frequency: 'h.s. (At bedtime)',
        duration: '30 days',
        instructions: 'Take oral tablet before sleep',
        confidence: 94.5,
      },
      {
        id: 'med-3',
        name: 'Metoprolol Succinate ER',
        dosage: '50mg',
        frequency: 'q.d. (Once daily)',
        duration: '30 days',
        instructions: 'Take oral tablet in the morning',
        confidence: 95.0,
      },
      {
        id: 'med-4',
        name: 'Metformin HCl',
        dosage: '850mg',
        frequency: 'b.i.d. (Twice daily)',
        duration: '30 days',
        instructions: 'Take oral tablet with breakfast & dinner',
        confidence: 93.4,
      },
    ],
  };

  return defaultResult;
};
