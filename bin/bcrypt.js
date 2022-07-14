#!/usr/bin/env node

const bcrypt = require('bcrypt');
const saltRounds = 10;

const stdout = process.stdout
const stdin = process.stdin
const argv = process.argv;

const checkHash = argv.length > 2 ? argv[2] : undefined;

let password = '';

stdin.on('readable', () => {
    let chunk;
    while ((chunk = stdin.read()) !== null) {
        password += chunk;
    }
});

process.stdin.on('end', () => {
    if (password[password.length - 1] === '\n') {
        password = password.substring(0, password.length - 1);
    }

    if (checkHash !== undefined) {
        const validPassword = bcrypt.compareSync(password, checkHash);
        stdout.write(`${validPassword ? 'Valid password' : 'Invalid password'}\n`);
        process.exit(validPassword ? 0 : 255);
    } else {
        const hash = bcrypt.hashSync(password, saltRounds);
        stdout.write(`${hash}\n`);
    }
});
