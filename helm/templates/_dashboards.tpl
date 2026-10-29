{{/*
Helpers for the Grafana dashboards in dashboards/. The dashboards are rendered with tpl, so
helpers used inside JSON strings return JSON-escaped text.
*/}}

{{/*
Enabled dashboard environments in dropdown order, as a JSON list. Each entry holds the
environment's values plus its bundle environment (key) and the opaEnvironment of the OPAs
serving it (name), which is what Prometheus and Loki labels carry.
*/}}
{{- define "opa-la.dashboards.environments" -}}
{{- if hasKey .Values.dashboards "values" -}}
{{- fail "dashboards.values was replaced by dashboards.environments. Move each environment's openshiftUrl there and set its prometheusDatasourceUid and lokiDatasourceUid (namespace is no longer needed). See values.yaml." -}}
{{- end -}}
{{- $opaEnvironments := dict "np" "development" "stage" "staging" "prod" "production" -}}
{{- $envs := list -}}
{{- range $key := list "np" "stage" "prod" -}}
{{- $env := get $.Values.dashboards.environments $key | default dict -}}
{{- if $env.enabled -}}
{{- $envs = append $envs (merge (dict "key" $key "name" (get $opaEnvironments $key)) $env) -}}
{{- end -}}
{{- end -}}
{{- if not $envs -}}
{{- fail "dashboards: enable at least one of dashboards.environments, or set dashboards.enabled=false" -}}
{{- end -}}
{{- toJson $envs -}}
{{- end -}}

{{/*
SQL returning a field of the environment selected in $env. Grafana variables can't map one
value to another, so the mapping runs through the site's Postgres datasource.
Usage: include "opa-la.dashboards.envCase" (dict "root" . "field" "prometheusDatasourceUid")
*/}}
{{- define "opa-la.dashboards.envCase" -}}
{{- $cases := list -}}
{{- range include "opa-la.dashboards.environments" .root | fromJsonArray -}}
{{- $cases = append $cases (printf "when '%s' then '%s'" .key (get . $.field | trimSuffix "/")) -}}
{{- end -}}
{{- printf "select case '$env' %s end" (join " " $cases) -}}
{{- end -}}

{{/*
Hidden query variable holding a field of the selected environment.
Usage: include "opa-la.dashboards.mappedVariable" (dict "root" . "name" "prom" "label" "..." "field" "..." "default" $env)
*/}}
{{- define "opa-la.dashboards.mappedVariable" -}}
{{- $sql := include "opa-la.dashboards.envCase" (dict "root" .root "field" .field) -}}
{{- $current := get .default .field | trimSuffix "/" -}}
{{- toJson (dict
  "name" .name
  "label" .label
  "type" "query"
  "datasource" (dict "type" "grafana-postgresql-datasource" "uid" "${pg}")
  "definition" $sql
  "query" $sql
  "current" (dict "text" $current "value" $current)
  "options" (list)
  "includeAll" false
  "hide" 2
  "refresh" 1
  "skipUrlSync" true
) -}}
{{- end -}}

{{/*
Template variables shared by the dashboards, as comma-separated JSON objects to put first in
templating.list: pg (the site's database), env (the environment picker, value np/stage/prod,
text development/staging/production) and prom, loki and console_url mapped from the selected env.
*/}}
{{- define "opa-la.dashboards.variables" -}}
{{- $envs := include "opa-la.dashboards.environments" . | fromJsonArray -}}
{{- $defaultKey := .Values.dashboards.defaultEnvironment -}}
{{- $default := dict -}}
{{- $options := list -}}
{{- $choices := list -}}
{{- range $envs -}}
{{- if eq .key $defaultKey -}}
{{- $default = . -}}
{{- end -}}
{{- $options = append $options (dict "selected" (eq .key $defaultKey) "text" .name "value" .key) -}}
{{- $choices = append $choices (printf "%s : %s" .name .key) -}}
{{- end -}}
{{- if not $default -}}
{{- fail (printf "dashboards.defaultEnvironment %q must be one of the enabled dashboards.environments" $defaultKey) -}}
{{- end -}}
{{- $pg := printf "infra-opala-%s" (include "opa-la.environment" .) -}}
{{- $vars := list
  (dict
    "name" "pg"
    "label" "Postgres"
    "type" "datasource"
    "query" "grafana-postgresql-datasource"
    "regex" "/.*opala.*/"
    "current" (dict "text" $pg "value" $pg)
    "options" (list)
    "hide" 2
    "refresh" 1
  )
  (dict
    "name" "env"
    "label" "Environment"
    "type" "custom"
    "query" (join "," $choices)
    "current" (dict "text" $default.name "value" $default.key)
    "options" $options
    "includeAll" false
  )
-}}
{{- $mapped := list
  (dict "name" "prom" "label" "Prometheus (mapped from env)" "field" "prometheusDatasourceUid")
  (dict "name" "loki" "label" "Loki (mapped from env)" "field" "lokiDatasourceUid")
  (dict "name" "console_url" "label" "OpenShift console (mapped from env)" "field" "openshiftUrl")
-}}
{{- range $mapped -}}
{{- $args := dict "root" $ "default" $default "name" .name "label" .label "field" .field -}}
{{- $vars = append $vars (include "opa-la.dashboards.mappedVariable" $args | fromJson) -}}
{{- end -}}
{{- $vars | toJson | trimPrefix "[" | trimSuffix "]" -}}
{{- end -}}

{{/*
PromQL label matchers selecting this site's OPA pods serving the selected environment.
*/}}
{{- define "opa-la.dashboards.opaMatchers" -}}
{{- printf "mapcolonies_io_environment=%q, mapcolonies_io_opa_environment=\"${env:text}\"" (include "opa-la.environment" .) -}}
{{- end -}}

{{/*
Bundle status of each selected OPA pod, by instance: 2 = stale (stopped polling, or still on an
old revision after the grace window), 1 = updating (old revision within the grace window).
Up-to-date pods have no value.
*/}}
{{- define "opa-la.dashboards.podBundleStatusPromql" -}}
{{- $m := include "opa-la.dashboards.opaMatchers" . -}}
{{- printf "((max by (instance) ((time() - last_bundle_request{%s} / 1e9) > ($grace_window_minutes * 60)) * 0 + 2) or (max by (instance) (last_success_bundle_activation{%s} unless on(active_revision) label_replace(vector(1), \"active_revision\", \"$latest_revision\", \"\", \"\")) * 0 + (1 + $grace_expired)))" $m $m -}}
{{- end -}}

{{/*
Filter keeping fluent-bit series (decision metrics, fluent-bit health) of the selected OPA pods.
fluent-bit pods don't carry the OPA labels, so they are joined on the release they share.
*/}}
{{- define "opa-la.dashboards.fluentbitFilterPromql" -}}
{{- printf "and on(app_kubernetes_io_instance) max by (app_kubernetes_io_instance) (last_success_bundle_activation{%s})" (include "opa-la.dashboards.opaMatchers" .) -}}
{{- end -}}

{{/*
JSON-escaped versions of the PromQL helpers, for use inside dashboard query strings.
*/}}
{{- define "opa-la.dashboards.opaSelector" -}}
{{- include "opa-la.dashboards.opaMatchers" . | toJson | trimPrefix "\"" | trimSuffix "\"" -}}
{{- end -}}

{{- define "opa-la.dashboards.podBundleStatus" -}}
{{- include "opa-la.dashboards.podBundleStatusPromql" . | toJson | trimPrefix "\"" | trimSuffix "\"" -}}
{{- end -}}

{{- define "opa-la.dashboards.fluentbitFilter" -}}
{{- include "opa-la.dashboards.fluentbitFilterPromql" . | toJson | trimPrefix "\"" | trimSuffix "\"" -}}
{{- end -}}

{{/*
PromQL label matcher selecting the site's own services (auth-manager, auth-cron).
*/}}
{{- define "opa-la.dashboards.servicesSelector" -}}
{{- printf "namespace=%q" .Release.Namespace | toJson | trimPrefix "\"" | trimSuffix "\"" -}}
{{- end -}}
