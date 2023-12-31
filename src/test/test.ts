import { checkdigit, checkdigitCompute, CheckDigitParameters, checkQualityOfCodeList,
    computePrefixedCodeList, 
    ISBN10
} from "../lib/check-digit-compute";

import * as assert from "assert";
import { IpcSocketConnectOpts } from "net";

describe("ISBN10", function(){
    const ISBN10: CheckDigitParameters = {
        multipliers: [9,8,7,6,5,4,3,2,1], 
        divider: 11,
        overflowMap: {'10':'X'}
    };
    it("compute isbn check digit", function(){
        var isbnBook1_whitout_chd = "007140638" 
        var expected = 7;
        var result = checkdigitCompute(isbnBook1_whitout_chd, ISBN10);
        assert.equal(result, expected);
    })
    it("isbn check digit", function(){
        var isbnBook2 = "0465050654"
        var result = checkdigit(isbnBook2, ISBN10);
        assert.equal(result, true);
    })
    it("isbn check digit X", function(){
        var isbnBookX_wchd = "086243680"
        var digit = checkdigitCompute(isbnBookX_wchd, ISBN10);
        assert.equal(digit, 'X');
        var isbnBookX = "0-86243-680-X"
        var result = checkdigit(isbnBookX, ISBN10);
        assert.equal(result, true);
    })
})

describe("CUIT", function(){
    const CUIT: CheckDigitParameters = {
        multipliers: [2,3,4,5,6,7,2,3,4,5],
        turn: true,
        divider: 11,
    }
    it("detect failed CUIT", function(){
        var cuit = '30-50001091-1';
        var result = checkdigit(cuit, CUIT);
        assert.equal(result,false);
    })
    it("detect valid CUIT", function(){
        var cuit = '30-50001091-2';
        var result = checkdigit(cuit, CUIT);
        assert(result);
    })
})

describe("EAN13", function(){
    const EAN13: CheckDigitParameters = {
        multipliers: [3,1,3,1,3,1,3,1,3,1,3,1],
        turn: true,
        divider: 10,
    }
    it("compute last digit", function(){
        var ean_wchd = "123456789041"
        var expected = 8
        var result = checkdigitCompute(ean_wchd, EAN13)
        assert.equal(result, 8)
    });
    it("checks EAN13", function(){
        var ean = "4-003994-155486";
        var result = checkdigit(ean, EAN13);
        assert(result)
    })
})

describe("bigint", function(){
    const CONF: CheckDigitParameters = {
        multipliers: [1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7], 
        divider: 11,
        shift: 1
    }
    it("all ceros", function(){
        var code = "000000000000000000"
        var result = checkdigitCompute(code, CONF)
        assert.equal(result, 1n);
    })
    it("all ones", function(){
        var code = "111111111111111111"
        var result = checkdigitCompute(code, CONF)
        assert.equal(result, 1n);
    })
    it("check digit overflow valid", function(){
        var code = "123456789012345679"
        var result = checkdigitCompute(code, {...CONF, overflowMap:{}})
        assert.equal(result, 10);
    })
    it("check digit overflow as null", function(){
        var code = "123456789012345679"
        var result = checkdigitCompute(code, CONF)
        assert.equal(result, null);
    })
    it("last one", function(){
        var code = "000000000000000001"
        var result = checkdigitCompute(code, CONF)
        assert.equal(result, 2n);
    })
    it("bigint 1", function(){
        var code = 1n
        var result = checkdigitCompute(code, CONF)
        assert.equal(result, 2);
    })
    it("bigint all ones", function(){
        var code = 111111111111111111n
        var result = checkdigitCompute(code, CONF)
        assert.equal(result, 1);
    })
})

describe("compute code list", function(){
    it("gets 3 isbn", function(){
        var list = computePrefixedCodeList(3, "3942", ISBN10, 26)
        assert.deepEqual(list, [
            "3942000261",
            "394200027X",
            "3942000288",
        ])
    })
    it("gets 11 pain codes and skip digit 10", function(){
        var CONF = {multipliers: [2,3,5,7],divider: 11}
        var list = computePrefixedCodeList(11, "", CONF, 1000)
        assert.deepEqual(list, [
            '10007',
            '10019',
            '10020',
            '10032',
            '10044',
            '10056',
            '10068',
            // hole here! skiped sufix! GOOD!
            '10081',
            '10093',
            // hole here! skiped sufix! GOOD!
            '10111',
            '10123'
        ])
        for (var code of list) checkdigit(code, CONF)
    })
    it("gets additive codes from 0 to 19", function(){
        var CONF = {multipliers: [2,3,5,7],divider: 13}
        var list = computePrefixedCodeList(30, "110", CONF, 0, 19, true)
        assert.deepEqual(list, [
            '11011',
            '11023',
            '11035',
            '11047',
            '11059',
            '11070',
            '11082',
            '11094',
            '11102',
            '11114',
            '11126',
            '11138',
            '11161',
            '11173',
            '11185',
            '11197'            
        ])
        for (var code of list) checkdigit(code, CONF)
    })
    it("rejects more than 13 digits", function(){
        const CONF: CheckDigitParameters = {
            multipliers: [1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7], 
            divider: 11
        }
        assert.throws(()=>{
            computePrefixedCodeList(1,"1",CONF);
        }, new RangeError("computePrefixedCodeList: Can't compute more than 13 digits"))
    })
    it("rejects less than expected code list length", function(){
        const CONF: CheckDigitParameters = {
            multipliers: [1, 3, 7, 1], 
            divider: 11,
        }
        assert.throws(()=>{
            var list = computePrefixedCodeList(10,"987",CONF);
        }, new Error("computePrefixedCodeList: not enought codes for prefix '987', 9 generated"))
    })
})

describe("cuality measure", function(){
    var shortList = [
        "12340089",
        "23450089",
        "12350089", // simle error
        "23540089", // consecutive swap
        "32450089", // consecutive swap
        "52430089", // any swap
        "92340081", // any swap of extremmes
        "50023489", // triple consecutive swap
        "08950234", // triple swap
        "12340067", // two simple errors
    ];
    it("check one change", function(){
        var result = checkQualityOfCodeList(shortList);
        assert.equal(result.oneChanges, 2)
    })
    it("check consecutive swap", function(){
        var result = checkQualityOfCodeList(shortList);
        assert.equal(result.consecutiveSwap[1], 4)
    })
    it("check any simple swap", function(){
        var result = checkQualityOfCodeList(shortList);
        assert.equal(result.anySwap[1], 8)
    })
    it("check shortList", function(){
        var result = checkQualityOfCodeList(shortList);
        assert.deepEqual(result, {
            anySwap: {
              "1": 8,
              "2": 0,
              "3": 4
            },
            consecutiveSwap: {
              "1": 4,
              "2": 0,
              "3": 2
            },
            oneChanges: 2,
            twoChanges: 12
        })
    })
    it("check a long list with 1 check digit", function(){
        this.timeout(5000);
        const CONF:CheckDigitParameters = {
            multipliers: [2,3,5,7],
            divider: 11,
            turn: true
        }
        var list = computePrefixedCodeList(9999, "", CONF, 1000, null, true);
        var result = checkQualityOfCodeList(list, 100);
        assert.deepEqual(result,{
            anySwap: {
                "1": 0,
                "2": 7.042253521126761,
                "3": NaN
              },
              consecutiveSwap: {
                "1": 0,
                "2": 7.298168598669319,
                "3": NaN
              },
              oneChanges: 0,
              twoChanges: 9.121885704800277
        })
    })
    it("check a long list with 2 check digit", function(){
        this.timeout(10000);
        const CONF1:CheckDigitParameters = {
            multipliers: [2,3,4,7],
            divider: 11,
            shift: 3
        }
        const CONF2:CheckDigitParameters = {
            multipliers: [3,4,5,9],
            divider: 11
        }
        var list = computePrefixedCodeList(9999, "", [CONF1, CONF2], 1000, null, true);
        var result = checkQualityOfCodeList(list, 100);
        assert.deepEqual(result,{
            anySwap: {
                "1": 0,
                "2": 1.3579883665663264,
                "3": 0.5921938088829072
              },
              consecutiveSwap: {
                "1": 0,
                "2": 2.7161611588954275,
                "3": 0.5921938088829072
              },
              oneChanges: 0,
              twoChanges: 0
        })
    })
    it("check a long list without check digit", function(){
        this.timeout(5000);
        var i = 1000;
        var list = [];
        while(i<=9999){
            var code = i + "";
            list.push(code);
            i++
        }
        var result = checkQualityOfCodeList(list, 100);
        assert.deepEqual(result,{
            anySwap: {
                "1": 94.44444444444444,
                '2': 89.8989898989899,
                "3": NaN
              },
              consecutiveSwap: {
                "1": 96.29629629629629,
                '2': 89.8989898989899,
                "3": NaN
              },
              oneChanges: 97.22222222222221,
              twoChanges: 94.44444444444444
        })
    })
})