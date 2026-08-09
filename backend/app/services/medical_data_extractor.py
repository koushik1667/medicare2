"""
Medical Data Extractor Service | 医学数据提取服务

从患者症状描述和AI诊断报告中提取结构化的医学检查数据，
支持实验室检查、功能检查、影像学检查等多维度数据提取。
"""

import re
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from enum import Enum

logger = logging.getLogger(__name__)


class ExamCategory(Enum):
    """检查类别 | Examination Categories"""

    LAB_BLOOD = "blood"  # 血液检查
    LAB_URINE = "urine"  # 尿液检查
    LAB_BIOCHEMISTRY = "biochemistry"  # 生化检查
    LAB_COAGULATION = "coagulation"  # 凝血功能
    LAB_IMMUNOLOGY = "immunology"  # 免疫学检查
    FUNCTION_ECG = "ecg"  # 心电图
    FUNCTION_PFT = "pft"  # 肺功能
    FUNCTION_ECHO = "echo"  # 超声心动图
    IMAGING_XRAY = "xray"  # X线
    IMAGING_CT = "ct"  # CT
    IMAGING_MRI = "mri"  # MRI
    IMAGING_ULTRASOUND = "ultrasound"  # 超声
    VITAL_SIGNS = "vitals"  # 生命体征


@dataclass
class LabValue:
    """实验室检查值 | Laboratory Value"""

    name: str  # 指标名称
    name_en: str  # 英文名称
    value: str  # 数值
    unit: str  # 单位
    category: ExamCategory = ExamCategory.LAB_BLOOD  # 类别


@dataclass
class ImagingFinding:
    """影像学发现 | Imaging Finding"""

    modality: str  # 检查方式
    body_part: str  # 检查部位
    findings: str  # 发现描述


@dataclass
class FunctionTest:
    """功能检查结果 | Function Test Result"""

    test_type: str  # 检查类型
    parameters: Dict[str, str] = field(default_factory=dict)  # 参数
    conclusion: Optional[str] = None  # 结论


class MedicalDataExtractor:
    """医学数据提取器 - 从自由文本中提取结构化的医学检查数据"""

    # 血常规指标 | Complete Blood Count
    CBC_PATTERNS = {
        "wbc": {
            "patterns": [
                r"白细胞.*?计数.*?(\d+\.?\d*)\s*[×x]\s*10\^?9",
                r"WBC.*?(\d+\.?\d*)\s*[×x]\s*10\^?9",
            ],
            "unit": "×10^9/L",
            "name": "白细胞计数",
            "name_en": "WBC",
        },
        "rbc": {
            "patterns": [
                r"红细胞.*?计数.*?(\d+\.?\d*)\s*[×x]\s*10\^?12",
                r"RBC.*?(\d+\.?\d*)\s*[×x]\s*10\^?12",
            ],
            "unit": "×10^12/L",
            "name": "红细胞计数",
            "name_en": "RBC",
        },
        "hb": {
            "patterns": [
                r"血红蛋白.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"Hb.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"HGB.*?(\d+\.?\d*)\s*[gG]/[lL]",
            ],
            "unit": "g/L",
            "name": "血红蛋白",
            "name_en": "Hemoglobin",
        },
        "hct": {
            "patterns": [
                r"红细胞压积.*?(\d+\.?\d*)\s*%",
                r"HCT.*?(\d+\.?\d*)\s*%",
            ],
            "unit": "%",
            "name": "红细胞压积",
            "name_en": "Hematocrit",
        },
        "plt": {
            "patterns": [
                r"血小板.*?计数.*?(\d+\.?\d*)\s*[×x]\s*10\^?9",
                r"PLT.*?(\d+\.?\d*)\s*[×x]\s*10\^?9",
            ],
            "unit": "×10^9/L",
            "name": "血小板计数",
            "name_en": "Platelets",
        },
        "mcv": {
            "patterns": [
                r"MCV.*?(\d+\.?\d*)\s*[fF][lL]",
                r"平均红细胞体积.*?(\d+\.?\d*)",
            ],
            "unit": "fL",
            "name": "平均红细胞体积",
            "name_en": "MCV",
        },
        "mch": {
            "patterns": [
                r"MCH.*?(\d+\.?\d*)\s*[pP][gG]",
                r"平均红细胞血红蛋白量.*?(\d+\.?\d*)",
            ],
            "unit": "pg",
            "name": "平均红细胞血红蛋白量",
            "name_en": "MCH",
        },
        "mchc": {
            "patterns": [
                r"MCHC.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"平均红细胞血红蛋白浓度.*?(\d+\.?\d*)",
            ],
            "unit": "g/L",
            "name": "平均红细胞血红蛋白浓度",
            "name_en": "MCHC",
        },
        "neutrophil": {
            "patterns": [
                r"中性粒细胞.*?绝对值.*?(\d+\.?\d*)",
                r"中性粒细胞.*?(\d+\.?\d*)\s*%",
                r"NEUT#.*?(\d+\.?\d*)",
            ],
            "unit": "×10^9/L",
            "name": "中性粒细胞计数",
            "name_en": "Neutrophils",
        },
        "lymphocyte": {
            "patterns": [
                r"淋巴细胞.*?绝对值.*?(\d+\.?\d*)",
                r"淋巴细胞.*?(\d+\.?\d*)\s*%",
                r"LYM#.*?(\d+\.?\d*)",
            ],
            "unit": "×10^9/L",
            "name": "淋巴细胞计数",
            "name_en": "Lymphocytes",
        },
        "monocyte": {
            "patterns": [
                r"单核细胞.*?绝对值.*?(\d+\.?\d*)",
                r"MONO#.*?(\d+\.?\d*)",
            ],
            "unit": "×10^9/L",
            "name": "单核细胞计数",
            "name_en": "Monocytes",
        },
        "eosinophil": {
            "patterns": [
                r"嗜酸性粒细胞.*?绝对值.*?(\d+\.?\d*)",
                r"EO#.*?(\d+\.?\d*)",
            ],
            "unit": "×10^9/L",
            "name": "嗜酸性粒细胞计数",
            "name_en": "Eosinophils",
        },
        "basophil": {
            "patterns": [
                r"嗜碱性粒细胞.*?绝对值.*?(\d+\.?\d*)",
                r"BASO#.*?(\d+\.?\d*)",
            ],
            "unit": "×10^9/L",
            "name": "嗜碱性粒细胞计数",
            "name_en": "Basophils",
        },
        "rdw": {
            "patterns": [
                r"RDW.*?(\d+\.?\d*)\s*%",
                r"红细胞分布宽度.*?(\d+\.?\d*)\s*%",
            ],
            "unit": "%",
            "name": "红细胞分布宽度",
            "name_en": "RDW",
        },
    }

    # 生化指标 | Biochemistry
    BIOCHEMISTRY_PATTERNS = {
        "glucose": {
            "patterns": [
                r"血糖.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"葡萄糖.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"GLU.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "血糖",
            "name_en": "Glucose",
        },
        "hba1c": {
            "patterns": [
                r"糖化血红蛋白.*?(\d+\.?\d*)\s*%",
                r"HbA1c.*?(\d+\.?\d*)\s*%",
            ],
            "unit": "%",
            "name": "糖化血红蛋白",
            "name_en": "HbA1c",
        },
        "total_protein": {
            "patterns": [
                r"总蛋白.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"TP.*?(\d+\.?\d*)\s*[gG]/[lL]",
            ],
            "unit": "g/L",
            "name": "总蛋白",
            "name_en": "Total Protein",
        },
        "albumin": {
            "patterns": [
                r"白蛋白.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"ALB.*?(\d+\.?\d*)\s*[gG]/[lL]",
            ],
            "unit": "g/L",
            "name": "白蛋白",
            "name_en": "Albumin",
        },
        "globulin": {
            "patterns": [
                r"球蛋白.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"GLB.*?(\d+\.?\d*)\s*[gG]/[lL]",
            ],
            "unit": "g/L",
            "name": "球蛋白",
            "name_en": "Globulin",
        },
        "alt": {
            "patterns": [
                r"谷丙转氨酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"ALT.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"丙氨酸氨基转移酶.*?(\d+\.?\d*)",
            ],
            "unit": "U/L",
            "name": "谷丙转氨酶",
            "name_en": "ALT",
        },
        "ast": {
            "patterns": [
                r"谷草转氨酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"AST.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"天门冬氨酸氨基转移酶.*?(\d+\.?\d*)",
            ],
            "unit": "U/L",
            "name": "谷草转氨酶",
            "name_en": "AST",
        },
        "alp": {
            "patterns": [
                r"碱性磷酸酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"ALP.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "碱性磷酸酶",
            "name_en": "ALP",
        },
        "ggt": {
            "patterns": [
                r"γ-谷氨酰转肽酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"GGT.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "γ-谷氨酰转肽酶",
            "name_en": "GGT",
        },
        "tbil": {
            "patterns": [
                r"总胆红素.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
                r"TBIL.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
            ],
            "unit": "μmol/L",
            "name": "总胆红素",
            "name_en": "Total Bilirubin",
        },
        "dbil": {
            "patterns": [
                r"直接胆红素.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
                r"DBIL.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
            ],
            "unit": "μmol/L",
            "name": "直接胆红素",
            "name_en": "Direct Bilirubin",
        },
        "ibil": {
            "patterns": [
                r"间接胆红素.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
                r"IBIL.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
            ],
            "unit": "μmol/L",
            "name": "间接胆红素",
            "name_en": "Indirect Bilirubin",
        },
        "bun": {
            "patterns": [
                r"尿素氮.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"BUN.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "尿素氮",
            "name_en": "BUN",
        },
        "creatinine": {
            "patterns": [
                r"肌酐.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
                r"CREA.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
                r"Cr.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
            ],
            "unit": "μmol/L",
            "name": "肌酐",
            "name_en": "Creatinine",
        },
        "ua": {
            "patterns": [
                r"尿酸.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
                r"UA.*?(\d+\.?\d*)\s*[μu]?[mM][oO][lL]",
            ],
            "unit": "μmol/L",
            "name": "尿酸",
            "name_en": "Uric Acid",
        },
        "tg": {
            "patterns": [
                r"甘油三酯.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"TG.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "甘油三酯",
            "name_en": "Triglycerides",
        },
        "tc": {
            "patterns": [
                r"总胆固醇.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"TC.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"CHOL.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "总胆固醇",
            "name_en": "Total Cholesterol",
        },
        "hdl": {
            "patterns": [
                r"高密度脂蛋白胆固醇.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"HDL-C.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"HDL.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "高密度脂蛋白胆固醇",
            "name_en": "HDL-C",
        },
        "ldl": {
            "patterns": [
                r"低密度脂蛋白胆固醇.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"LDL-C.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"LDL.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "低密度脂蛋白胆固醇",
            "name_en": "LDL-C",
        },
        "k": {
            "patterns": [
                r"钾.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"K\\+?.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"血钾.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "钾",
            "name_en": "Potassium",
        },
        "na": {
            "patterns": [
                r"钠.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"Na\\+?.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"血钠.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "钠",
            "name_en": "Sodium",
        },
        "cl": {
            "patterns": [
                r"氯.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"Cl-?.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"血氯.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "氯",
            "name_en": "Chloride",
        },
        "ca": {
            "patterns": [
                r"钙.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"Ca\\+?.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"血钙.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "钙",
            "name_en": "Calcium",
        },
        "p": {
            "patterns": [
                r"磷.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"无机磷.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "磷",
            "name_en": "Phosphorus",
        },
        "mg": {
            "patterns": [
                r"镁.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
                r"Mg.*?(\d+\.?\d*)\s*[mM][mM][oO][lL]",
            ],
            "unit": "mmol/L",
            "name": "镁",
            "name_en": "Magnesium",
        },
        "amy": {
            "patterns": [
                r"淀粉酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"AMY.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "淀粉酶",
            "name_en": "Amylase",
        },
        "lps": {
            "patterns": [
                r"脂肪酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"LPS.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "脂肪酶",
            "name_en": "Lipase",
        },
        "ck": {
            "patterns": [
                r"肌酸激酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"CK.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "肌酸激酶",
            "name_en": "CK",
        },
        "ckmb": {
            "patterns": [
                r"肌酸激酶同工酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"CK-MB.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "CK-MB",
            "name_en": "CK-MB",
        },
        "ldh": {
            "patterns": [
                r"乳酸脱氢酶.*?(\d+\.?\d*)\s*[uU]/[lL]",
                r"LDH.*?(\d+\.?\d*)\s*[uU]/[lL]",
            ],
            "unit": "U/L",
            "name": "乳酸脱氢酶",
            "name_en": "LDH",
        },
        "troponin": {
            "patterns": [
                r"肌钙蛋白.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
                r"cTnI.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
                r"cTnT.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
            ],
            "unit": "ng/mL",
            "name": "肌钙蛋白",
            "name_en": "Troponin",
        },
        "bnp": {
            "patterns": [
                r"BNP.*?(\d+\.?\d*)\s*[pP][gG]/[mM][lL]",
                r"脑钠肽.*?(\d+\.?\d*)\s*[pP][gG]/[mM][lL]",
                r"NT-proBNP.*?(\d+\.?\d*)",
            ],
            "unit": "pg/mL",
            "name": "BNP/NT-proBNP",
            "name_en": "BNP",
        },
    }

    # 炎症和免疫指标
    INFLAMMATION_PATTERNS = {
        "crp": {
            "patterns": [
                r"C反应蛋白.*?(\d+\.?\d*)\s*[mM][gG]/[lL]",
                r"CRP.*?(\d+\.?\d*)\s*[mM][gG]/[lL]",
            ],
            "unit": "mg/L",
            "name": "C反应蛋白",
            "name_en": "CRP",
        },
        "pct": {
            "patterns": [
                r"降钙素原.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
                r"PCT.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
            ],
            "unit": "ng/mL",
            "name": "降钙素原",
            "name_en": "Procalcitonin",
        },
        "esr": {
            "patterns": [
                r"血沉.*?(\d+\.?\d*)\s*[mM][mM]/[hH]",
                r"ESR.*?(\d+\.?\d*)\s*[mM][mM]/[hH]",
                r"红细胞沉降率.*?(\d+\.?\d*)\s*[mM][mM]/[hH]",
            ],
            "unit": "mm/h",
            "name": "血沉",
            "name_en": "ESR",
        },
        "ferritin": {
            "patterns": [
                r"铁蛋白.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
                r"Ferritin.*?(\d+\.?\d*)\s*[nN][gG]/[mM][lL]",
            ],
            "unit": "ng/mL",
            "name": "铁蛋白",
            "name_en": "Ferritin",
        },
        "il6": {
            "patterns": [
                r"白介素-?6.*?(\d+\.?\d*)\s*[pP][gG]/[mM][lL]",
                r"IL-?6.*?(\d+\.?\d*)\s*[pP][gG]/[mM][lL]",
            ],
            "unit": "pg/mL",
            "name": "白介素-6",
            "name_en": "IL-6",
        },
        "tnf": {
            "patterns": [
                r"肿瘤坏死因子.*?(\d+\.?\d*)\s*[pP][gG]/[mM][lL]",
                r"TNF-?α.*?(\d+\.?\d*)\s*[pP][gG]/[mM][lL]",
            ],
            "unit": "pg/mL",
            "name": "肿瘤坏死因子-α",
            "name_en": "TNF-α",
        },
    }

    # 凝血功能
    COAGULATION_PATTERNS = {
        "pt": {
            "patterns": [
                r"凝血酶原时间.*?(\d+\.?\d*)\s*[sS]",
                r"PT.*?(\d+\.?\d*)\s*[sS]",
            ],
            "unit": "s",
            "name": "凝血酶原时间",
            "name_en": "PT",
        },
        "inr": {
            "patterns": [
                r"INR.*?(\d+\.?\d*)",
                r"国际标准化比值.*?(\d+\.?\d*)",
            ],
            "unit": "",
            "name": "INR",
            "name_en": "INR",
        },
        "aptt": {
            "patterns": [
                r"活化部分凝血活酶时间.*?(\d+\.?\d*)\s*[sS]",
                r"APTT.*?(\d+\.?\d*)\s*[sS]",
            ],
            "unit": "s",
            "name": "APTT",
            "name_en": "APTT",
        },
        "tt": {
            "patterns": [
                r"凝血酶时间.*?(\d+\.?\d*)\s*[sS]",
                r"TT.*?(\d+\.?\d*)\s*[sS]",
            ],
            "unit": "s",
            "name": "凝血酶时间",
            "name_en": "TT",
        },
        "fib": {
            "patterns": [
                r"纤维蛋白原.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"FIB.*?(\d+\.?\d*)\s*[gG]/[lL]",
                r"Fbg.*?(\d+\.?\d*)\s*[gG]/[lL]",
            ],
            "unit": "g/L",
            "name": "纤维蛋白原",
            "name_en": "Fibrinogen",
        },
        "d_dimer": {
            "patterns": [
                r"D-?二聚体.*?(\d+\.?\d*)\s*[mM][gG]/[lL]",
                r"D-?dimer.*?(\d+\.?\d*)\s*[mM][gG]/[lL]",
                r"D-Dimer.*?(\d+\.?\d*)\s*[μu]?[gG]/[mM][lL]",
            ],
            "unit": "mg/L",
            "name": "D-二聚体",
            "name_en": "D-Dimer",
        },
    }

    # 尿液检查
    URINALYSIS_PATTERNS = {
        "urine_ph": {
            "patterns": [
                r"尿液?pH[:：]\s*(\d+\.?\d*)",
            ],
            "unit": "",
            "name": "尿液pH",
            "name_en": "Urine pH",
        },
        "urine_specific_gravity": {
            "patterns": [
                r"尿比重[:：]\s*(\d+\.?\d*)",
            ],
            "unit": "",
            "name": "尿比重",
            "name_en": "Specific Gravity",
        },
        "urine_glucose": {
            "patterns": [
                r"尿糖[:：]\s*([\-+\d]+)",
                r"尿糖.*?([阴性阳性\-+\\d]+)",
            ],
            "unit": "",
            "name": "尿糖",
            "name_en": "Urine Glucose",
        },
        "urine_protein": {
            "patterns": [
                r"尿蛋白[:：]\s*([\-+\d]+)",
                r"尿蛋白.*?([阴性阳性\-+\\d]+)",
            ],
            "unit": "",
            "name": "尿蛋白",
            "name_en": "Urine Protein",
        },
        "urine_ketone": {
            "patterns": [
                r"尿酮体[:：]\s*([\-+\d]+)",
                r"尿酮.*?([阴性阳性\-+\\d]+)",
            ],
            "unit": "",
            "name": "尿酮体",
            "name_en": "Urine Ketone",
        },
        "urine_occult_blood": {
            "patterns": [
                r"尿潜血[:：]\s*([\-+\d]+)",
                r"尿隐血[:：]\s*([\-+\d]+)",
            ],
            "unit": "",
            "name": "尿潜血",
            "name_en": "Urine Occult Blood",
        },
        "urine_bilirubin": {
            "patterns": [
                r"尿胆红素[:：]\s*([\-+\d]+)",
            ],
            "unit": "",
            "name": "尿胆红素",
            "name_en": "Urine Bilirubin",
        },
        "urine_urobilinogen": {
            "patterns": [
                r"尿胆原[:：]\s*([\-+\d]+)",
            ],
            "unit": "",
            "name": "尿胆原",
            "name_en": "Urobilinogen",
        },
        "urine_nitrite": {
            "patterns": [
                r"亚硝酸盐[:：]\s*([\-+\d]+)",
            ],
            "unit": "",
            "name": "亚硝酸盐",
            "name_en": "Nitrite",
        },
        "urine_leukocyte": {
            "patterns": [
                r"尿白细胞[:：]\s*([\-+\d]+)",
            ],
            "unit": "",
            "name": "尿白细胞",
            "name_en": "Urine Leukocyte",
        },
    }

    def __init__(self):
        self.all_patterns = {
            **self.CBC_PATTERNS,
            **self.BIOCHEMISTRY_PATTERNS,
            **self.INFLAMMATION_PATTERNS,
            **self.COAGULATION_PATTERNS,
            **self.URINALYSIS_PATTERNS,
        }

    def extract_lab_values(self, text: str) -> Dict[str, LabValue]:
        """从文本中提取所有实验室检查值"""
        if not text:
            return {}

        results = {}

        for code, config in self.all_patterns.items():
            for pattern in config["patterns"]:
                try:
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        value = match.group(1) if match.groups() else match.group(0)
                        if value:
                            lab_value = LabValue(
                                name=config["name"],
                                name_en=config["name_en"],
                                value=value,
                                unit=config["unit"],
                                category=self._get_category(code),
                            )
                            results[code] = lab_value
                            break
                except Exception as e:
                    logger.warning(f"Error extracting {code}: {e}")
                    continue

        return results

    def _get_category(self, code: str) -> ExamCategory:
        """根据指标代码获取类别"""
        if code in self.CBC_PATTERNS:
            return ExamCategory.LAB_BLOOD
        elif code in self.BIOCHEMISTRY_PATTERNS:
            return ExamCategory.LAB_BIOCHEMISTRY
        elif code in self.INFLAMMATION_PATTERNS:
            return ExamCategory.LAB_IMMUNOLOGY
        elif code in self.COAGULATION_PATTERNS:
            return ExamCategory.LAB_COAGULATION
        elif code in self.URINALYSIS_PATTERNS:
            return ExamCategory.LAB_URINE
        return ExamCategory.LAB_BLOOD

    def extract_imaging_findings(self, text: str) -> List[ImagingFinding]:
        """从文本中提取影像学检查结果"""
        if not text:
            return []

        findings = []

        imaging_patterns = [
            (
                r"(?:胸部|头颅|腹部|盆腔|脊柱|关节|胸部)?CT[检查扫描]?[:：]?([^。；\\n]+(?:发现|显示|可见|未见)[^。；\\n]+)",
                "CT",
            ),
            (
                r"(?:头部|颅脑|脊柱|关节|腹部|盆腔)?MRI[检查扫描]?[:：]?([^。；\\n]+(?:发现|显示|可见|未见)[^。；\\n]+)",
                "MRI",
            ),
            (
                r"(?:胸部|腹部|脊柱|四肢|关节)?X线[检查片]?[:：]?([^。；\\n]+(?:发现|显示|可见|未见)[^。；\\n]+)",
                "X线",
            ),
            (
                r"(?:腹部|心脏|甲状腺|乳腺|泌尿系|妇科)?超声[检查]?[:：]?([^。；\\n]+(?:发现|显示|可见|未见)[^。；\\n]+)",
                "超声",
            ),
            (r"B超[检查]?[:：]?([^。；\\n]+(?:发现|显示|可见|未见)[^。；\\n]+)", "B超"),
            (
                r"彩超[检查]?[:：]?([^。；\\n]+(?:发现|显示|可见|未见)[^。；\\n]+)",
                "彩超",
            ),
        ]

        for pattern, modality in imaging_patterns:
            try:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    finding_text = match.group(1).strip()
                    if finding_text and len(finding_text) > 5:
                        body_part_match = re.search(
                            r"(胸部|头颅|头部|腹部|盆腔|脊柱|关节|心脏|甲状腺|乳腺|四肢)",
                            match.group(0),
                        )
                        body_part = (
                            body_part_match.group(1) if body_part_match else "未指定"
                        )

                        findings.append(
                            ImagingFinding(
                                modality=modality,
                                body_part=body_part,
                                findings=finding_text,
                            )
                        )
            except Exception as e:
                logger.warning(f"Error extracting imaging: {e}")
                continue

        return findings

    def extract_function_tests(self, text: str) -> List[FunctionTest]:
        """从文本中提取功能检查结果"""
        if not text:
            return []

        tests = []

        # 心电图
        ecg_pattern = (
            r"心电图[检查]?[:：]?([^。；\\n]+(?:心律|心率|波形|ST段|QT间期)[^。；\\n]+)"
        )
        for match in re.finditer(ecg_pattern, text, re.IGNORECASE):
            tests.append(
                FunctionTest(test_type="心电图", conclusion=match.group(1).strip())
            )

        # 肺功能
        pft_pattern = (
            r"肺功能[检查]?[:：]?([^。；\\n]+(?:通气功能|弥散功能|FEV1|FVC)[^。；\\n]+)"
        )
        for match in re.finditer(pft_pattern, text, re.IGNORECASE):
            tests.append(
                FunctionTest(test_type="肺功能", conclusion=match.group(1).strip())
            )

        # 超声心动图
        echo_pattern = r"(?:超声心动图|心脏超声|心超)[检查]?[:：]?([^。；\\n]+(?:射血分数|EF|瓣膜|心室)[^。；\\n]+)"
        for match in re.finditer(echo_pattern, text, re.IGNORECASE):
            tests.append(
                FunctionTest(test_type="超声心动图", conclusion=match.group(1).strip())
            )

        return tests

    def extract_all_medical_data(self, text: str) -> Dict[str, Any]:
        """从文本中提取所有医学数据"""
        if not text:
            return {"lab_values": {}, "imaging_findings": [], "function_tests": []}

        lab_values = self.extract_lab_values(text)
        imaging = self.extract_imaging_findings(text)
        function_tests = self.extract_function_tests(text)

        return {
            "lab_values": {
                k: {
                    "name": v.name,
                    "name_en": v.name_en,
                    "value": v.value,
                    "unit": v.unit,
                }
                for k, v in lab_values.items()
            },
            "imaging_findings": [
                {
                    "modality": f.modality,
                    "body_part": f.body_part,
                    "findings": f.findings,
                }
                for f in imaging
            ],
            "function_tests": [
                {"test_type": t.test_type, "conclusion": t.conclusion}
                for t in function_tests
            ],
        }

    def get_flattened_lab_values(self, text: str) -> Dict[str, str]:
        """获取扁平化的实验室检查值（用于CSV导出）"""
        lab_values = self.extract_lab_values(text)
        return {
            code: f"{value.value} {value.unit}".strip()
            for code, value in lab_values.items()
        }


# 全局实例
medical_data_extractor = MedicalDataExtractor()


def extract_medical_data_for_export(text: str) -> Dict[str, Any]:
    """便捷函数：从文本中提取所有医学数据用于导出"""
    return medical_data_extractor.extract_all_medical_data(text)


def get_lab_values_for_csv(text: str) -> Dict[str, str]:
    """便捷函数：获取用于CSV导出的实验室检查值"""
    return medical_data_extractor.get_flattened_lab_values(text)
