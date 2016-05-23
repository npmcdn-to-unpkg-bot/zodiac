testsContext = require.context(".", true, /\/[^_]+/)
testsContext.keys().forEach(testsContext)
