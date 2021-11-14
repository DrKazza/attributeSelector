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

init();
