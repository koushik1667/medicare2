export interface ProviderFraudAnalysis {
  npi: string;
  providerName: string;
  specialty: string;
  state: string;
  totalBeneficiaries: number;
  totalClaims: number;
  totalSubmittedCharges: number;
  totalMedicarePayment: number;
  opioidPrescribingRate: number; // percentage
  brandNameRatio: number; // percentage
  averageDaySupplyPerRx: number;
  leieExcludedStatus: boolean;
  fraudRiskScore: number; // 0 - 100
  riskCategory: 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Fraud Alert';
  anomalyFlags: string[];
  recommendations: string[];
}

export const SAMPLE_PROVIDERS: ProviderFraudAnalysis[] = [
  {
    npi: '1043298711',
    providerName: 'Dr. Robert Vance, MD',
    specialty: 'Pain Management & Anesthesiology',
    state: 'FL',
    totalBeneficiaries: 1420,
    totalClaims: 8950,
    totalSubmittedCharges: 1450200,
    totalMedicarePayment: 890400,
    opioidPrescribingRate: 48.6,
    brandNameRatio: 64.2,
    averageDaySupplyPerRx: 88.5,
    leieExcludedStatus: true,
    fraudRiskScore: 92,
    riskCategory: 'Critical Fraud Alert',
    anomalyFlags: [
      'LEIE Federal Exclusion List Match Detected (Section 1128(a))',
      'Schedule II/III Opioid Prescription Rate (48.6%) exceeds specialty benchmark (14.2%) by +344%',
      'Abnormal Submitted Charge Variance ($1.45M billed vs $890k approved)',
      'Excessive day supply pattern per beneficiary (>88 days avg)',
    ],
    recommendations: [
      'Immediate Freeze on Medicare Part D Claim Reimbursements',
      'Issue Subpoena for Medical Records Audit & Opioid Dispensing Logs',
      'Refer case to HHS-OIG (Office of Inspector General) Fraud Strike Force',
    ],
  },
  {
    npi: '1982736450',
    providerName: 'Dr. Elena Rostova, MD',
    specialty: 'Internal Medicine',
    state: 'NY',
    totalBeneficiaries: 890,
    totalClaims: 3240,
    totalSubmittedCharges: 385000,
    totalMedicarePayment: 310000,
    opioidPrescribingRate: 11.2,
    brandNameRatio: 38.5,
    averageDaySupplyPerRx: 32.1,
    leieExcludedStatus: false,
    fraudRiskScore: 18,
    riskCategory: 'Low Risk',
    anomalyFlags: ['Minor variance in brand-name drug preferences compared to state avg'],
    recommendations: ['Routine annual Medicare compliance monitoring'],
  },
  {
    npi: '1475839201',
    providerName: 'Apex Health Pharmacy LLC',
    specialty: 'Retail Pharmacy & Medical Supplies',
    state: 'TX',
    totalBeneficiaries: 2150,
    totalClaims: 14200,
    totalSubmittedCharges: 2890000,
    totalMedicarePayment: 1650000,
    opioidPrescribingRate: 34.1,
    brandNameRatio: 82.4,
    averageDaySupplyPerRx: 65.4,
    leieExcludedStatus: false,
    fraudRiskScore: 68,
    riskCategory: 'High Risk',
    anomalyFlags: [
      'Extremely high Brand-Name to Generic Dispensing Ratio (82.4%)',
      'Pharmacy billing cluster anomaly: 4.2x higher drug claim cost per patient',
      'Opioid prescription refill velocity flag',
    ],
    recommendations: [
      'Schedule On-Site Pharmacy Inventory & Invoice Audit',
      'Cross-check patient prescribing doctors for coordinated kickback schemes',
    ],
  },
];

export const analyzeProviderNpi = async (npiQuery: string): Promise<ProviderFraudAnalysis> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const matched = SAMPLE_PROVIDERS.find(
    (p) => p.npi === npiQuery || p.providerName.toLowerCase().includes(npiQuery.toLowerCase())
  );

  if (matched) return matched;

  // Generate dynamic analysis for any entered NPI or name
  const simulatedScore = Math.floor(Math.random() * 40) + 15;
  return {
    npi: npiQuery || '1582930412',
    providerName: `Provider (NPI: ${npiQuery || '1582930412'})`,
    specialty: 'General Practice',
    state: 'CA',
    totalBeneficiaries: 650,
    totalClaims: 1890,
    totalSubmittedCharges: 210000,
    totalMedicarePayment: 175000,
    opioidPrescribingRate: 8.4,
    brandNameRatio: 28.0,
    averageDaySupplyPerRx: 30.0,
    leieExcludedStatus: false,
    fraudRiskScore: simulatedScore,
    riskCategory: simulatedScore > 50 ? 'Moderate Risk' : 'Low Risk',
    anomalyFlags: ['Standard Medicare billing variance within expected 95% confidence interval'],
    recommendations: ['Maintain standard Medicare Part D monitoring'],
  };
};
