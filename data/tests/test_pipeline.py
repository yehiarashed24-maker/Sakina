import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / 'scripts'


def test_run_pipeline():
    r = subprocess.run(['python', str(SCRIPTS / 'run_pipeline.py')], cwd=str(ROOT))
    assert r.returncode == 0
