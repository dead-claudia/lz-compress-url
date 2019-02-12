/* eslint-env commonjs */
"use strict"

var t = require("thallium")
var assert = require("clean-assert")
var lz = require("./index.js")

// eslint-disable-next-line max-statements
t.test("lz-compress-url", function () {
    function create(len, func) {
        var result = []

        for (var i = 0; i < len; i++) result[i] = func(i)
        return result.join("")
    }

    function test(name, opts) {
        t.test(name, function () {
            var original, compressed

            t.test("compress", function () {
                if (opts.slow) t.slow = opts.slow
                if (opts.timeout) t.timeout = opts.timeout
                try {
                    original = opts.source
                    compressed = lz.compress(opts.source)
                    assert.is("string", compressed)
                    assert.notEqual(compressed, opts.source)
                    assert.notEqual(compressed, "")

                    if (!opts.allowLarger) {
                        assert.below(compressed.length, opts.source.length)
                    }

                    if (opts.compressed != null) {
                        assert.equal(compressed, opts.compressed)
                    }

                    if (opts.extra) {
                        opts.extra(compressed)
                    }
                } catch (e) {
                    original = compressed = undefined
                    throw e
                }
            })

            t.test("decompress", function () {
                if (opts.slow) t.slow = opts.slow
                if (opts.timeout) t.timeout = opts.timeout
                try {
                    assert.equal(lz.decompress(compressed), original)
                } finally {
                    original = compressed = undefined
                }
            })
        })
    }

    test('works with "Hello world!"', {
        source: "Hello world!",
        allowLarger: true
    })

    t.test("works with null", function () {
        assert.equal(lz.compress(null), lz.compress("null"))
        var result1, result2
        var throw1 = false
        var throw2 = false

        try { result1 = lz.decompress(null) } catch (e) { throw1 = true }
        try { result2 = lz.decompress("null") } catch (e) { throw2 = true }

        assert.equal(result1, result2)
        assert.equal(throw1, throw2)
    })

    t.test("works with undefined", function () {
        assert.equal(lz.compress(), lz.compress("undefined"))
        var result1, result2
        var throw1 = false
        var throw2 = false

        try { result1 = lz.decompress() } catch (e) { throw1 = true }
        try { result2 = lz.decompress("undefined") } catch (e) { throw2 = true }

        assert.equal(result1, result2)
        assert.equal(throw1, throw2)
    })

    test("works with an empty string", {
        source: "",
        allowLarger: true
    })

    test("works with all UTF-16 characters", {
        source: create(65536, String.fromCharCode),
        // It's impossible to compress the sequence of naturals to a smaller
        // set of naturals, and the algorithm chunks mostly by byte pairs, so
        // the result will always be larger.
        allowLarger: true
    })

    test("works with a string that repeats", {
        source: "aaaaabaaaaacaaaaadaaaaaeaaaaa"
    })

    test("check that all chars are URL safe", {
        source: create(65536, String.fromCharCode) + create(1000, function () {
            return Math.random() + " "
        }),
        allowLarger: true,
        extra: function (compressed) {
            assert.equal(compressed.indexOf("="), -1)
            assert.equal(compressed.indexOf("/"), -1)
        }
    })

    test("binary compatibility", {
        source:
            "During tattooing, ink is injected into the skin, initiating an " +
            "immune response, and cells called \"macrophages\" move into the " +
            "area and \"eat up\" the ink. The macrophages carry some of the " +
            "ink to the body's lymph nodes, but some that are filled with " +
            "ink stay put, embedded in the skin. That's what makes the " +
            "tattoo visible under the skin. Dalhousie University's Alec " +
            "Falkenham is developing a topical cream that works by targeting " +
            "the macrophages that have remained at the site of the tattoo. " +
            "New macrophages move in to consume the previously " +
            "pigment-filled macrophages and then migrate to the lymph nodes, " +
            "eventually taking all the dye with them. \"When comparing it to " +
            "laser-based tattoo removal, in which you see the burns, the " +
            "scarring, the blisters, in this case, we've designed a drug " +
            "that doesn't really have much off-target effect,\" he said. " +
            "\"We're not targeting any of the normal skin cells, so you " +
            "won't see a lot of inflammation. In fact, based on the process " +
            "that we're actually using, we don't think there will be any " +
            "inflammation at all and it would actually be anti-inflammatory.\"",
        compressed:
            "CIVwTglgdg5gBAFwIYIQezdGAaO0DWeAznlAFYCmAxghQCanqIAWFcR+0u0ECEKW" +
            "OEih4AtqJBQ2YCkQAOaKEQq5hDKhQA2mklSTb6cAESikVMGjnMkMWUbii0ANzbQm" +
            "CVkJlIhUBkYoUOBA5ew9XKHwAOjgAFU9Tc0trW10kMDAAT3Y0UTY0ADMWCMJ3TwA" +
            "jNDpMgHISTUzRKzgoKtlccpAEHLyWIPS2AogDBgB3XmZSQiJkbLku3ApRcvo6Q2h" +
            "i9k4oGPiUOrhR627TfFlN5FQMOCcIIghyzTZJNbBNjmgY4H1mNBB7tgAVSgEBcYH" +
            "uCFqJAAgk8qHAAGL6M5QayiYhwNYuTSWQQ+dByCB6TRwcyBdEeIKjNBgfAkcrZZB" +
            "gWx8WCbRIWKw2c6U7rWFxwGSmaCGILhdi8fJFcWXdBoGIAOQoowcZk5KXOjgFGyY" +
            "VEURBAvXFchktz+RAacEJMDyUAQAFohiNVUkualfAxwiJRBAYGAUGwymwGk1Jq01" +
            "kRFi47SB9JbkNt4HHNtU2OMPMVRDEjAB1VgiPVNdKCXiINBwTRIZRge3lKuGWXXI" +
            "XOfTcERHImTTJ-dgUQMVcBKXDioh6DJYYcVTR3WjgtssO6k+u4UYUGoCiO+qQMHx" +
            "0MAgeC8zFoWRQGrdbzabL8tgSKiTQoFe1MllwCgFArUBDYeyeIhICA6GzHM1xkFo" +
            "0G6F8KFZJMoGyQpNlaMBTBJD4Cy0HRcCIctuxAQ5FHPXs2B8HFugQ6ACkrcQBEUG" +
            "IAEkRAKMxvzgOtlAYRRNhNNANCIEgj1XGowOY2Mr2Ce5YBXNg6AIyDmAIYowPGbR" +
            "WOIuDSEopBqL4Tj+hUtQ8G6akQE0HcaFEy0Vl8Ph7QoqjTHQLIoiMIA"
    })

    // 362880 permutations should be enough to stress-test the algorithm.
    // Permutations are better than random data for testing compressibility.
    var permutationValues = ["0", "1", "2", "3", "4", "5", "6", "7", "8"]
    var permutationString = permutationValues.join("")

    var c = new Array(permutationValues.length)

    for (var i = 0; i < c.length; i++) c[i] = 0

    for (var j = 1, k, p; j < permutationValues.length;) {
        if (c[j] < j) {
            k = j % 2 === 0 ? 0 : c[j]
            p = permutationValues[j]
            permutationValues[j] = permutationValues[k]
            permutationValues[k] = p
            c[j]++
            j = 1
            permutationString += " " + permutationValues.join("")
        } else {
            c[j] = 0
            j++
        }
    }

    test("works with a long string", {
        source: permutationString,
        slow: 10000,
        timeout: 20000
    })
})
