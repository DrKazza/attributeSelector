# attributeSelector
Using the base code and idea from NotLuksus with his NFT ART GENERATOR project
this project extends and improves the original idea by allowing and forcing unique mints, allowing you to mint only a selected number of nfts
This will also allow you to estimate how many to mint before you run the risk of duplicates
It will save a list of the serial numbers of each mint so that you don't need to generate them all at once
And finally it also includes a script to remap the URL of the image URL across all the metadata files.
Original Idea: https://www.npmjs.com/package/nft-art-generator


**Features:**
* Generate Images of a large amount of traits
* Weight traits based off different rarities:
    * Common 53%
    * Uncommon 35% 
    * Rare 10% 
    * Legendary 2% 
    * Unique
    * The Rarities for each of these can be changed pre-minting
* Generate metadata for direct use on OpenSea
* Save a list of already generated objects
* dynamic probability adjusting to make sure that although uniques are very very rare, this will guarantee that at some point you will mint one - and only one unique when all mints are done

**Installation**
`npm install -g attributeSelector`

**Usage**
`image-generate [--save-config] [--mint 15]`
`remap-url`

Options
  - save-config: saves all entered values to a config.json file, which gets used in future runs
  - mint: will only mint that number of nfts - can be set in the menu on launch anyway

**Documentation**

**IMAGE GENERATION**
Before you start, make sure your file structure looks something like this:

YOUR_PROJECT/  
├─ images/  
│  ├─ trait1_name/  
│  │  ├─ file1.png  
│  │  ├─ file2.png  
│  │  ├─ file3.png  
│  │  ├─ ...  
│  ├─ trait2_name/  
│  │  ├─ file4.png  
│  │  ├─ file5.png  
│  │  ├─ ...  
│  ├─ trait3_name/  
│  │  ├─ file6.png  
│  │  ├─ ...  
│  ├─ ...  

This is really important, since the scripts imports the traits based on the folder structure.

The program will ask you for a number of inputs - if you add the option --save-config then any of them marked *onetime* will only need to be specified the first time you run the program

Image Location: *onetime*
    The first input allows you to select where your images are located.  
    * Current directory: Will look for an images folder inside the directory the script has been run in.    
    * Somewhere else on my computer: Will let you enter an absolute filepath to your images folder.

Output Location:  *onetime*
    In the next step you are able to select where your files should be outputted to.
    * Current directory: Will create a folder called output inside the current location and output all images there.
    * Somewhere else on my computer: Will let you enter an absolute filepath to your preferred output folder.  

MetaData Generation:  *onetime*
    The next input lets you decide if you want to generate metadata or not.

    If you want metadata to be generated the script will ask you for a name, a description and an image url.
    * Name: Enter the name you want to be saved in the metadata.  
    Example: If you enter BAYC, the script would output BAYC#1 BAYC#2 BAYC#3... to the metadata

    * Description: The description that should be saved in the metadata.

    * Image URL: Enter the base url of your images.  
    Example: If you enter https://ipfs.io/ipfs/xxxx/, the script will output https://ipfs.io/ipfs/xxxx/{ID}.png... 
    e.g. https://ipfs.io/ipfs/xxxx/15.png

Trait Generation - Trait Order:  *onetime*
    The script will then output a list of all traits it could find, and asks you to select your background trait.
    From there you can choose which traits should be layered on top of each other, until you've chosen them all.
    Imagine it to be like the different layers in Photoshop and you are selecting the order of those.

Trait Generation - attribute names:   *onetime*
    The next input lets you decide if you want to use filenames as traits names, or to define custom names for each trait.
        If you selected the last option, you will enter a name for all you files.   
        These names will be used in the Metadata as well as in the script to make weighting the traits easier.  
        Example: If you have a file name bg1.png the script will ask you to name it. If its just a white background you could name it "White".

Trait Generation - Trait Weighting:   *onetime*
    The next step is the weighting of your traits.  
    Select the rarity of each trait from the list provided
    Don't worry about the total percentage, you could have 6 common traits and one unique and the code will work out how to adjust appropriately. If you really want to tweak the relative percentages they are in the traitRarity.config.js file

Entire Universe:   *onetime*
    Now you need to decide what is the absolute maximum NFTs that will ever be minted - the code will suggest a number below which you should stay to avoid duplicates being minted.
    If this is too small then you either need to start again to increase the rarity of some of the traits (or get rid of some uniques)
    Even if some duplicates are minted there will never be more than 1 unique trait

How Many to Mint Now?
    If you didn't specify on the command line then you'll be asked how many to be minted now, it can be any number up to the entire universe - less any that have already been minted.
    You can specify this in the command line by adding the option --mint [] with the number to mint added: e.g.   `image-generate --mint 10` 

Previously minted variations will be listed in a file called identifierList.txt
Don't move this file out of this directory as the code will read that file before it generates any more mints to avoid duplicates.

**Known issues**
Some special characters may resolve in some "File couldnt be loaded" errors.
Try to remove any special characters from your file paths to resolve.

**URL REMAPPING**
When you generate the metadata in the image generation process you won't know the IPFS location yet so the best thing to do is to set the URL of the json file to be:
https://ipfs.io/ipfs/xxxx/

then when you've uploaded all the images to Pinata (or wherever) you can use a little script to change all the xxxx for the right foldername

navigate to the folder which contains probably 4 items:
    * images (directory)
    * output (directory)
    * config.json
    * identifierList.txt 
and type the following command  
`remap-url`
you can then select the text to remap - so the text out in this example would be "xxxx" and the text in would be the new directory so maybe "QmchJPQNLE5EUSYTzfzUsNFy"

**TESTING**
If you want to have a play then with the distribution comes a folder called "assets", this is purely used so that you can have a play with the workings and get a feel for what happens.
The artwork itself comes from a guy called Hashlips - go check out his Youtube channel there's some excellent stuff there on NFTs
https://hashlips.online/HashLips
