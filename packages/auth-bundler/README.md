# `auth-bundler`

A library to facilitate creating authentication bundles for consumption with [Open Policy Agent](https://www.openpolicyagent.org/docs/latest/management-bundles/).

## API reference

TBD

## [Usage example](./example/)

## Templating engine

The package uses [handlebars](https://handlebarsjs.com/) for templating the asset files.
When running, the engine is supplied an array containing all the connections for the bundle to use for templating.

For convenience we have added the following helper function to aid creating json files:

### #escapeJson

Escapes the given string using the `JSON.stringify` function.

```
# input
{
  {{escapeJson name}}: {{ enabled }}
}

# result
{
  "avi": true
}
```

### #delimitedEach

Templated in a loop with `,` as a delimiter. useful for JSON arrays / objects.

```
# input
[
{{#delimitedEach .}}
{
  "name": {{ name }}
}
{{/delimitedEach}}
]

# result
[
{
  "name": avi
}
,{
  "name": iva
}
]
```
