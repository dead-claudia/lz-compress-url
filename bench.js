/* eslint-env node, es6 */
"use strict"

var lz = require("./index.js")

function gc(arg) {
    return new Promise(function (resolve) {
        setTimeout(function () { resolve(arg) }, 100)
    })
}

function reduce(list, init, func) {
    return list.reduce(function (p, item) {
        return p.then(gc).then(function (result) {
            return func(result, item)
        })
    }, Promise.resolve(init))
}

function warmup(benchmarks) {
    console.log("Warming up benchmarks...")

    return reduce(benchmarks, [], function (result, benchmark) {
        console.log("Warming up " + benchmark[0] + "...")
        var sources = benchmark[2]
        var compressed = []
        var i

        for (i = 0; i < sources.length; i++) {
            compressed[i] = lz.compress(sources[i])
        }

        for (i = 0; i < compressed.length; i++) lz.decompress(compressed[i])
        for (i = 0; i < sources.length; i++) lz.compress(sources[i])
        for (i = 0; i < compressed.length; i++) lz.decompress(compressed[i])
        for (i = 0; i < sources.length; i++) lz.compress(sources[i])
        for (i = 0; i < compressed.length; i++) lz.decompress(compressed[i])
        for (i = 0; i < sources.length; i++) lz.compress(sources[i])
        for (i = 0; i < compressed.length; i++) lz.decompress(compressed[i])

        return result.concat([{
            name: benchmark[0],
            runs: benchmark[1],
            compress: sources,
            decompress: compressed
        }])
    })
}

function permute(array) {
    var state = array.slice()
    var c = new Array(array.length).fill(0)
    var result = state.join("")

    for (var j = 1, k, p; j < state.length;) {
        if (c[j] < j) {
            k = j & 1 ? c[j] : 0
            p = state[j]
            state[j] = state[k]
            state[k] = p
            c[j]++
            j = 1
            result += " " + state.join("")
        } else {
            c[j] = 0
            j++
        }
    }

    return result
}

function create(len, func, sep) {
    var result = []

    for (var i = 0; i < len; i++) result[i] = func(i)
    return result.join(sep)
}

var unicodeChars = create(65536, String.fromCharCode, "")
var unicodeWithRandoms = unicodeChars +
    create(1000, function () { return Math.random() + " " }, "")

var paragraph =
    "During tattooing, ink is injected into the skin, initiating an immune " +
    "response, and cells called \"macrophages\" move into the area and \"eat " +
    "up\" the ink. The macrophages carry some of the ink to the body's lymph " +
    "nodes, but some that are filled with ink stay put, embedded in the " +
    "skin. That's what makes the tattoo visible under the skin. Dalhousie " +
    "University's Alec Falkenham is developing a topical cream that works by " +
    "targeting the macrophages that have remained at the site of the tattoo. " +
    "New macrophages move in to consume the previously pigment-filled " +
    "macrophages and then migrate to the lymph nodes, eventually taking all " +
    "the dye with them. \"When comparing it to laser-based tattoo removal, " +
    "in which you see the burns, the scarring, the blisters, in this case, " +
    "we've designed a drug that doesn't really have much off-target " +
    "effect,\" he said. \"We're not targeting any of the normal skin cells, " +
    "so you won't see a lot of inflammation. In fact, based on the process " +
    "that we're actually using, we don't think there will be any " +
    "inflammation at all and it would actually be anti-inflammatory.\""

warmup([
    ["basic tests", 10000, [
        "Hello world!",
        "null", "undefined",
        "", "aaaaabaaaaacaaaaadaaaaaeaaaaa",
        paragraph
    ]],
    ["minimally compressible", 10000, [
        unicodeChars,
        unicodeWithRandoms
    ]],
    ["0-8 full permutations", 5000, [
        permute([]),
        permute(["0"]),
        permute(["0", "1"]),
        permute(["0", "1", "2"]),
        permute(["0", "1", "2", "3"]),
        permute(["0", "1", "2", "3", "4"]),
        permute(["0", "1", "2", "3", "4", "5"]),
        permute(["0", "1", "2", "3", "4", "5", "6"]),
        permute(["0", "1", "2", "3", "4", "5", "6", "7"])
    ]],
    ["9 full permutations", 10000000, [
        permute(["0", "1", "2", "3", "4", "5", "6", "7", "8"])
    ]],
    ["10 full permutations", 10000000, [
        permute(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"])
    ]]
]).then(function (benchmarks) {
    return reduce(benchmarks, undefined, function (_, benchmark) {
        console.log(
            "Testing " + benchmark.name + " (" + benchmark.runs + " runs)"
        )
        var start = Date.now()
        var i, j, diff

        for (i = 0; i < benchmark.runs; i++) {
            for (j = 0; j < benchmark.compress; j++) {
                lz.compress(benchmark.compress[j])
            }
        }

        diff = Date.now() - start
        console.log("`lz.compress`: " + diff + " ms")
        start = Date.now()

        for (i = 0; i < benchmark.runs; i++) {
            for (j = 0; j < benchmark.decompress; j++) {
                lz.decompress(benchmark.decompress[j])
            }
        }

        diff = Date.now() - start
        console.log("`lz.decompress`: " + diff + " ms")
    })
})
