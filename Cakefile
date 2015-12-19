
log = console.log

{spawn, exec}   = require 'child_process'
{writeFileSync} = require 'fs'
Browserify      = require 'browserify'
UglifyJS        = require 'uglify-js'

mkopts = (str, r={}) -> r[s] = true for s in str.split(' '); r

# Config

BUILDS        = ['zodiac', 'tests']
BROWSERIFY    = 'browserify -d -t coffeeify --extension=".coffee"'
OPTS          = mkopts 'mangle screw_ie8'
OPTS.compress = mkopts 'sequences dead_code conditionals booleans ' +
                       'unused if_return join_vars drop_console'

# Tasks

task 'build', ->
  for name in BUILDS
    compile "src/#{name}.coffee",
    "pkg/#{name}.js",
    "pkg/#{name}.min.js"
    console.log name

task 'clean', -> run 'rm pkg/*.js'


# Helpers

compile = (entry, target, minTarget) ->
  run "#{BROWSERIFY} #{entry} > #{target}", ->
    writeFileSync minTarget, UglifyJS.minify(target, OPTS).code

run = (args...) ->
  for a in args
    switch typeof a
      when 'string' then command = a
      when 'object'
        if a instanceof Array then params = a
        else options = a
      when 'function' then callback = a

  command += ' ' + params.join ' ' if params?
  cmd = spawn '/bin/sh', ['-c', command], options

  cmd.stdout.on 'data', (data) -> process.stdout.write data
  cmd.stderr.on 'data', (data) -> process.stderr.write data
  process.on    'SIGHUP',      -> cmd.kill()
  cmd.on        'exit', (code) -> callback() if callback? and code is 0
