#!/usr/bin/env node
// adapted from notluksus

//IMPORTS
// import dotenv from 'dotenv';
// dotenv.config();
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import inquirer from 'inquirer';
import fs from 'fs';
// const fsPromises = fs.promises;
import minimist from 'minimist';
const argv = minimist(process.argv.slice(2));
import mergeImages from 'merge-images';
import canvas from 'canvas';
const { Image, Canvas } = canvas;
import ImageDataURI from 'image-data-uri';
import { mintAttributes } from './mintAttributes.js';
import { traitRarity } from '../traitRarity.config.js';

//SETTINGS
let basePath;
let outputPath;
let traits;
let traitsToSort = [];
let order = [];
let weights = {};
let names = {};
let metaData = {};
let config = {
  metaData: {},
  useCustomNames: null,
  generateMetadata: null,
};
let mintNow;
let totalIssuance;
let existingMints = [];
let newMints = [];
let weightedTraits = {};
let traitFilenames = {};
let rarityChanged = false;
let rarityFromPct = {};


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
    chalk.blue(' Inspired by an idea\n from NotLuksus'),
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
  rarityFromPct = reverseMap(traitRarity)
  let realisticCombinations = (estimateCombinations(weightedTraits) * 0.65).toPrecision(2)

  await totalIssuancePrompt(realisticCombinations);

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
  } else if (existingMints.length > 0 && rarityChanged) {
    console.log(`Warning - Probabilities have changed but some mints already exist`)
    console.log(`You may violate issuance limits - consider before going on`)
  }
  let lastMintedID = existingMints.length

  if (!argv['mint'] || parseInt(argv['mint']) > config.totalIssuance) {
    await mintNowPrompt(config.totalIssuance - existingMints.length, realisticCombinations - existingMints.length);
  }
  var [minArray, maxArray, currentArray] = generateMinMaxArrays(weightedTraits, config.totalIssuance);
  currentArray = updateCurrentArray(currentArray, existingMints);
  // generate new mint serial numbers***
  [newMints, currentArray, existingMints] = mintAttributes(mintNow, config.totalIssuance, minArray, maxArray, currentArray, existingMints)
  await writeExistingMints();

  // for the new mints ONLY - generate the images and metadata below
  const generatingImages = ora('Generating images');
  generatingImages.color = 'yellow';
  generatingImages.start();
  await generateImages(newMints, lastMintedID);
  await sleep(2);
  generatingImages.succeed('All images generated!');
  generatingImages.clear();
  if (config.generateMetadata) {
    const writingMetadata = ora('Exporting metadata');
    writingMetadata.color = 'yellow';
    writingMetadata.start();
    await writeMetadata();
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
    config.names = { ...config.names, ...names };
  } else {
    const files = fs.readdirSync(basePath + '/' + trait);
    files.forEach((file, i) => {
      names[file] = file.split('.')[0];
    });
  }
}

//SET WEIGHTS FOR EVERY TRAIT
async function setWeights(trait) {
  if (config.weights && Object.keys(config.weights).length === Object.keys(names).length) {
    weights = config.weights;
    weightedTraits = config.weightedTraits
    traitFilenames = config.traitFilenames;
    return;
  }
  rarityChanged = true;
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
  let totalProbability = 0;
  var fileArray = [];
  files.forEach((file, i) => {
    weights[file] = selectedWeights[names[file] + '_weight'];
    totalProbability += weights[file];
    fileArray.push(file);
  });

  if (totalProbability === 0) {
    var traitArray = new Array(files.length).fill(100);
  } else {
    var traitArray = new Array(files.length).fill(0);
    for (let j = 0; j < files.length; j++) {
      traitArray[j] = Math.floor(100 * weights[files[j]] / totalProbability);
    }
  }
  weightedTraits[trait] = traitArray;
  traitFilenames[trait] = fileArray;
  config.weights = weights;
  config.weightedTraits = weightedTraits;
  config.traitFilenames = traitFilenames;
}

//ASYNC FOREACH
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}


async function totalIssuancePrompt(thisRealisticMints) {
  if (config.totalIssuance && Object.keys(config.totalIssuance).length !== 0) return;
  let responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'totalIssuance',
      message: 'What is the maximum to be minted ever? (Keep below ' + Number(thisRealisticMints) + ' to minimise duplicates)',
      default: Number(thisRealisticMints)
    }
  ]);
  totalIssuance = responses.totalIssuance;
  config.totalIssuance = totalIssuance;
}

async function mintNowPrompt(maxLeft, thisRealisticMintsLeft) {
  let responses = await inquirer.prompt([
    {
      type: 'input',
      name: 'mintNow',
      message: 'How many would you like to mint right now? (max: ' + Number(maxLeft) + ', recommended: ' + Number(thisRealisticMintsLeft) + ')',
      default: Number(thisRealisticMintsLeft),
    }
  ]);
  mintNow = responses.mintNow
}

async function getExistingMints() {
  try {
    existingMints = await fs.readFileSync('identifierList.txt', 'utf-8').split(`\n`);
    if (existingMints.length === 1 && existingMints[0] === "") {
      // console.log(`empty file`)
      existingMints = [];
    }
    if (existingMints[existingMints.length - 1] === "") { existingMints.pop() }
    // just in case there's a blank line at the end
  }
  catch (err) {
    // console.log(`no file exists`)
    existingMints = [];
  }
}

async function writeExistingMints() {
  var writeStream = fs.createWriteStream(`identifierList.txt`, { flags: 'w' });
  // write from scratch each time
  for (let i = 0; i < existingMints.length; i++) {
    if (existingMints[i] !== "") {
      writeStream.write(existingMints[i] + '\n');
    }
  }
}

function generateMinMaxArrays(baseArray, maxIssuance) {
  let thisMinArray = [];
  let thisMaxArray = [];
  let thisCurrentArray = [];
  Object.keys(baseArray).forEach((key, i) => {
    thisMinArray[i] = []
    thisMaxArray[i] = []
    thisCurrentArray[i] = []
    for (let j = 0; j < baseArray[key].length; j++) {
      let expectedMints = maxIssuance * baseArray[key][j] / 100
      if (expectedMints === 0) {
        // unique mints
        thisMinArray[i].push(1);
        thisMaxArray[i].push(1);
      } else {
        thisMinArray[i].push(parseInt(expectedMints * (1 - 0.025)));
        thisMaxArray[i].push(parseInt(expectedMints * (1 + 0.075)));
      }
      thisCurrentArray[i].push(0);
    };
  });
  return [thisMinArray, thisMaxArray, thisCurrentArray]
}

function updateCurrentArray(thisCurrentArray, thisExistingMints) {
  let expectedDigits = thisCurrentArray.length * 2 + 1
  for (let i = 0; i < thisExistingMints.length; i++) {
    let thisSerialNumber = thisExistingMints[i];
    if (thisSerialNumber.length != expectedDigits || thisSerialNumber.substring(0, 1) != "7") {
      console.log(`Bad serial number at entry ${i}, either doesn't lead with 7 or isn't the right length: ${thisSerialNumber}`)
    } else {
      for (let j = 0; j < Math.floor(thisSerialNumber.length / 2); j++) {
        // the variable j has two digits at j*2 + 1 and j*2 + 3
        // the two digits make up a number k
        // add 1 to the thisCurrentArray[j][k]
        let k = parseInt(thisSerialNumber.substring((2 * j + 1), (2 * j + 3)))
        thisCurrentArray[j][k]++
      }
    }
  }
  return thisCurrentArray
}

function decodeSerialNumber(thisSerialNumber) {
  let thisAttributes = [];
  for (let j = 0; j < Math.floor(thisSerialNumber.length / 2); j++) {
    thisAttributes.push(parseInt(thisSerialNumber.substring((2 * j + 1), (2 * j + 3))))
  }
  return thisAttributes
}

//GENARATE IMAGES
async function generateImages(newImagesToMint, lastID) {
  let images = [];
  let theseAttributes = [];
  let nftID = lastID + 1; // start at NFT ID 1 

  for (let i = 0; i < newImagesToMint.length; i++) {
    theseAttributes = decodeSerialNumber(newImagesToMint[i]);
    order.forEach(id => {
      images.push(basePath + traits[id] + '/' + traitFilenames[traits[id]][theseAttributes[id]])
    });
    generateMetadataObject(nftID, images);
    const b64 = await mergeImages(images, { Canvas: Canvas, Image: Image });
    await ImageDataURI.outputFile(b64, outputPath + `${nftID}.png`);
    images = [];
    nftID++;
  }
}

function reverseMap(thisTraitRarity) {
  let remappedObj = {};
  Object.keys(thisTraitRarity).forEach(key => {
    remappedObj[thisTraitRarity[key].toString()] = key;
  });
  return remappedObj
}


function generateMetadataObject(id, images) {
  metaData[id] = {
    name: config.metaData.name + '#' + id,
    description: config.metaData.description,
    image: config.imageUrl + id + '.json',
    attributes: [],
  };
  images.forEach((image, i) => {
    let pathArray = image.split('/');
    let fileToMap = pathArray[pathArray.length - 1];
    metaData[id].attributes.push({
      trait_type: traits[order[i]],
      value: names[fileToMap],
      rarity: rarityFromPct[weights[fileToMap].toString()]
    });
  });
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

async function writeConfig() {
  await fs.promises.writeFile('config.json', JSON.stringify(config, null, 2));
}

async function getFilesForTrait(trait) {
  return (await fs.promises.readdir(basePath + '/' + trait)).filter(file => file !== '.DS_Store');
}

function estimateCombinations(thisTraitWeights) {
  let combos = 1;
  Object.keys(thisTraitWeights).forEach(key => {
    let percentHurdle = Math.floor(49 / thisTraitWeights[key].length);
    let realVariables = 0;
    let residuals = 0;
    for (let i = 0; i < thisTraitWeights[key].length; i++) {
      if (thisTraitWeights[key][i] < percentHurdle) {
        residuals += thisTraitWeights[key][i];
        if (residuals >= percentHurdle) {
          realVariables++;
          residuals = 0;
        }
      } else {
        realVariables++;
      }
    }
    combos *= realVariables;
  })
  return combos
}