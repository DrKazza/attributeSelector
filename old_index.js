/*
Things to add
1) Define the minimum and maximum issuance of each attribute
2) Keep track of current issued attribute
3) bearing in mind the balance to be issued work out a random selector function to choose an attribute
4) check that this selection of attributes hasn't been previously allocated
- if it has go back to 3
- if it hasn't go to 5
5) Update the issued attribute balance
6) save the number associated with that attribute
*/

const fs = require('fs');
const os = require('os');


const arrayTotal = (arr) => {
    try {
        let sum = 0;
        for (let i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum    
    }
    catch (err) {
        console.log(`Array Total Error ${err}`);
    }
}

const arrayFloorSubtract = (arr1, arr2) => {
    try {
        if (arr1.length != arr2.length) throw "arrays are different lengths"
        let x = [];
        for(let i = 0; i < arr1.length; i++){
            x.push(Math.max(arr1[i] - arr2[i], 0));
        }
        return x
    }
    catch (err) {
        console.log(`Array Subtract error: ${err}`)
    }
}

const arrayMaxMint = (maxToMint, currentMinted, minToMint, excessMints) => {
    try {
        if (maxToMint.length != currentMinted.length) throw "arrays are different lengths"
        if (maxToMint.length != minToMint.length) throw "arrays are different lengths"
        // this calculates an array where each value is
        // Minimum of [Maximum of this mint - Current, Minimum left of this mint + excess mints]
        // Minimum left is the minimum less the current - floored at zero
        // e.g. if the Max of a specific trait = 2000 and the current is 1000 there's a max of 1000 left
        // but if there's only 70 left to mint and of them 52 need to be minted elsewhere then that excess is 18
        // the max therefore becomes 18 (not 1000)

        let x = [];
        for(let i = 0; i < maxToMint.length; i++) {
            // console.log(`arrayMaxMint variables: ${maxToMint},  ${currentMinted}, ${minToMint}, ${excessMints}`)
            x.push(Math.min(maxToMint[i] - currentMinted[i], Math.max((minToMint[i] - currentMinted[i]), 0)  + excessMints));
            if (x[i] < 0) {
                throw `current minted above the max limit attribute value = ${i}`
            }
        }
        return x
    }
    catch (err) {
        console.log(`Array MaxMint error: ${err}`)
    }
}

const arrayBoundaries = (maxMints) => {
    try {
        let carryOver = 0
        let x = [];
        for(let i = 0; i < maxMints.length; i++){
            carryOver += maxMints[i]
            x.push(carryOver);
        }
        return x
    }
    catch (err) {
        console.log(`Array arrayBoundaries error: ${err}`)
    }
}

const whichBucket = (bucketBoundaries) => {
    let maxRand = bucketBoundaries[bucketBoundaries.length - 1]
    let rand = Math.floor(Math.random()*maxRand)  // 0 - MaxRand
    let bucket = 0;
    for (let i = 0; i < bucketBoundaries.length; i++) {
        if (rand < bucketBoundaries[i]) {
            bucket = i;
            break;
        }
    }
    return [bucket, maxRand, rand]
}

const decodeAttributesToCurrents = (currentMints, currentVariableArray) => {
    for (let i = 0; i < currentMints.length; i++) {
        thisSerialNumber = currentMints[i];
        // the first digit is 7 ignore that
        if (thisSerialNumber.length != 21 || thisSerialNumber.substring(0,1) != "7") {
            console.log(`Bad serial number at entry ${i}, either doesn't lead with 7 or isn't 21 digits long`)
        } else {
            for (let j = 0; j < Math.floor(thisSerialNumber.length / 2); j++) {
                // the variable j has two digits at j*2 + 1 and j*2 + 3
                // the two digits make up a number k
                // add 1 to the currentVariableArray[j][k]
                k = parseInt(thisSerialNumber.substring((2*j+1),(2*j+3)))
                currentVariableArray[j][k]++
             }
     
        }
    }
    return currentVariableArray
}

const createSerialNumber = (attributes) => {
    if (attributes.length != 10) {
        console.log(`Need 10 Attributes, only got ${attributes.length}`)
        return
    } else {
        let serialString = "7"
        for (let i = 0; i < attributes.length; i++) {
            if (attributes[i] < 10) {serialString+="0"}
            serialString+=attributes[i].toString()
        }
        return serialString
    }
}

const chooseAttributes = (arrayMax, arrayMin, arrayCurrent, totalIssuance, useSpecial) => {
    let numOfAttributes = arrayMax.length;
    let numIssued = arrayTotal(arrayCurrent[0]);
    let leftToMint = totalIssuance - numIssued
    // console.log(`leftToMint ${leftToMint}`)
    let chosenAttributes = []

    // do attributes 0-7 + 9 if you need a golden plate and force 8 to be = 15
    // otherwise do 1-8 and force 9 to be = 10
    for (let i=0; i < numOfAttributes; i++) {
        if (i == numOfAttributes-2 && useSpecial) {
            // we've asked for a golden plate therefore the normal plate needs to be in the 16th slot (=15)
            chosenAttributes.push(arrayCurrent[i].length-1);
        } else if (i == numOfAttributes-1 && !useSpecial) {
            // no golden plate so just put the goldenplate array in the 11th slot (=10)
            chosenAttributes.push(arrayCurrent[i].length-1);
        } else {
            let thisMinRemain = arrayFloorSubtract(arrayMin[i], arrayCurrent[i]);
            let thisForcedToMint = arrayTotal(thisMinRemain);
            let thisMaxRemain = arrayMaxMint(arrayMax[i], arrayCurrent[i], arrayMin[i], leftToMint - thisForcedToMint);
            let thisRandBoundaries = arrayBoundaries(thisMaxRemain);
            
            let thisBucket = whichBucket(thisRandBoundaries);
            
            // if (thisMaxRemain[thisBucket] == 0) {
            //     console.log(`failed when:`)
            //     console.log(`thisForcedToMint ${thisForcedToMint}`)
            //     console.log(`thisMinRemain ${thisMinRemain}`)
            //     console.log(`thisMaxRemain ${thisMaxRemain}`)
            //     console.log(`thisRandBoundaries ${thisRandBoundaries}`)
            //     console.log(`thisBucket ${thisBucket}`)    
            // }
            chosenAttributes.push(thisBucket[0]);    
        }
    }
    return chosenAttributes
}

const addNewCurrent = (currentTotals, thisSetOfAttributes) => {
    for (let i = 0; i < thisSetOfAttributes.length; i++) {
        currentTotals[i][thisSetOfAttributes[i]]++;
    }
    return currentTotals
}


const mintAttributes = async (numberToMint) => {

    // 1) Define how many attributes there are
    // Car shape * 3
    // Wheels * 4 (chromevar1, chromevar2, blackvar1, blackvar2)
    // Spoilers * 3 (none, var1, var2)
    // Body Trim * 6 (none, var1, var2, var3, var4, var5, var6) make var4 and 5 rare var6 unique
    // Wrap Colour * 20 (var0, var1, ... var19) make vars 0-8 common, 9-14 uncommon, 15-17 rare, 18-19 unique
    // Wrap Finish * 3 (Gloss, Chrome, Satin/matte... all only appropriate for colour var 0-14)
    // Background * 15 (var0, var1, ... var14) make vars 0-7 common, 8-9 uncommon, 10-11 rare, 12-14 unique
    // Border * 4 (common, uncommon, rare, epic)
    // NumberPlates * 25 (var0, var1, ... var14) make vars 0-5 common, 6-8 uncommon, 9-10 rare, 11-14 unique 
    // GoldenNumberPlates * 10 reserved for step 12

    // 2) Define the max number of NFTs
    var targetIssuance = 9000;
    
    // 3) Define the Max and Min for each attribute
    var carShapeMax = [4000, 4000, 4000] // 3 shapes, all common
    var carShapeMin = [2000, 2000, 2000] // 3 shapes, all common
    var carShapeCurrent = new Array(carShapeMin.length).fill(0);
    var wheelsMax = [5000, 5000, 2000, 2000] // 4 shapes, black slightly rarer
    var wheelsMin = [3000, 3000, 500, 500] // 4 shapes, black slightly rarer
    var wheelsCurrent = new Array(wheelsMin.length).fill(0);
    var spoilersMax = [7000, 3000, 3000] // 3 shapes, 'none' most common
    var spoilersMin = [4000, 1000, 1000] // 3 shapes, 'none' most common
    var spoilersCurrent = new Array(spoilersMin.length).fill(0);
    var bodyTrimMax = [5000, 5000, 5000, 250, 250, 1] // 6 shapes, var4 and 5 rare var6 unique
    var bodyTrimMin = [2000, 2000, 2000, 100, 100, 1] // 6 shapes, var4 and 5 rare var6 unique
    var bodyTrimCurrent = new Array(bodyTrimMin.length).fill(0);
    var colourMax = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 500, 500, 500, 500, 500, 100, 100, 100, 1, 1] // 20 shapes, vars 0-9 common, 10-14 uncommon, 15-17 rare, 18-19 unique
    var colourMin = [ 500,  500,  500,  500,  500,  500,  500,  500,  500,  500, 150, 150, 150, 150, 150,  20,  20,  20, 1, 1] // 20 shapes, vars 0-8 common, 9-14 uncommon, 15-17 rare, 18-19 unique
    var colourCurrent = new Array(colourMin.length).fill(0);
    var colourFinishMax = [4000, 4000, 4000] // 3 shapes, all common
    var colourFinishMin = [2000, 2000, 2000] // 3 shapes, all common
    var colourFinishCurrent = new Array(colourFinishMin.length).fill(0);
    var backgroundMax = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 500, 500, 100, 100, 1, 1, 1] // 15 shapes, vars 0-7 common, 8-9 uncommon, 10-11 rare, 12-14 unique
    var backgroundMin = [500, 500, 500, 500, 500, 500, 500, 500, 150, 150, 20, 20, 1, 1, 1] // 15 shapes, vars 0-7 common, 8-9 uncommon, 10-11 rare, 12-14 unique
    var backgroundCurrent = new Array(backgroundMin.length).fill(0);
    var borderMax = [7000, 4000, 1000, 400] // 4 shapes, common, uncommon, rare, epic
    var borderMin = [5000, 2000, 500, 100] // 4 shapes, common, uncommon, rare, epic
    var borderCurrent = new Array(borderMin.length).fill(0);
    var platesMax = [3000, 3000, 3000, 3000, 3000, 3000, 500, 500, 500, 100, 100, 1, 1, 1, 1, 0] // 16 shapes, vars 0-5 common, 6-8 uncommon, 9-10 rare, 11-14 unique, 15 if you use the golden plates 
    var platesMin = [1000, 1000, 1000, 1000, 1000, 1000, 150, 150, 150, 20, 20, 1, 1, 1, 1, 0] // 16 shapes, vars 0-5 common, 6-8 uncommon, 9-10 rare, 11-14 unique, 15 if you use the golden plates
    var platesCurrent = new Array(platesMin.length).fill(0);
    var goldenPlatesMax = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0] // these are the backup plates for differentiating forced epics which match all other traits
    var goldenPlatesMin = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] // ten slots then an eleventh just for a placeholder if you don't use it
    var goldenPlatesCurrent = new Array(goldenPlatesMin.length).fill(0);

    var allMaxs = [carShapeMax, wheelsMax, spoilersMax, bodyTrimMax, colourMax, colourFinishMax, backgroundMax, borderMax, platesMax, goldenPlatesMax]
    var allMins = [carShapeMin, wheelsMin, spoilersMin, bodyTrimMin, colourMin, colourFinishMin, backgroundMin, borderMin, platesMin, goldenPlatesMin]
    var allCurrents = [carShapeCurrent, wheelsCurrent, spoilersCurrent, bodyTrimCurrent, colourCurrent, colourFinishCurrent, backgroundCurrent, borderCurrent, platesCurrent, goldenPlatesCurrent]

    // Identifier would be a digit number with a max of - start with a 7 - the max will be
    // 702,030,205,190,214,031,410
    // 702030205190214031410
    
    // 4) read a txt file of the nft codes already minted or create one that's new if current = 0
    try {
        var currentMints = await fs.readFileSync('identifierList.txt', 'utf-8').split(`\n`);
        // DO NOT CONVERT THIS TO AN INTEGER
        if (currentMints.length == 1 && currentMints[0] == "") {
            // console.log(`empty file`)
            currentMints = [];
        }
        if (currentMints[currentMints.length-1] == "") {currentMints.pop()}
        // just in case there's a blank line at the end
    }
    catch(err) {
        // console.log(`no file exists`)
        currentMints = [];
    }
    var writeStream = fs.createWriteStream(`identifierList.txt`, {flags: 'a'});

    // 5) if there are current codes already minted go through and update the current arrays
    if (currentMints.length != 0) {
        allCurrents = decodeAttributesToCurrents(currentMints, allCurrents);
    }

    // 6) Define the number of NFTs to mint in this cycle - must be less than Final - currentMints.length
    if (numberToMint > (targetIssuance - currentMints.length)) {
        console.log(`Trying to Mint more than is remaining: Try to mint ${targetIssuance}, Remaining ${(targetIssuance - currentMints.length)}`);
        return
    }
    
    // 7) define the array to create the nft codes
    // done this above - it's currentMints

    // 8) loop thru the number of NFTs to mint 
    for (let i = 0; i < numberToMint; i++) {
    // 9) choose each attribute
        let thisSerialNumber = "";
        let thisAttributes = [];
        let dupeFound = true;
        for (let j = 0; j < 100; j++) {
            thisAttributes = chooseAttributes(allMaxs, allMins, allCurrents, targetIssuance, false)
            // 10) before confirming the NFT attribute combo check that it's not been used before
            thisSerialNumber = createSerialNumber(thisAttributes);
            dupeFound = currentMints.includes(thisSerialNumber);
            if (dupeFound == false) {break}
            // console.log(`Dupe found - relooping`)
            // 11) if it has go back to step 9 for a max of 100 iterations until no match is found
        }
        if (dupeFound == true) {
            // 12) if there's still a match add use one of 10 golden attributes that are only used for this final swap - this is likely only a problem for epics at the very end of the minting process
            console.log(`Dupe clean failed - using Golden plate`)
            thisAttributes = chooseAttributes(allMaxs, allMins, allCurrents, targetIssuance, true)
            thisSerialNumber = createSerialNumber(thisAttributes);
            dupeFound = currentMints.includes(thisSerialNumber);
            if (dupeFound) {
                console.log(`even after using a golden number plate we still have a dupe! ${thisSerialNumber}`)
                return
            }
        }
        // 13) Once a unique is confirmed add it to the flat file, the currentMints and the "allCurrents" array for checking
        currentMints.push(thisSerialNumber);
        allCurrents = addNewCurrent(allCurrents, thisAttributes);
        writeStream.write(thisSerialNumber+'\n');
    }
}

mintAttributes(9000)