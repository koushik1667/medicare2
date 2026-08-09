#!/usr/bin/env python3
import re
from pathlib import Path
from collections import defaultdict, Counter

BASE_DIR = Path(__file__).resolve().parents[1]  # repo root
SRC_PATTERNS = ["frontend/src/**/*.tsx", "frontend/src/**/*.ts"]

IMPORT_RE = re.compile(
    r"^\s*import\s+(?:type\s+)?(.*?)\s+from\s+['\"](.*?)['\"]\s*;?\s*$"
)


def analyze_file(file_path: Path):
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return None

    lines = content.splitlines()
    imports = []  # list of dicts: {line_num, line, module, clause}
    for i, line in enumerate(lines, start=1):
        m = IMPORT_RE.match(line)
        if not m:
            continue
        clause = m.group(1).strip()
        module = m.group(2).strip()
        imports.append(
            {"line_num": i, "line": line.rstrip(), "module": module, "clause": clause}
        )

    if not imports:
        return None

    # Group by module
    by_module = defaultdict(list)
    for imp in imports:
        by_module[imp["module"]].append(imp)

    issues = []

    # 1) Files with multiple identical imports from the same module
    for mod, imps in by_module.items():
        if len(imps) <= 1:
            continue
        # count identical lines
        line_counts = Counter([imp["line"].strip() for imp in imps])
        duplicates = [line for line, cnt in line_counts.items() if cnt > 1]
        if duplicates:
            issues.append(
                {
                    "type": "duplicate_identical_lines",
                    "module": mod,
                    "lines": duplicates,
                    "description": f"Duplicate import lines found for module '{mod}'.",
                }
            )

    # 2) Same module imported twice with different specifiers
    for mod, imps in by_module.items():
        if len(imps) <= 1:
            continue
        clauses = [imp["clause"].strip() for imp in imps]
        # normalize whitespace
        norm = [re.sub(r"\s+", " ", c).strip() for c in clauses]
        uniq = list(dict.fromkeys(norm))
        if len(uniq) > 1:
            # collect representative lines for each unique clause
            mapping = defaultdict(list)
            for imp in imps:
                key = re.sub(r"\s+", " ", imp["clause"].strip())
                mapping[key].append(imp["line"].strip())
            lines_by_clause = [" | ".join(sorted(set(v))) for v in mapping.values()]
            issues.append(
                {
                    "type": "duplicate_different_specifiers",
                    "module": mod,
                    "lines_by_clause": lines_by_clause,
                    "description": f"Module '{mod}' imported with different specifiers in multiple statements.",
                }
            )

    # 3) Files with duplicate React hooks imports (two or more imports from 'react')
    react_imports = by_module.get("react")
    if react_imports and len(react_imports) >= 2:
        # consider as duplicates if at least two import lines exist
        lines = [imp["line"].strip() for imp in react_imports]
        # optionally filter to those that actually import hooks (contain 'use') to reduce noise
        hooks_present = [ln for ln in lines if re.search(r"\buse[A-Za-z0-9_]+\b", ln)]
        target_lines = hooks_present if hooks_present else lines
        if len(target_lines) >= 2:
            issues.append(
                {
                    "type": "duplicate_react_hooks_imports",
                    "module": "react",
                    "lines": target_lines,
                    "description": "Multiple React hook imports detected from 'react' module.",
                }
            )

    # 4) Files with duplicate MUI component imports (imports from @mui/material or related)
    mui_modules = {"@mui/material", "@material-ui/core"}
    for mod in list(by_module.keys()):
        if mod in mui_modules:
            imps = by_module[mod]
            if len(imps) >= 2:
                lines = [imp["line"].strip() for imp in imps]
                issues.append(
                    {
                        "type": "duplicate_mui_imports",
                        "module": mod,
                        "lines": lines,
                        "description": f"Duplicate MUI imports from '{mod}'.",
                    }
                )

    if not issues:
        return None

    return {"file": str(file_path), "issues": issues}


def main():
    results = []
    patterns = []
    # collect files from both patterns
    patterns = ["frontend/src/**/*.tsx", "frontend/src/**/*.ts"]
    all_files = []
    for pat in patterns:
        for p in Path(BASE_DIR).glob(pat[len("frontend/src/") :]):
            pass
    # Simpler: use rglob directly
    base = BASE_DIR
    tsx = sorted(base.glob("frontend/src/**/*.tsx"))
    ts = sorted(base.glob("frontend/src/**/*.ts"))
    all_paths = tsx + ts
    for p in all_paths:
        if p.is_file():
            res = analyze_file(p)
            if res:
                results.append(res)

    # Print results in a readable format
    if not results:
        print("No duplicate-import patterns found.")
        return
    out_lines = []
    for item in results:
        out_lines.append(f"File: {item['file']}")
        for it in item["issues"]:
            t = it["type"]
            desc = it.get("description", "")
            out_lines.append(f"  - {desc}")
            if (
                t == "duplicate_identical_lines"
                or t == "duplicate_react_hooks_imports"
                or t == "duplicate_mui_imports"
            ):
                for ln in it.get("lines", []):
                    out_lines.append(f"    {ln}")
            if t == "duplicate_different_specifiers":
                for ln in it.get("lines_by_clause", []):
                    out_lines.append(f"    {ln}")
        out_lines.append("")

    print("\n".join(out_lines))


if __name__ == "__main__":
    main()
