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

const fs = require("fs");

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

const arrayAdd = (arr1, arr2) => {
    try {
        if (arr1.length != arr2.length) throw "arrays are different lengths"
        let x = [];
        for(let i = 0; i < arr1.length; i++){
            x.push(arr1[i] + arr2[i]);
        }
        return x
    }
    catch (err) {
        console.log(`Array Addition error: ${err}`)
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
        // Minimum of [Maximum of this mint - Current, Minimum of this mint + excess mints]
        // e.g. if the Max of a specific trait = 2000 and the current is 1000 there's a max of 1000 left
        // but if there's only 70 left to mint and of them 52 need to be minted elsewhere then that excess is 18
        // the max therefore becomes 18 (not 1000)

        let x = [];
        for(let i = 0; i < maxToMint.length; i++) {
            x.push(Math.min(maxToMint[i] - currentMinted[i], minToMint[i] + excessMints));
            if (x[i] < 0) throw "current minted above the max limit!"
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
    return bucket
}

const mintAttributes = (numberToMint) => {


    // 1) Define how many attributes there are
    var allAttributes = []
    // Car shape * 3
    // Wheels * 4 (chromevar1, chromevar2, blackvar1, blackvar2)
    // Spoilers * 3 (none, var1, var2)
    // Body Trim * 6 (none, var1, var2, var3, var4, var5, var6) make var4 and 5 rare var6 unique
    // Wrap Colour * 20 (var0, var1, ... var19) make vars 0-8 common, 9-14 uncommon, 15-17 rare, 18-19 unique
    // Wrap Finish * 3 (Gloss, Chrome, Satin/matte... all only appropriate for colour var 0-14)
    // Background * 15 (var0, var1, ... var14) make vars 0-7 common, 8-9 uncommon, 10-11 rare, 12-14 unique
    // Border * 4 (common, uncommon, rare, epic)
    // NumberPlates * 25 (var0, var1, ... var24) make vars 0-5 common, 6-8 uncommon, 9-10 rare, 11-14 unique with 15-24 reserved for step 11

    // 2) Define the max number of NFTs
    var targetIssuance = 9000

    // 3) Define the Max and Min for each attribute
    var carShapeMax = [4000, 4000, 4000] // 3 shapes, all common
    var carShapeMin = [2000, 2000, 2000] // 3 shapes, all common
    var wheelsMax = [5000, 5000, 2000, 2000] // 4 shapes, black slightly rarer
    var wheelsMin = [3000, 3000, 500, 500] // 4 shapes, black slightly rarer
    var spoilersMax = [7000, 3000, 3000] // 3 shapes, 'none' most common
    var spoilersMin = [5000, 1000, 1000] // 3 shapes, 'none' most common
    var bodyTrimMax = [5000, 5000, 5000, 250, 250, 1] // 6 shapes, var4 and 5 rare var6 unique
    var bodyTrimMin = [2000, 2000, 2000, 100, 100, 1] // 6 shapes, var4 and 5 rare var6 unique
    var colourMax = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 500, 500, 500, 500, 500, 100, 100, 100, 1, 1] // 20 shapes, vars 0-9 common, 10-14 uncommon, 15-17 rare, 18-19 unique
    var colourMin = [500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 150, 150, 150, 150, 150, 20, 20, 20, 1, 1] // 20 shapes, vars 0-8 common, 9-14 uncommon, 15-17 rare, 18-19 unique
    var colourFinishMax = [4000, 4000, 4000] // 3 shapes, all common
    var colourFinishMin = [2000, 2000, 2000] // 3 shapes, all common
    var backgroundMax = [2000, 2000, 2000, 2000, 2000, 2000, 2000, 2000, 500, 500, 100, 100, 1, 1, 1] // 15 shapes, vars 0-7 common, 8-9 uncommon, 10-11 rare, 12-14 unique
    var backgroundMin = [500, 500, 500, 500, 500, 500, 500, 500, 150, 150, 20, 20, 1, 1, 1] // 15 shapes, vars 0-7 common, 8-9 uncommon, 10-11 rare, 12-14 unique
    var borderMax = [7000, 4000, 1000, 400] // 4 shapes, common, uncommon, rare, epic
    var borderMin = [5000, 2000, 500, 100] // 4 shapes, common, uncommon, rare, epic
    var platesMax = [3000, 3000, 3000, 3000, 3000, 3000, 500, 500, 500, 100, 100, 1, 1, 1, 1] // 15 shapes, vars 0-5 common, 6-8 uncommon, 9-10 rare, 11-14 unique 
    var platesMin = [1000, 1000, 1000, 1000, 1000, 1000, 150, 150, 150, 20, 20, 1, 1, 1, 1] // 15 shapes, vars 0-5 common, 6-8 uncommon, 9-10 rare, 11-14 unique 
    var goldenPlatesMax = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1] // these are the backup plates for differentiating forced epics which match all other traits
    
    // 4) read a txt file of the nft codes already minted or create one that's new if current = 0
//    const readline = require("readline");
    var tickerStream = fs.createWriteStream(`identifierList.txt`, {flags: 'a'});

    for (i=0; i < 1000; i++) {
        tickerStream.write(`${String(Math.floor(Math.PI * (10 ** i)) % 10)} \n`)
    }

    // 5) Define the number of NFTs to mint in this cycle - must be less than Final - current
    // 6) define the array to store the nft codes
    
    // 7) loop thru the number of NFTs to mint 
    // 8) choose each attribute
    // 9) before confirming the NFT attribute combo check that it's not been used before
    // 10) if it has go back to step 8 for a max of 10 iterations until no match is found
    // 11) if there's still a match add use one of 10 golden attributes that are only used for this final swap - this is likely only a problem for epics at the very end of the minting process
    // 12) Once a unique is confirmed convert to a number add it to the flat file and the "current" array for checking

}

const init = () => {
    //definables
//    var colourTargets = [2000, 2000, 1000, 1000, 1000, 500, 500, 500, 235, 235, 10, 10, 3, 3, 1, 1, 1, 1];
    var colourMaximum = [4000, 4000, 2000, 2000, 2000, 750, 750, 750, 250, 250, 10, 10, 3, 3, 1, 1, 1, 1];
    var colourMinimum = [1000, 1000,  500,  500,  500, 250, 250, 250, 100, 100,  5,  5, 3, 3, 1, 1, 1, 1];
    var targetIssuance = 9000;
    
    //calculated
    var colourCurrent = [   0,    0,    0,    0,    0,   0,   0,   0,   0,   0,  0,  0, 0, 0, 0, 0, 0, 0];        
    let colourMinRemain = [];
    let colourForcedToMint = 0;
    let leftToMint = 0;
    let colourMaxRemain = [];
    let colourRandBoundaries = [];


    for (let i = 0; i < targetIssuance; i++) {
        colourMinRemain = arrayFloorSubtract(colourMinimum, colourCurrent);
        colourForcedToMint = arrayTotal(colourMinRemain);
        leftToMint = targetIssuance - arrayTotal(colourCurrent)
        colourMaxRemain = arrayMaxMint(colourMaximum, colourCurrent, colourMinRemain, leftToMint - colourForcedToMint);
        colourRandBoundaries = arrayBoundaries(colourMaxRemain);

        thisBucket = whichBucket(colourRandBoundaries);
        colourCurrent[thisBucket]++;

        if ((i+1) % 2000 == 0) {
            console.log(`\nIteration ${i+1}...`)
            console.log(`colourCurrent: ${colourCurrent}`)
        }
        if (i > 8990){
            console.log(`\nIteration ${i+1}...`)
            console.log(`colourMinRemain: ${colourMinRemain}`)
            console.log(`colourMaxRemain: ${colourMaxRemain}`)
            console.log(`colourForcedToMint: ${colourForcedToMint}`)
            console.log(`leftToMint: ${leftToMint}`)
            console.log(`colourRandBoundaries: ${colourRandBoundaries}`)
            console.log(`colourCurrent: ${colourCurrent}`)

        }
    }

    console.log(`\nFinal Allocations:`)
    console.log(`colourCurrent: ${colourCurrent}`)

    console.log(`Original Min: ${colourMinimum}`)
    console.log(`Original Max: ${colourMaximum}`)

}

//init();
mintAttributes();