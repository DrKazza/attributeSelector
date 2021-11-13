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

var colourTargets = [2000, 2000, 1000, 1000, 1000, 500, 500, 500, 235, 235, 10, 10, 3, 3, 1, 1, 1, 1];
var colourMaximum = [4000, 4000, 2000, 2000, 2000, 750, 750, 750, 250, 250, 10, 10, 3, 3, 1, 1, 1, 1];
var colourMinimum = [1000, 1000,  500,  500,  500, 250, 250, 250, 100, 100,  5,  5, 3, 3, 1, 1, 1, 1];
var colourCurrent = [   0,    0,    0,    0,    0,   0,   0,   0,   0,   0,  0,  0, 0, 0, 0, 0, 0, 0];
var targetIssuance = 9000;
