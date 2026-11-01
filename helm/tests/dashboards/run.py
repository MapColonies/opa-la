#!/usr/bin/env python3
"""Run cases.yaml against the dashboard queries rendered from the chart.

Usage: python3 helm/tests/dashboards/run.py
Needs helm and PyYAML, plus promtool or docker (falls back to the prom/prometheus image).
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

import yaml

HERE = pathlib.Path(__file__).resolve().parent
CHART = HERE.parent.parent
PROMETHEUS_IMAGE = 'prom/prometheus:v3.1.0'
EVAL_TIME = '20m'


def render_dashboards():
    out = subprocess.run(
        ['helm', 'template', 'opala', str(CHART),
         '--set', 'global.mclabels.environment=development',
         '--set', 'opa.opaEnvironment=development',
         '--show-only', 'templates/dashboards-secret.yaml'],
        check=True, capture_output=True, text=True).stdout
    secret = yaml.safe_load(out)
    return {name.removesuffix('.json'): json.loads(body) for name, body in secret['stringData'].items()}


def find_query(dashboards, ref):
    dashboard, panel_id, ref_id = ref.split('/')

    def panels(ps):
        for p in ps:
            yield p
            yield from panels(p.get('panels', []))

    for p in panels(dashboards[dashboard]['panels']):
        if str(p['id']) == panel_id:
            for t in p.get('targets', []):
                if t.get('refId') == ref_id:
                    return t['expr']
    raise KeyError(f'no query {ref}')


def substitute(expr, variables):
    def var(m):
        name = m.group(1) or m.group(2)
        if name not in variables:
            raise KeyError(f'no value for Grafana variable {name} in: {expr}')
        return variables[name]

    return re.sub(r'\$\{([a-z_]+(?::[a-z]+)?)\}|\$([a-z_]+)', var, expr)


def promtool_test(test_file):
    if shutil.which('promtool'):
        cmd = ['promtool', 'test', 'rules', str(test_file)]
    else:
        cmd = ['docker', 'run', '--rm', '--entrypoint', 'promtool', '-v', f'{test_file.parent}:/tests:ro',
               PROMETHEUS_IMAGE, 'test', 'rules', f'/tests/{test_file.name}']
    return subprocess.run(cmd).returncode


def main():
    cases = yaml.safe_load((HERE / 'cases.yaml').read_text())
    dashboards = render_dashboards()
    tests = []
    for group in cases['groups']:
        exprs = [{
            'expr': substitute(find_query(dashboards, t['query']), group['vars']),
            'eval_time': EVAL_TIME,
            'exp_samples': t['exp_samples'],
        } for t in group['tests']]
        tests.append({
            'name': group['name'],
            'interval': cases['evaluation_interval'],
            'input_series': cases['input_series'],
            'promql_expr_test': exprs,
        })
    with tempfile.TemporaryDirectory() as tmp:
        pathlib.Path(tmp).chmod(0o755)  # promtool in the container runs as nobody
        test_file = pathlib.Path(tmp) / 'dashboards_test.yaml'
        test_file.write_text(yaml.safe_dump({'rule_files': [], 'tests': tests}, sort_keys=False))
        return promtool_test(test_file)


if __name__ == '__main__':
    sys.exit(main())
