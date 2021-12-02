#!/usr/bin/env node

//IMPORTS
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';


//SETTINGS
let basePath;
let stringOut;
let stringIn;
let replacedFile = 0;

const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000))

//OPENING
console.log(
    boxen(
        chalk.blue(
            ' ****************** \n' +
            ' JSON URL Remapper \n' +
            ' ****************** \n' +
            ' created by '
        ) +
        chalk.red('DrKazza'),
        { borderColor: 'blue', padding: 2 }
    )
);
main();



async function main() {
    await getBasePath();
    await stringReplacePrompts();
    const changingFiles = ora('changing files');
    changingFiles.color = 'yellow';
    changingFiles.start();
    var [found, changed] = await changeString();
    await sleep(2);
    changingFiles.succeed();
    changingFiles.clear();
    console.log(`Found ${found.toString()} files in ${basePath}`)
    console.log(`Changed text in ${replacedFile.toString()} files.`)

}

async function changeString() {
    let fileList = await getJsonFiles();
    for (let i = 0; i < fileList.length; i++) {
        fs.readFile(basePath + fileList[i], 'utf8', function (err, data) {
            if (err) {
                return console.log(err);
            }
            if (data.includes(stringOut)) {
                replacedFile++
                var result = data.replace(stringOut, stringIn);
                fs.writeFile(basePath + fileList[i], result, 'utf8', function (err) {
                    if (err) {
                        return console.log(err);
                    }
                })
            }
        });
    }
    return [fileList.length]
}

async function getBasePath() {
    const { base_path } = await inquirer.prompt([
        {
            type: 'list',
            name: 'base_path',
            message: 'Where are the metadata files located?',
            choices: [
                { name: 'current-directory/output/metadata/', value: 0 },
                { name: 'Somewhere else on my computer', value: 1 },
            ],
        },
    ]);
    if (base_path === 0) {
        basePath = process.cwd() + '/output/metadata/';
    } else {
        const { file_location } = await inquirer.prompt([
            {
                type: 'input',
                name: 'file_location',
                message: 'Enter the path to your image files (Absolute filepath)',
            },
        ]);
        let lastChar = file_location.slice(-1);
        if (lastChar === '/') basePath = file_location;
        else basePath = file_location + '/';
    }
}

async function stringReplacePrompts() {
    let responses = await inquirer.prompt([
        {
            type: 'input',
            name: 'stringOut',
            message: 'What is the string to replace?',
            default: '/ipfs/xxxx/'
        },
        {
            type: 'input',
            name: 'stringIn',
            message: 'What is the string to insert?',
        },
    ]);
    stringOut = responses.stringOut;
    stringIn = responses.stringIn;
}

async function getJsonFiles() {
    return (await fs.promises.readdir(basePath)).filter(file => file.split('.')[1] === 'json');
}