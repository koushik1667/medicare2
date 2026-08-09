"""
AI Lab Report Extractor Service | AI 检验报告提取服务

使用大语言模型从 MinerU 提取的检验报告文本中提取结构化的检验数据。
"""

import json
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)


@dataclass
class LabReportItem:
    """检验项目"""

    name: str  # 项目名称（中文）
    name_en: Optional[str]  # 英文名称/缩写
    value: str  # 结果值
    unit: Optional[str]  # 单位
    reference_range: Optional[str]  # 参考范围
    is_abnormal: Optional[bool]  # 是否异常
    category: str  # 类别（血常规/生化/尿常规等）


class AIReportExtractor:
    """
    AI 驱动的检验报告提取器

    使用 LLM 从 MinerU 提取的文本中提取结构化的检验数据
    """

    # 提取提示词模板
    EXTRACTION_PROMPT = """你是一名医学检验专家。请从以下检验报告文本中提取所有检验项目的结构化数据。

【报告文本】：
{report_text}

【任务】：
1. 识别并提取所有检验项目
2. 对每个项目提取：项目名称、结果值、单位、参考范围
3. 判断每个项目所属的类别
4. 标记异常值（如果报告中已标记，或明显超出参考范围）

【输出格式】：
请严格按以下 JSON 格式输出，不要有任何其他文字：

{{
  "report_type": "检验报告类型（血常规/生化/尿常规/凝血等）",
  "patient_info": {{
    "name": "患者姓名（如果有）",
    "age": "年龄（如果有）",
    "gender": "性别（如果有）"
  }},
  "items": [
    {{
      "name": "项目名称（中文）",
      "name_en": "英文缩写（如WBC/RBC/ALT等）",
      "value": "结果值（纯数字）",
      "unit": "单位（如×10^9/L, g/L, U/L等）",
      "reference_range": "参考范围",
      "is_abnormal": true/false,
      "category": "类别（blood_routine/biochemistry/urine/coagulation/immunology等）"
    }}
  ],
  "summary": "报告总体印象（简要总结）"
}}

【注意事项】：
1. 只输出 JSON，不要有任何解释性文字
2. 如果某项信息缺失，使用 null 或空字符串
3. 数值只保留数字部分，不要包含单位
4. 尽量识别标准的英文缩写（如WBC、RBC、ALT、AST、Cr等）
5. 类别使用英文：blood_routine（血常规）、biochemistry（生化）、urine（尿常规）、coagulation（凝血）、immunology（免疫）
"""

    async def extract_lab_report(
        self, report_text: str, model_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        从检验报告文本中提取结构化数据

        Args:
            report_text: MinerU 提取的报告文本
            model_id: 可选的指定模型ID

        Returns:
            结构化的检验数据字典
        """
        if not report_text or len(report_text.strip()) < 10:
            logger.warning("Report text is too short or empty")
            return {"items": [], "report_type": "unknown"}

        try:
            # 构建提示词
            prompt = self.EXTRACTION_PROMPT.format(
                report_text=report_text[:8000]
            )  # 限制长度

            # 调用 AI 服务
            logger.info(
                f"Starting AI extraction for lab report, text length: {len(report_text)}"
            )

            response = await ai_service.generate_text(
                prompt=prompt,
                model_id=model_id,
                temperature=0.1,  # 低温度确保输出稳定
                max_tokens=4000,
            )

            # 解析 JSON 响应
            extracted_data = self._parse_extraction_response(response)

            logger.info(
                f"AI extraction completed: {len(extracted_data.get('items', []))} items extracted"
            )
            return extracted_data

        except Exception as e:
            logger.error(f"AI extraction failed: {e}")
            return {"items": [], "report_type": "unknown", "error": str(e)}

    def _parse_extraction_response(self, response: str) -> Dict[str, Any]:
        """解析 AI 提取的响应"""
        try:
            # 尝试直接解析 JSON
            data = json.loads(response.strip())
            return data
        except json.JSONDecodeError:
            # 如果直接解析失败，尝试提取 JSON 部分
            logger.warning(
                "Direct JSON parsing failed, trying to extract JSON from response"
            )

            # 查找 JSON 块
            start_idx = response.find("{")
            end_idx = response.rfind("}")

            if start_idx != -1 and end_idx != -1 and start_idx < end_idx:
                try:
                    json_str = response[start_idx : end_idx + 1]
                    data = json.loads(json_str)
                    return data
                except json.JSONDecodeError:
                    pass

            # 如果都失败了，返回空结果
            logger.error("Failed to parse AI response as JSON")
            return {
                "items": [],
                "report_type": "unknown",
                "raw_response": response[:500],
            }

    def convert_to_csv_format(self, extracted_data: Dict[str, Any]) -> Dict[str, str]:
        """
        将提取的数据转换为 CSV 导出格式

        Returns:
            扁平化的字典，键为字段名，值为字符串
        """
        result = {}

        items = extracted_data.get("items", [])

        # 映射表：常见的检验项目名称到标准字段名
        name_mapping = {
            # 血常规
            "白细胞": "wbc",
            "白细胞计数": "wbc",
            "WBC": "wbc",
            "红细胞": "rbc",
            "红细胞计数": "rbc",
            "RBC": "rbc",
            "血红蛋白": "hb",
            "HGB": "hb",
            "Hb": "hb",
            "红细胞压积": "hct",
            "HCT": "hct",
            "血小板": "plt",
            "血小板计数": "plt",
            "PLT": "plt",
            "平均红细胞体积": "mcv",
            "MCV": "mcv",
            "平均红细胞血红蛋白量": "mch",
            "MCH": "mch",
            "平均红细胞血红蛋白浓度": "mchc",
            "MCHC": "mchc",
            "红细胞分布宽度": "rdw",
            "RDW": "rdw",
            "中性粒细胞": "neutrophil",
            "中性粒细胞计数": "neutrophil",
            "中性粒细胞绝对值": "neutrophil",
            "淋巴细胞": "lymphocyte",
            "淋巴细胞计数": "lymphocyte",
            "淋巴细胞绝对值": "lymphocyte",
            "单核细胞": "monocyte",
            "单核细胞计数": "monocyte",
            "嗜酸性粒细胞": "eosinophil",
            "嗜酸性粒细胞计数": "eosinophil",
            "嗜碱性粒细胞": "basophil",
            "嗜碱性粒细胞计数": "basophil",
            # 生化
            "血糖": "glucose",
            "葡萄糖": "glucose",
            "糖化血红蛋白": "hba1c",
            "HbA1c": "hba1c",
            "总蛋白": "total_protein",
            "白蛋白": "albumin",
            "球蛋白": "globulin",
            "谷丙转氨酶": "alt",
            "ALT": "alt",
            "丙氨酸氨基转移酶": "alt",
            "谷草转氨酶": "ast",
            "AST": "ast",
            "天门冬氨酸氨基转移酶": "ast",
            "碱性磷酸酶": "alp",
            "ALP": "alp",
            "γ-谷氨酰转肽酶": "ggt",
            "GGT": "ggt",
            "谷氨酰转肽酶": "ggt",
            "总胆红素": "tbil",
            "直接胆红素": "dbil",
            "间接胆红素": "ibil",
            "尿素氮": "bun",
            "BUN": "bun",
            "肌酐": "creatinine",
            "尿酸": "ua",
            "甘油三酯": "tg",
            "TG": "tg",
            "总胆固醇": "tc",
            "TC": "tc",
            "高密度脂蛋白胆固醇": "hdl",
            "HDL": "hdl",
            "HDL-C": "hdl",
            "低密度脂蛋白胆固醇": "ldl",
            "LDL": "ldl",
            "LDL-C": "ldl",
            "钾": "k",
            "K": "k",
            "钠": "na",
            "Na": "na",
            "氯": "cl",
            "Cl": "cl",
            "钙": "ca",
            "Ca": "ca",
            "磷": "p",
            "镁": "mg",
            "淀粉酶": "amy",
            "脂肪酶": "lps",
            "肌酸激酶": "ck",
            "CK": "ck",
            "肌酸激酶同工酶": "ckmb",
            "CK-MB": "ckmb",
            "乳酸脱氢酶": "ldh",
            "LDH": "ldh",
            "肌钙蛋白": "troponin",
            "cTnI": "troponin",
            "BNP": "bnp",
            "NT-proBNP": "bnp",
            # 炎症
            "C反应蛋白": "crp",
            "CRP": "crp",
            "降钙素原": "pct",
            "PCT": "pct",
            "血沉": "esr",
            "ESR": "esr",
            "红细胞沉降率": "esr",
            "铁蛋白": "ferritin",
            "白介素-6": "il6",
            "IL-6": "il6",
            # 凝血
            "凝血酶原时间": "pt",
            "PT": "pt",
            "国际标准化比值": "inr",
            "INR": "inr",
            "活化部分凝血活酶时间": "aptt",
            "APTT": "aptt",
            "凝血酶时间": "tt",
            "TT": "tt",
            "纤维蛋白原": "fib",
            "D-二聚体": "d_dimer",
            "D-二聚体": "d_dimer",
            # 尿液
            "尿液pH": "urine_ph",
            "尿pH": "urine_ph",
            "尿比重": "urine_specific_gravity",
            "尿糖": "urine_glucose",
            "尿蛋白": "urine_protein",
            "尿酮体": "urine_ketone",
            "尿潜血": "urine_occult_blood",
            "尿胆红素": "urine_bilirubin",
            "尿胆原": "urine_urobilinogen",
            "亚硝酸盐": "urine_nitrite",
            "尿白细胞": "urine_leukocyte",
        }

        # 转换每个项目
        for item in items:
            name = item.get("name", "")
            name_en = item.get("name_en", "")

            # 查找匹配的字段名
            field_name = None
            if name in name_mapping:
                field_name = name_mapping[name]
            elif name_en in name_mapping:
                field_name = name_mapping[name_en]

            if field_name:
                # 组合数值和单位
                value = item.get("value", "")
                unit = item.get("unit", "")
                if value:
                    result[field_name] = f"{value} {unit}".strip()

                # 同时记录是否异常
                is_abnormal = item.get("is_abnormal")
                if is_abnormal is not None:
                    result[f"{field_name}_abnormal"] = "是" if is_abnormal else "否"

        return result


# 创建全局实例
ai_report_extractor = AIReportExtractor()


async def extract_lab_report_with_ai(
    report_text: str, model_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    便捷函数：使用 AI 提取检验报告

    Args:
        report_text: 报告文本
        model_id: 可选的模型ID

    Returns:
        结构化的检验数据
    """
    return await ai_report_extractor.extract_lab_report(report_text, model_id)
