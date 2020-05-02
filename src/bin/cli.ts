#!/usr/bin/env node

require('source-map-support').install()

import _yargs = require('yargs')

_yargs.usage('Usage: $0 <command> [options]')
    .commandDir('../commands')
    .demandCommand()
    .help()
    .argv
