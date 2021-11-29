// #!/usr/bin/env node
// adapted from notluksus

//IMPORTS
import dotenv from 'dotenv';
dotenv.config();
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';
const fsPromises = fs.promises;
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));
// import { readFile, writeFile, readdir } from ("fs").promises;
// const mergeImages = require('merge-images');
// const { Image, Canvas } = require('canvas');
// const ImageDataURI = require('image-data-uri');
import {mintAttributes} from './mintAttributes.js';
import {traitRarity} from './traitRarity.config.js';
import exp from 'constants';

//SETTINGS
let basePath;
let outputPath;
let traits;
let traitsToSort = [];
let order = []; 
let weights = {};
let names = {};
// let seen = [];
let metaData = {};
let config = {
  metaData: {},
  useCustomNames: null,
  generateMetadata: null,
};
let mintNow;
let totalIssuance;
let alreadMinted;
let existingMints = [];
let newMints = [];
let weightedTraits = {};


//DEFINITIONS
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
      ' ******************* \n' +
      ' NFT Image Generator \n' +
      ' ******************* \n' +
      ' Adapted by '
    ) +
      chalk.red('DrKazza \n\n') +
      chalk.blue(' - extended from an\n  idea by NotLuksus'),
    { borderColor: 'red', padding: 2 }
  )
);
main();



async function main() {
  await loadConfig();
  await getBasePath();
  await getOutputPath();
  await generateMetadataPrompt();
  if (config.generateMetadata) {
    await metadataSettings();
  }
  const loadingDirectories = ora('Loading traits');
  loadingDirectories.color = 'yellow';
  loadingDirectories.start();
  traits = getDirectories(basePath);
  traitsToSort = [...traits];
  await sleep(2);
  loadingDirectories.succeed();
  loadingDirectories.clear();
  await traitsOrder(true);
  await customNamesPrompt();
  await asyncForEach(traits, async trait => {
    await setNames(trait);
  });
  await asyncForEach(traits, async trait => {
    await setWeights(trait);
  });

  await totalIssuancePrompt();

  const loadingExistingMints = ora('Checking for existing mints');
  loadingExistingMints.color = 'yellow';
  loadingExistingMints.start();
  await getExistingMints();
  await sleep(2);
  loadingExistingMints.succeed();
  loadingExistingMints.clear();
  if (existingMints.length > totalIssuance) {
    console.log(`Existing NFT collection: ${existingMints.length}, is larger than the total issuance: ${totalIssuance}`)
    return
  } else if (existingMints.length === totalIssuance) {
    console.log(`All NFTs have been already minted.`)
    return
  }
  
  if (!argv['mint'] || parseInt(argv['mint']) > config.totalIssuance){
    await mintNowPrompt(config.totalIssuance - existingMints.length);
  }

  // generate arrays for min/max & currents
  var [minArray, maxArray, currentArray] = generateMinMaxArrays(weightedTraits, config.totalIssuance)
  // populate currentArray with current numbers
  currentArray = updateCurrentArray(currentArray, existingMints)

  // generate new mint serial numbers***
  // get rid of the golden trait stuff

  // remember to add each serial number to the currents
  // save serial numbers of all mints (including new ones)
  
  // for the new mints ONLY - generate the images and metadata below



  const generatingImages = ora('Generating images');
  generatingImages.color = 'yellow';
  generatingImages.start();
  // this needs totally rebuilding
  // await generateImages();
  await sleep(2);
  generatingImages.succeed('All images generated!');
  generatingImages.clear();
  if (config.generateMetadata) {
    const writingMetadata = ora('Exporting metadata');
    writingMetadata.color = 'yellow';
    writingMetadata.start();
    // totally rebuild this
    // await writeMetadata();
    await sleep(0.5);
    writingMetadata.succeed('Exported metadata successfully');
    writingMetadata.clear();
  }
  if (argv['save-config']) {
    const writingConfig = ora('Saving configuration');
    writingConfig.color = 'yellow';
    writingConfig.start();
    await writeConfig();
    await sleep(0.5);
    writingConfig.succeed('Saved configuration successfully');
    writingConfig.clear();
  }
}

//GET THE BASEPATH FOR THE IMAGES
async function getBasePath() {
  if (config.basePath !== undefined) { 
    basePath = config.basePath;
    return;
  }
  const { base_path } = await inquirer.prompt([
    {
      type: 'list',
      name: 'base_path',
      message: 'Where are your images located?',
      choices: [
        { name: 'In the current directory', value: 0 },
        { name: 'Somewhere else on my computer', value: 1 },
      ],
    },
  ]);
  if (base_path === 0) {
    basePath = process.cwd() + '/';
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
  config.basePath = basePath;
}

//GET THE OUTPUTPATH FOR THE IMAGES
async function getOutputPath() {
  if (config.outputPath !== undefined) {
    outputPath = config.outputPath
    return;
  }
  const { output_path } = await inquirer.prompt([
    {
      type: 'list',
      name: 'output_path',
      message: 'Where should the generated images be exported?',
      choices: [
        { name: 'In the current directory', value: 0 },
        { name: 'Somewhere else on my computer', value: 1 },
      ],
    },
  ]);
  if (output_path === 0) {
    outputPath = process.cwd() + '/output/';
  } else {
    const { file_location } = await inquirer.prompt([
      {
        type: 'input',
        name: 'file_location',
        message:
          'Enter the path to your output directory (Absolute filepath)',
      },
    ]);
    let lastChar = file_location.slice(-1);
    if (lastChar === '/') outputPath = file_location;
    else outputPath = file_location + '/';
  }
  config.outputPath = outputPath;
}

async function generateMetadataPrompt() {
  if (config.generateMetadata !== null) return;
  let { createMetadata } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'createMetadata',
      message: 'Should individual metadata be generated?',
    },
  ]);
  config.generateMetadata = createMetadata;
}

async function metadataSettings() {
  if (Object.keys(config.metaData).length !== 0) return;
  let responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'metadataName',
      message: 'What should be the name? (Generated format is NAME#ID)',
    },
    {
      type: 'input',
      name: 'metadataDescription',
      message: 'What should be the description?',
    },
    {
      type: 'input',
      name: 'metadataImageUrl',
      message: 'What should be the image url? (Generated format is URL/ID.json)',
      default: 'https://ipfs.io/ipfs/xxxx/',
    }
  ]);
  config.metaData.name = responses.metadataName;
  config.metaData.description = responses.metadataDescription;
  // config.metaData.splitFiles = responses.splitFiles;
  let lastChar = responses.metadataImageUrl.slice(-1);
  if (lastChar === '/') config.imageUrl = responses.metadataImageUrl;
  else config.imageUrl = responses.metadataImageUrl + '/';
}

//SELECT THE ORDER IN WHICH THE TRAITS SHOULD BE COMPOSITED
async function traitsOrder(isFirst) {
  if (config.order && config.order.length === traits.length) {
    order = config.order;
    return;
  }
  const traitsPrompt = {
    type: 'list',
    name: 'selected',
    choices: [],
  };
  traitsPrompt.message = 'Which trait should be on top of that?';
  if (isFirst === true) traitsPrompt.message = 'Which trait is the background?';
  traitsToSort.forEach(trait => {
    const globalIndex = traits.indexOf(trait);
    traitsPrompt.choices.push({
      name: trait.toUpperCase(),
      value: globalIndex,
    });
  });
  const { selected } = await inquirer.prompt(traitsPrompt);
  order.push(selected);
  config.order = order;
  let localIndex = traitsToSort.indexOf(traits[selected]);
  traitsToSort.splice(localIndex, 1);
  if (order.length === traits.length) return;
  await traitsOrder(false);
}

//SELECT IF WE WANT TO SET CUSTOM NAMES FOR EVERY TRAITS OR USE FILENAMES
async function customNamesPrompt() {
    if (config.useCustomNames !== null) return;
    let { useCustomNames } = await inquirer.prompt([
      {
        type: 'list',
        name: 'useCustomNames',
        message: 'How should be constructed the names of the traits?',
        choices: [
          { name: 'Use filenames as traits names', value: 0 },
          { name: 'Choose custom names for each trait', value: 1 },
        ],
      },
    ]);
    config.useCustomNames = useCustomNames;
}

//SET NAMES FOR EVERY TRAIT
async function setNames(trait) {
  if (config.useCustomNames) {
    names = config.names || names;
    const files = await getFilesForTrait(trait);
    const namePrompt = [];
    files.forEach((file, i) => {
      if (config.names && config.names[file] !== undefined) return;
      namePrompt.push({
        type: 'input',
        name: trait + '_name_' + i,
        message: 'What should be the name of the trait shown in ' + file + '?',
      });
    });
    const selectedNames = await inquirer.prompt(namePrompt);
    files.forEach((file, i) => {
      if (config.names && config.names[file] !== undefined) return;
      names[file] = selectedNames[trait + '_name_' + i];
    });
    config.names = {...config.names, ...names};
  } else {
    const files = fs.readdirSync(basePath + '/' + trait);
    files.forEach((file, i) => {
      names[file] = file.split('.')[0];
    });
  }
}

//SET WEIGHTS FOR EVERY TRAIT
async function setWeights(trait) {
  if (config.weights && Object.keys(config.weights).length === Object.keys(names).length ) {
    weights = config.weights;
    weightedTraits = config.weightedTraits
    return;
  }  
  const files = await getFilesForTrait(trait);
  const rarityPrompt = [];
  Object.keys(traitRarity).forEach(key => {
    rarityPrompt.push({
      name: key, value: traitRarity[key]
    })
  });
  const weightPrompt = [];
  files.forEach((file, i) => {
    weightPrompt.push({
      type: 'list',
      name: names[file] + '_weight',
      message: 'What rarity should ' + names[file] + ' ' + trait + ' be?',
      choices: rarityPrompt,
    });
  });
  const selectedWeights = await inquirer.prompt(weightPrompt);
  let totalProbability = 0
  files.forEach((file, i) => {
    weights[file] = selectedWeights[names[file] + '_weight'];
    totalProbability += weights[file]
  });

  if (totalProbability === 0) {
    var traitArray = new Array(files.length).fill(100);
  } else {
    var traitArray = new Array(files.length).fill(0);
    for (let j = 0; j < files.length; j++) {
      traitArray[j] = Math.floor(100 * weights[files[j]] / totalProbability);
    }
  }
  weightedTraits[trait] = traitArray
  config.weights = weights;
  config.weightedTraits = weightedTraits
}

//ASYNC FOREACH
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}


async function totalIssuancePrompt() {
  if (config.totalIssuance && Object.keys(config.totalIssuance).length !== 0) return;
  let responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'totalIssuance',
      message: 'What is the maximum to be minted ever?',
    }
  ]);
  totalIssuance = responses.totalIssuance;
  config.totalIssuance = totalIssuance;
}

async function mintNowPrompt(maxLeft) {
  let responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'mintNow',
      message: 'How many would you like to mint right now? (max: ' + maxLeft + ')',
      default: maxLeft,
    }
  ]);
  mintNow = responses.mintNow
}

async function getExistingMints () {
  try {
    existingMints = await fs.readFileSync('identifierList.txt', 'utf-8').split(`\n`);
    if (existingMints.length === 1 && existingMints[0] === "") {
        // console.log(`empty file`)
        existingMints = [];
    }
    if (existingMints[existingMints.length-1] === "") {existingMints.pop()}
    // just in case there's a blank line at the end
  }
  catch(err) {
    // console.log(`no file exists`)
    existingMints = [];
  }
}

async function writeExistingMints () {
  var writeStream = fs.createWriteStream(`identifierList.txt`, {flags: 'w'});
  // write from scratch each time
  for (let i = 0; i < existingMints.length; i++)
  {
    if(existingMints[i] !== "") {
      writeStream.write(existingMints[i]+'\n');
    }  
  }
}

function generateMinMaxArrays(baseArray, maxIssuance) {
  let thisMinArray = {}
  let thisMaxArray = {}
  let thisCurrentArray = {}
  Object.keys(baseArray).forEach(key => {
    thisMinArray[key] = []
    thisMaxArray[key] = []
    thisCurrentArray[key] = []
    for (let i = 0; i < baseArray[key].length; i++){
      let expectedMints = maxIssuance * baseArray[key][i] / 100
      if (expectedMints === 0) {
        // unique mints
        thisMinArray[key].push(1);
        thisMaxArray[key].push(1);
      } else {        
        thisMinArray[key].push(parseInt(expectedMints * (1 - 0.025)));
        thisMaxArray[key].push(parseInt(expectedMints * (1 + 0.025)));  
      }
      thisCurrentArray[key].push(0);
    };
  });
  return [thisMinArray, thisMaxArray, thisCurrentArray]
}

function updateCurrentArray(thisCurrentArray, thisExistingMints) {
  for (let i = 0; i < thisExistingMints.length; i++) {
    let thisSerialNumber = thisExistingMints[i];
    // the first digit is 7 ignore that
    if (thisSerialNumber.length != 21 || thisSerialNumber.substring(0,1) != "7") {
        console.log(`Bad serial number at entry ${i}, either doesn't lead with 7 or isn't 21 digits long: ${thisSerialNumber}`)
    } else {
      for (let j = 0; j < Math.floor(thisSerialNumber.length / 2); j++) {
        // the variable j has two digits at j*2 + 1 and j*2 + 3
        // the two digits make up a number k
        // add 1 to the thisCurrentArray[j][k]
        let k = parseInt(thisSerialNumber.substring((2*j+1),(2*j+3)))
        thisCurrentArray[j][k]++
      }
    }
  }
  return thisCurrentArray
}





//GENERATE WEIGHTED TRAITS
async function generateWeightedTraits() {
  for (const trait of traits) {
    const traitWeights = [];
    const files = await getFilesForTrait(trait);
    files.forEach(file => {
      for (let i = 0; i < weights[file]; i++) {
        traitWeights.push(file);
      }
    });
    weightedTraits.push(traitWeights);
  }
}

//GENARATE IMAGES
async function generateImages() {
  let noMoreMatches = 0;
  let images = [];
  let id = 0;
  await generateWeightedTraits();

  while (!Object.values(weightedTraits).filter(arr => arr.length == 0).length && noMoreMatches < 20000) {
    let picked = [];
    order.forEach(id => {
      let pickedImgId = pickRandom(weightedTraits[id]);
      picked.push(pickedImgId);
      let pickedImg = weightedTraits[id][pickedImgId];
      images.push(basePath + traits[id] + '/' + pickedImg);
    });

    if (existCombination(images)) {
      noMoreMatches++;
      images = [];
    } else {
      generateMetadataObject(id, images);
      noMoreMatches = 0;
      order.forEach((id, i) => {
        remove(weightedTraits[id], picked[i]);
      });
      seen.push(images);
      const b64 = await mergeImages(images, { Canvas: Canvas, Image: Image });
      await ImageDataURI.outputFile(b64, outputPath + `${id}.png`);
      images = [];
      id++;
    }
  }
}

//GENERATES RANDOM NUMBER BETWEEN A MAX AND A MIN VALUE
function randomNumber(min, max) {
  return Math.round(Math.random() * (max - min) + min);
}

//PICKS A RANDOM INDEX INSIDE AN ARRAY RETURNS IT AND THEN REMOVES IT
function pickRandomAndRemove(array) {
  const toPick = randomNumber(0, array.length - 1);
  const pick = array[toPick];
  array.splice(toPick, 1);
  return pick;
}

//PICKS A RANDOM INDEX INSIDE AND ARRAY RETURNS IT
function pickRandom(array) {
  return randomNumber(0, array.length - 1);
}

function remove(array, toPick) {
  array.splice(toPick, 1);
}

function existCombination(contains) {
  let exists = false;
  seen.forEach(array => {
    let isEqual =
      array.length === contains.length &&
      array.every((value, index) => value === contains[index]);
    if (isEqual) exists = true;
  });
  return exists;
}

function generateMetadataObject(id, images) {
  metaData[id] = {
    name: config.metaData.name + '#' + id,
    description: config.metaData.description,
    image: config.imageUrl + id,
    attributes: [],
  };
  images.forEach((image, i) => {
    let pathArray = image.split('/');
    let fileToMap = pathArray[pathArray.length - 1];
    metaData[id].attributes.push({
      trait_type: traits[order[i]],
      value: names[fileToMap],
    });
  });
}

async function writeMetadata() {
  let metadata_output_dir = outputPath + "metadata/"
  if (!fs.existsSync(metadata_output_dir)) {
    fs.mkdirSync(metadata_output_dir, { recursive: true });
  }
  for (var key in metaData){
    await fs.promises.writeFile(metadata_output_dir + key + '.json', JSON.stringify(metaData[key]));
  }
}

async function loadConfig() {
  try {
    const data = await fs.promises.readFile('config.json')
    config = JSON.parse(data.toString());
  } catch (error) {}
}

async function writeConfig() {
  await fs.promises.writeFile('config.json', JSON.stringify(config, null, 2));
}

async function getFilesForTrait(trait) {
  return (await fs.promises.readdir(basePath + '/' + trait)).filter(file => file !== '.DS_Store');
}
