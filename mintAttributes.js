
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
    return bucket
}

const createSerialNumber = (attributes) => {
    let serialString = "7"
    for (let i = 0; i < attributes.length; i++) {
        if (attributes[i] < 10) {serialString+="0"}
        serialString+=attributes[i].toString()
    }
    return serialString
}

const chooseAttributes = (arrayMin, arrayMax, arrayCurrent, totalIssuance) => {    
    let numOfAttributes = arrayMax.length;
    let numIssued = arrayTotal(arrayCurrent[0]);
    let leftToMint = totalIssuance - numIssued
    let chosenAttributes = []
    
    for (let i=0; i < numOfAttributes; i++) {
        let thisMinRemain = arrayFloorSubtract(arrayMin[i], arrayCurrent[i]);
        let thisForcedToMint = arrayTotal(thisMinRemain);
        let thisMaxRemain = arrayMaxMint(arrayMax[i], arrayCurrent[i], arrayMin[i], leftToMint - thisForcedToMint);
        let thisRandBoundaries = arrayBoundaries(thisMaxRemain);
        let thisBucket = whichBucket(thisRandBoundaries);            
        chosenAttributes.push(thisBucket);    
    }
    return chosenAttributes
}

const addNewCurrent = (currentTotals, thisSetOfAttributes) => {
    for (let i = 0; i < thisSetOfAttributes.length; i++) {
        currentTotals[i][thisSetOfAttributes[i]]++;
    }
    return currentTotals
}


export const mintAttributes = (numberToMint, targetIssuance, allMins, allMaxs, allCurrents, thisCurrentMints) => {
    var thisNewMints = [];
    for (let i = 0; i < numberToMint; i++) {
        let thisSerialNumber = "";
        let thisAttributes = [];
        let dupeFound = true;
        for (let j = 0; j < 100; j++) {
            thisAttributes = chooseAttributes(allMins, allMaxs, allCurrents, targetIssuance)

            // before confirming the NFT attribute combo check that it's not been used before
            thisSerialNumber = createSerialNumber(thisAttributes);
            dupeFound = thisCurrentMints.includes(thisSerialNumber);
            if (dupeFound == false) {break}
            // console.log(`Dupe found - relooping`)
            // if it has, then go back for a max of 100 iterations until no match is found
        }
        if (dupeFound == true) {
            console.log(`Dupe avoidance failed on minting ${i}`)
        }
        // Once a unique is confirmed add it to the currentMints, thisNewMints and the allCurrents array for checking
        thisCurrentMints.push(thisSerialNumber);
        thisNewMints.push(thisSerialNumber);
        allCurrents = addNewCurrent(allCurrents, thisAttributes);
    }
    return [thisNewMints, allCurrents, thisCurrentMints];
}

// module.exports = {mintAttributes};