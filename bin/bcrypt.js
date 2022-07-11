#!/usr/bin/env node

const bcrypt = require('bcrypt');
const saltRounds = 10;

const stdout = process.stdout
const stdin = process.stdin

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
    const hash = bcrypt.hashSync(password, saltRounds);
    stdout.write(`${hash}\n`);
});
