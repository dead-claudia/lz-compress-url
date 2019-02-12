// Copyright (c) 2019 and later, Isiah Meadows <contact@isiahmeadows.com>.
//
// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
// AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
// LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
// OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
// PERFORMANCE OF THIS SOFTWARE.
(function (factory) {
    "use strict"
    /* eslint-disable no-undef */

    if (typeof define === "function" && define.amd) {
        define("lz-compress-url", factory)
    } else if (typeof module !== "undefined" && module != null) {
        module.exports = factory()
    } else {
        window.lz = factory()
    }
    /* eslint-enable no-undef */
})(function () {
    "use strict"

    /* eslint-disable no-labels, max-statements, max-depth */
    /* eslint-disable max-len */

    var fromCharCode = String.fromCharCode

    var charTable = [
        "A", "B", "C", "D", "E", "F", "G", "H",
        "I", "J", "K", "L", "M", "N", "O", "P",
        "Q", "R", "S", "T", "U", "V", "W", "X",
        "Y", "Z", "a", "b", "c", "d", "e", "f",
        "g", "h", "i", "j", "k", "l", "m", "n",
        "o", "p", "q", "r", "s", "t", "u", "v",
        "w", "x", "y", "z", "0", "1", "2", "3",
        "4", "5", "6", "7", "8", "9", "+", "-"
    ]

    var valueTable = [
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0x00-0x0F
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0x10-0x1F
        0xFFFFFFFF, 0xFFFFFF40, 0x3EFFFFFF, 0xFFFF3FFF, // 0x20-0x2F
        0x37363534, 0x3B3A3938, 0xFFFF3D3C, 0xFFFFFFFF, // 0x30-0x3F
        0x020100FF, 0x06050403, 0x0A090807, 0x0E0D0C0B, // 0x40-0x4F
        0x1211100F, 0x16151413, 0xFF191817, 0xFFFFFFFF, // 0x50-0x5F
        0x1C1B1AFF, 0x201F1E1D, 0x24232221, 0x28272625, // 0x60-0x6F
        0x2C2B2A29, 0x302F2E2D, 0xFF333231, 0xFFFFFFFF, // 0x70-0x7F
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0x80-0x8F
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0x90-0x9F
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0xA0-0xAF
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0xB0-0xBF
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0xC0-0xCF
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0xD0-0xDF
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, // 0xE0-0xEF
        0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF // 0xF0-0xFF
    ]

    function getIntFromChar(code) {
        if (code === (code & 255)) {
            var result = valueTable[code >>> 2] >>> ((code & 3) << 3) & 0xFF

            if (result !== 255) return result
        }

        throw new Error("Invalid URL-encoded string")
    }

    function bitReverse16(value) {
        value = value >>> 1 & 0x5555 | (value & 0x5555) << 1
        value = value >>> 2 & 0x3333 | (value & 0x3333) << 2
        value = value >>> 4 & 0x0F0F | (value & 0x0F0F) << 4
        return value >>> 8 & 0x00FF | (value & 0x00FF) << 8
    }

    return {
        compress: function (raw) {
            raw = (raw + "").concat()
            var dictionary = Object.create(null)
            var w = ""
            var enlargeIn = 1
            // Compensate for the first entry which should not count
            var dictSize = 3
            var numBits = 2
            var result = []
            var val = 0
            var pos = 0
            var ch, scale, j, test, wMask

            for (var i = 0; i < raw.length; i++) {
                var current = raw[i]

                if (dictionary[current] == null) {
                    dictionary[current] = 1 | dictSize++ << 1
                }

                var contextWc = w + current

                if (dictionary[contextWc] != null) {
                    w = contextWc
                } else {
                    wMask = dictionary[w] | 0

                    if (wMask & 1) {
                        dictionary[w] = wMask & -2

                        // Reverse the character - it makes for more efficient
                        // processing
                        ch = bitReverse16(w.charCodeAt(0))

                        test = (ch & 255) !== 0
                        j = Math.min(numBits, 6 - pos)
                        val = val << j | test << j - 1
                        if (numBits >= 6 - pos) {
                            result.push(charTable[val & 0x3F])
                            for (j = 12 - pos; j <= numBits; j += 6) {
                                result.push(charTable[0])
                            }
                            val = 0
                        }
                        pos = (pos + numBits) % 6

                        result.push(charTable[
                            (val << 6 - pos | ch >>> 10 + pos) & 0x3F
                        ])

                        if (pos & 4) {
                            result.push(charTable[ch >>> pos + 4 & 0x3F])
                        }

                        if (ch & 255) {
                            result.push(charTable[
                                ch >>> 2 + (pos + 2) % 6 & 0x3F
                            ])

                            if (pos & 2) {
                                result.push(charTable[ch >>> pos - 2 & 0x3F])
                            }

                            pos = (pos + 4) % 6 | 0
                        } else {
                            ch >>>= 8
                            pos = (pos + 2) % 6 | 0
                        }

                        val = ch & (1 << pos) - 1
                        test = enlargeIn
                        enlargeIn = (enlargeIn - 1 & (1 << numBits) - 1) - 1 &
                            (1 << numBits + (enlargeIn === 0)) - 1
                        numBits += (test === 0) + (test === 1)
                    } else {
                        scale = dictionary[w] >>> 1
                        for (j = 0; j !== numBits; j++) {
                            val = val << 1 | scale >>> j & 1
                            pos = (pos + 1) % 6 | 0
                            if (pos === 0) {
                                result.push(charTable[val & 0x3F])
                                val = 0
                            }
                        }

                        test = enlargeIn
                        enlargeIn = enlargeIn - 1 & (1 << numBits) - 1
                        numBits += test === 0
                    }

                    // Add wc to the dictionary.
                    dictionary[contextWc] = dictSize++ << 1
                    w = current
                }
            }

            // Output the code for w.
            if (w !== "") {
                wMask = dictionary[w] | 0

                if (wMask & 1) {
                    dictionary[w] = wMask & -2

                    // Reverse the character - it makes for more efficient
                    // processing
                    ch = bitReverse16(w.charCodeAt(0))

                    val = val << 1 | (ch & 255) !== 0
                    pos = (pos + 1) % 6 | 0
                    if (pos === 0) {
                        result.push(charTable[val & 0x3F])
                        val = 0
                    }

                    for (j = 1; j !== numBits; j++) {
                        val <<= 1
                        pos = (pos + 1) % 6 | 0
                        if (pos === 0) {
                            result.push(charTable[val & 0x3F])
                            val = 0
                        }
                    }

                    result.push(charTable[
                        (val << 6 - pos | ch >>> 10 + pos) & 0x3F
                    ])

                    if (pos & 4) {
                        result.push(charTable[ch >>> pos + 4 & 0x3F])
                    }

                    if (ch & 255) {
                        result.push(charTable[
                            ch >>> 2 + (pos + 2) % 6 & 0x3F
                        ])

                        if (pos & 2) {
                            result.push(charTable[ch >>> pos - 2 & 0x3F])
                        }

                        pos = (pos + 4) % 6 | 0
                    } else {
                        ch >>>= 8
                        pos = (pos + 2) % 6 | 0
                    }

                    val = ch & (1 << pos) - 1
                    test = enlargeIn
                    enlargeIn = (enlargeIn - 1 & (1 << numBits) - 1) - 1 &
                        (1 << numBits + (enlargeIn === 0)) - 1
                    numBits += (test === 0) + (test === 1)
                } else {
                    scale = dictionary[w] >>> 1
                    for (j = 0; j !== numBits; j++) {
                        val = val << 1 | scale >>> j & 1
                        pos = (pos + 1) % 6 | 0
                        if (pos === 0) {
                            result.push(charTable[val & 0x3F])
                            val = 0
                        }
                    }

                    test = enlargeIn
                    enlargeIn = enlargeIn - 1 & (1 << numBits) - 1
                    numBits += test === 0
                }
            }

            // Mark the end of the stream
            scale = 2
            for (j = 0; j !== numBits; j++) {
                val = val << 1 | scale & 1
                if (pos === 5) {
                    result.push(charTable[val & 0x3F])
                    val = pos = 0
                } else {
                    pos++
                }
                scale >>= 1
            }

            // Flush the last char
            while (true) {
                val <<= 1
                if (pos === 5) {
                    result.push(charTable[val & 0x3F])
                    return result.join("")
                }
                pos++
            }
        },

        decompress: function (input) {
            input = (input + "").concat()
            if (input.length === 0) {
                throw new Error("Invalid URL-encoded string")
            }

            var val = getIntFromChar(input.charCodeAt(0))
            var index = 1
            var pos = 3
            var enlargeIn = 3
            var dictSize = 4
            var numBits = 3
            var dictionary = [undefined, undefined, undefined, undefined]
            var result = ""
            var entry = ""
            var bits, w, test, i

            skipStringify: {
                switch ((val & 32) !== 0 | ((val & 16) !== 0) << 1) {
                case 0:
                    bits = 0
                    for (i = 0; i !== 8; i++) {
                        bits |= !!(val & 1 << pos) << i
                        if (!pos) val = getIntFromChar(input.charCodeAt(index++))
                        pos = (pos + 5 | 0) % 6 | 0
                    }
                    break

                case 1:
                    bits = 0
                    for (i = 0; i !== 16; i++) {
                        bits |= !!(val & 1 << pos) << i
                        if (!pos) val = getIntFromChar(input.charCodeAt(index++))
                        pos = (pos + 5 | 0) % 6 | 0
                    }
                    break

                case 2:
                    return ""

                default:
                    break skipStringify
                }

                result = w = dictionary[3] = fromCharCode(bits)
            }

            while (true) {
                if (index > input.length) return ""

                bits = 0
                for (i = 0; i !== numBits; i++) {
                    bits |= !!(val & 1 << pos) << i
                    if (!pos) val = getIntFromChar(input.charCodeAt(index++))
                    pos = (pos + 5 | 0) % 6 | 0
                }

                skipAdd: {
                    switch (bits) {
                    case 0:
                        bits = 0
                        for (i = 0; i !== 8; i++) {
                            bits |= !!(val & 1 << pos) << i
                            if (!pos) val = getIntFromChar(input.charCodeAt(index++))
                            pos = (pos + 5 | 0) % 6 | 0
                        }
                        break

                    case 1:
                        bits = 0
                        for (i = 0; i !== 16; i++) {
                            bits |= !!(val & 1 << pos) << i
                            if (!pos) val = getIntFromChar(input.charCodeAt(index++))
                            pos = (pos + 5 | 0) % 6 | 0
                        }
                        break

                    case 2:
                        return result.concat()

                    default:
                        break skipAdd
                    }

                    dictionary[dictSize] = fromCharCode(bits)
                    bits = dictSize++
                    test = enlargeIn
                    enlargeIn = enlargeIn - 1 & (1 << numBits) - 1
                    numBits += test === 0
                }

                if (dictionary[bits]) entry = dictionary[bits]
                else if (bits === dictSize) entry = w + w[0]
                else return null

                result += entry
                dictionary[dictSize++] = w + entry[0]
                w = entry
                test = enlargeIn
                enlargeIn = enlargeIn - 1 & (1 << numBits) - 1
                numBits += test === 0
            }
        }
    }
})
