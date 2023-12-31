# check-digit-compute
Compute and validate check digit


![extending](https://img.shields.io/badge/stability-extending-orange.svg)
[![npm-version](https://img.shields.io/npm/v/check-digit-compute.svg)](https://npmjs.org/package/check-digit-compute)
[![build](https://github.com/codenautas/check-digit-compute/actions/workflows/node.js.yml/badge.svg)](https://github.com/codenautas/check-digit-compute/actions/workflows/node.js.yml)
[![coverage](https://img.shields.io/coveralls/codenautas/check-digit-compute/master.svg)](https://coveralls.io/r/codenautas/check-digit-compute)
[![outdated-deps](https://img.shields.io/github/issues-search/codenautas/check-digit-compute?color=9cf&label=outdated-deps&query=is%3Apr%20author%3Aapp%2Fdependabot%20is%3Aopen)](https://github.com/codenautas/check-digit-compute/pulls/app%2Fdependabot)


language: ![English](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-en.png)
also available in:
[![Spanish](https://raw.githubusercontent.com/codenautas/multilang/master/img/lang-es.png)](LEEME.md)


# Main goal


Check the validity of code that has a check digit (like book ISBN).

Compute the check digit of new codes.


```ts
const ISBN10: CheckDigitParameters = {
    multipliers: [9,8,7,6,5,4,3,2,1],
    divider: 11,
    overflowMap: {'10':'X'}
};

var valid = checkdigit("0-86243-680-X", ISBN10);
```


The seccond parameter contains the definition of the check digit


# Type `CheckDigitParameters`


   * `multipliers`: numeric secuence of digit multipliers starting from the less significative digit of the code.
   * `divider`: modulus (divisor of the final sum)
   * `shift`: shift of the result
   * `turn`: (boolean) indicates that the result must be substracted from the divisor
   * `overflowMap`: caracter map to obtain check digits over the 9. Used to obtain the `"X"` in ISBN.


# `digitcheckCompute(code, config)`

```ts
var incomplete_ean = "123456789041"
var digit = digitcheckCompute(incomplete_ean, {
        cast: Number,
        multipliers: [3,1,3,1,3,1,3,1,3,1,3,1],
        turn: true,
        divider: 10,
    }
console.log(incomplete_ean + digit); // 1234567890418
```

# `checkQualityOfCodeList(listOfCodes, relative)`

```ts
var codeList:string[] = await fs.readFile('codes.txt','utf8');

console.log(checkQualityOfCodeList(codeList, 100));
```


Computes de quality of a list of codes. Computes the % of probability to obtain an existing code when
types other code an makes some error:
   * only one type error
   * two type error
   * inverting digits


## `computePrefixedCodeList(maxCodes, prefix, conf, startingSufix, lastSufix, allowLessCodes)`


Generates a list of codes using a check digit `conf`.
You must specify the maximum number of codes that you want to generate and a prefix (it can be `""` to no prefix).
You can also specify the initial number to generate and the last number to generate.
If you not, 0 is the first and the last is 9999 (with many nines to complete the code).
The number of digits to generate in each code will depend on the number of multipliers of the configuration.
If you cannot generate as many codes as `maxCodes` you will get an error
unless `true` is passed in the `allowLesCodes` parameter.


```ts
// GET 8000 labels starting with 1000 ensuring not grater than 9900
import { CheckDigitParameters, checkQualityOfCodeList, computePrefixedCodeList } from "../lib/check-digit-compute";
import { promises as fs } from "fs";

const CONF: CheckDigitParameters = {
    multipliers: [2,3,4,7],
    divider: 11
}

const FIRST_LABEL = 1000;
const LAST_LABEL = 9900;

async function getList(){
    var allList = computePrefixedCodeList(8000, "", CONF, FIRST_LABEL, LAST_LABEL);
    console.log("List computed");
    var writing = fs.writeFile("local-codes.txt", allList.join("\n")).then(_=>console.log("List saved."));
    console.log('Quality report:', checkQualityOfCodeList(allList, 100));
    await writing;
}

getList();

```


## License


[MIT](LICENSE)
