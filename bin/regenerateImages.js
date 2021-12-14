#!/usr/bin/env node

//IMPORTS
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';
import { exit } from 'process';
import mergeImages from 'merge-images';
import canvas from 'canvas';
const { Image, Canvas } = canvas;
import ImageDataURI from 'image-data-uri';
import { traitRarity } from '../traitRarity.config.js';


//SETTINGS
let basePath;
let existingMints = [];
let config;
let keepNumbering;
let outputPath;
let generateMetadata;
let minRebuild;
let maxRebuild;
let traits;
let rarityFromPct = {};
let metaData = {};


const getDirectories = source =>
    fs
        .readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

const sleep = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000))

//OPENING
console.log(
    boxen(
        chalk.blue(
            ' ****************** \n' +
            ' Image Regeneration \n' +
            ' ****************** \n' +
            ' created by '
        ) +
        chalk.red('DrKazza'),
        { borderColor: 'blue', padding: 2 }
    )
);
main();



async function main() {


    // check config exists exit if not found
    await loadConfig();
    if (config == undefined) {
        console.log(`No config file found - this is needed to work out the layering order of the images,\ntry running the 'image-generate --save-config' function and minting 0 nfts\nor use the right base path where the config.json file is saved.`);
        exit(0);
    }
    // ask for path for images (default images/)
    await getBasePath();

    // check for identifierList.txt
    await loadIdentifierList();
    if (existingMints == []) {
        console.log(`No identifierList file found - make sure this is located in the same path as your config.json file.`);
        exit(0);
    }
    // read the max and min numbers to rebuild
    minRebuild = 1;
    maxRebuild = existingMints.length

    // keep numbering (default Y)
    // save to? (default newOutput)
    // regenerate metadata
    await outputPrompts();

    // now go from min to max and rebuild the images and metadata
    // where appropriate
    const generatingImages = ora('Generating Images');
    generatingImages.color = 'yellow';
    generatingImages.start();
    traits = await getDirectories(basePath);
    rarityFromPct = reverseMap(traitRarity)
    await generateImages();
    await sleep(2);
    generatingImages.succeed(`${maxRebuild - minRebuild + 1} images regenerated!`);
    generatingImages.clear();
    if (generateMetadata) {
        const writingMetadata = ora('Exporting metadata');
        writingMetadata.color = 'yellow';
        writingMetadata.start();
        await writeMetadata();
        await sleep(0.5);
        writingMetadata.succeed('Exported metadata successfully');
        writingMetadata.clear();
    }
}




async function generateImages() {
    let images = [];
    let theseAttributes = [];
    let nftID = 1;
    if (keepNumbering) {
        nftID = minRebuild
    }

    for (let i = minRebuild; i <= maxRebuild; i++) {
        theseAttributes = decodeSerialNumber(existingMints[i - 1]);
        config.order.forEach(id => {
            images.push(basePath + traits[id] + '/' + config.traitFilenames[traits[id]][theseAttributes[id]])
        });
        generateMetadataObject(nftID, images);
        const b64 = await mergeImages(images, { Canvas: Canvas, Image: Image });
        let image_output_dir = outputPath + "images/"
        if (!fs.existsSync(image_output_dir)) {
            fs.mkdirSync(image_output_dir, { recursive: true });
        }
        await ImageDataURI.outputFile(b64, image_output_dir + `${nftID}.png`);
        images = [];
        nftID++;
    }
}

function decodeSerialNumber(thisSerialNumber) {
    let thisAttributes = [];
    for (let j = 0; j < Math.floor(thisSerialNumber.length / 2); j++) {
        thisAttributes.push(parseInt(thisSerialNumber.substring((2 * j + 1), (2 * j + 3))))
    }
    return thisAttributes
}

function generateMetadataObject(id, images) {
    metaData[id] = {
        name: config.metaData.name + '#' + id,
        description: config.metaData.description,
        image: config.imageUrl + id + '.png',
        attributes: [],
    };
    images.forEach((image, i) => {
        let pathArray = image.split('/');
        let fileToMap = pathArray[pathArray.length - 1];
        let weightsFile = pathArray[pathArray.length - 2] + "/" + fileToMap
        let filename = fileToMap.split('.')
        let valuename = filename[0]
        if (config.names !== undefined) {
            valuename = config.names[weightsFile]
        }
        metaData[id].attributes.push({
            trait_type: traits[config.order[i]],
            value: valuename,
            rarity: rarityFromPct[config.weights[weightsFile].toString()]
        });
    });
}

function reverseMap(thisTraitRarity) {
    let remappedObj = {};
    Object.keys(thisTraitRarity).forEach(key => {
        remappedObj[thisTraitRarity[key].toString()] = key;
    });
    return remappedObj
}

async function writeMetadata() {
    let metadata_output_dir = outputPath + "metadata/"
    if (!fs.existsSync(metadata_output_dir)) {
      fs.mkdirSync(metadata_output_dir, { recursive: true });
    }
    for (var key in metaData) {
      await fs.promises.writeFile(metadata_output_dir + key + '.json', JSON.stringify(metaData[key]));
    }
  }



async function loadConfig() {
    try {
        const data = await fs.promises.readFile('config.json')
        config = JSON.parse(data.toString());
    } catch (error) { }
}

async function loadIdentifierList() {
    try {
        existingMints = await fs.readFileSync('identifierList.txt', 'utf-8').split(`\n`);
        if (existingMints.length === 1 && existingMints[0] === "") {
            existingMints = [];
        }
        if (existingMints[existingMints.length - 1] === "") { existingMints.pop() }
        // just in case there's a blank line at the end
    }
    catch (err) {
        existingMints = [];
    }
}


async function getBasePath() {
    const { base_path } = await inquirer.prompt([
        {
            type: 'list',
            name: 'base_path',
            message: 'Where are the image files located?',
            choices: [
                { name: 'current-directory/images/', value: 0 },
                { name: 'Somewhere else on my computer', value: 1 },
            ],
        },
    ]);
    if (base_path === 0) {
        basePath = process.cwd() + '/images/';
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

async function outputPrompts() {
    let response_min = await inquirer.prompt([
        {
            type: 'input',
            name: 'minRebuild',
            message: `Rebuild from which NFT number (${minRebuild} - ${maxRebuild})?`,
            default: minRebuild
        }
    ])
    let response_max = await inquirer.prompt([
        {
            type: 'input',
            name: 'maxRebuild',
            message: `Finish at which NFT number? (${response_min.minRebuild} - ${maxRebuild})`,
            default: maxRebuild
        }
    ])
    let responses = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'keepNumbering',
            message: 'Should the NFT numbering be retained? (no - will start again from 1)',
        },
        {
            type: 'input',
            name: 'output_path',
            message: 'Where should the images be saved?',
            default: process.cwd() + '/newOutput/'
        },
        {
            type: 'confirm',
            name: 'generateMetadata',
            message: 'Regenerate Metadata as well?',
        }
    ]);
    minRebuild = Number(response_min.minRebuild)
    maxRebuild = Number(response_max.maxRebuild)
    keepNumbering = responses.keepNumbering;
    outputPath = responses.output_path;
    generateMetadata = responses.generateMetadata;
}
