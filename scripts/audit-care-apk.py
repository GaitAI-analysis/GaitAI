"""Read-only release inspection. Never copies the APK or reads signing keys."""
import hashlib
import json
from pathlib import Path
import re
import zipfile

root = Path(__file__).resolve().parents[1]
care = root.parent.parent / 'GaitAI-Care'
apk = care / 'android-builds/GaitAI-Care-1.0.0.apk'
patterns = {
    'private_key': rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
    'aws_access_key': rb'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'github_token': rb'\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}',
    'service_account': rb'"type"\s*:\s*"service_account"',
    'postgres_credentials': rb'postgres(?:ql)?://[^\s/:]+:[^\s@]+@',
    'supabase_secret': rb'\bsb_secret_[A-Za-z0-9_-]+',
    'private_jwt': rb'eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}',
}
with zipfile.ZipFile(apk) as z:
    names = z.namelist()
    forbidden = [n for n in names if re.search(r'(^|/)(\.env(?:\.|$)|.*\.(?:jks|keystore|pem|p12|pfx|sqlite|sqlite3|db)$|keystore.properties|service.account)', n, re.I)]
    findings = []
    for n in names:
        if n.endswith('/'):
            continue
        data = z.read(n)
        for label, pattern in patterns.items():
            if re.search(pattern, data):
                findings.append({'file': n, 'kind': label})
    matches, mismatches = [], []
    for source in (care / 'web').iterdir():
        packaged = 'assets/public/' + source.name
        if source.is_file() and packaged in names and source.suffix in ('.js', '.css', '.png'):
            (matches if source.read_bytes() == z.read(packaged) else mismatches).append(source.name)
    web_names = [n for n in names if n.startswith('assets/public/')]
    report = {
        'file': apk.name, 'bytes': apk.stat().st_size,
        'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
        'zip_entries': len(names), 'forbidden_files': forbidden,
        'secret_pattern_findings': findings,
        'source_matched_assets': matches, 'source_differences': mismatches,
        'packaged_web_files': web_names,
        'limitations': 'Pattern scan and source comparison, not a full malware audit. Original approved release checksum still required.',
    }
out = root / 'tmp/care-launch'
out.mkdir(parents=True, exist_ok=True)
(out / 'apk-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({k: v for k, v in report.items() if k != 'packaged_web_files'}, indent=2))
