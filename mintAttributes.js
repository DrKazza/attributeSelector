
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
    let chosenAttributes = []
    // do attributes 0-7 + 9 if you need a golden trait and force 8 to be = 15
    // otherwise do 1-8 and force 9 to be = 10
    for (let i=0; i < numOfAttributes; i++) {
        if (i == numOfAttributes-2 && useSpecial) {
            // we've asked for a golden trait therefore the normal plate needs to be in the 16th slot (=15)
            chosenAttributes.push(arrayCurrent[i].length-1);
        } else if (i == numOfAttributes-1 && !useSpecial) {
            // no golden trait so just put the golden trait array in the 11th slot (=10)
            chosenAttributes.push(arrayCurrent[i].length-1);
        } else {
            let thisMinRemain = arrayFloorSubtract(arrayMin[i], arrayCurrent[i]);
            let thisForcedToMint = arrayTotal(thisMinRemain);
            let thisMaxRemain = arrayMaxMint(arrayMax[i], arrayCurrent[i], arrayMin[i], leftToMint - thisForcedToMint);
            let thisRandBoundaries = arrayBoundaries(thisMaxRemain);
            let thisBucket = whichBucket(thisRandBoundaries);            
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


export const mintAttributes = async (numberToMint, targetIssuance, allCurrents, allMins, allMaxs) => {
    var newMints = [];
    if (numberToMint > (targetIssuance - currentMints.length)) {
        console.log(`Trying to Mint more than is remaining: Try to mint ${targetIssuance}, Remaining ${(targetIssuance - currentMints.length)}`);
        return
    }
    
    for (let i = 0; i < numberToMint; i++) {
        let thisSerialNumber = "";
        let thisAttributes = [];
        let dupeFound = true;
        for (let j = 0; j < 100; j++) {
            thisAttributes = chooseAttributes(allMaxs, allMins, allCurrents, targetIssuance, false)
            // before confirming the NFT attribute combo check that it's not been used before
            thisSerialNumber = createSerialNumber(thisAttributes);
            dupeFound = currentMints.includes(thisSerialNumber);
            if (dupeFound == false) {break}
            // console.log(`Dupe found - relooping`)
            // if it has go back to step 9 for a max of 100 iterations until no match is found
        }
        if (dupeFound == true) {
            // if there's still a match add use one of 10 golden traits that are only used for this final swap - this is likely only a problem for epics at the very end of the minting process
            console.log(`Dupe clean failed - using Golden trait`)
            thisAttributes = chooseAttributes(allMaxs, allMins, allCurrents, targetIssuance, true)
            thisSerialNumber = createSerialNumber(thisAttributes);
            dupeFound = currentMints.includes(thisSerialNumber);
            if (dupeFound) {
                console.log(`even after using a golden trait we still have a dupe! ${thisSerialNumber}`)
                return
            }
        }
        // Once a unique is confirmed add it to the currentMints, newMints and the allCurrents array for checking
        currentMints.push(thisSerialNumber);
        newMints.push(thisSerialNumber);
        allCurrents = addNewCurrent(allCurrents, thisAttributes);
    }
    return newMints;
}

// module.exports = {mintAttributes};