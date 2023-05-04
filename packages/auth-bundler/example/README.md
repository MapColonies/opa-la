# Examples

Before running any of the examples you should install the dependencies and build the packages in the root of the lerna project.

```
npm install && npx lerna run build
```

## templating.mjs

In this example its possible to run only the templating engine.

## basic.mjs

This example shows the flow of connecting to the db, fetching a bundle, and creating a tarball.
It depends on having a database ready with data.
