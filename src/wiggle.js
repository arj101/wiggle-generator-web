async function generateWiggle(_text, rate, _lineCount, lineLength, spamMode) {
    return new Promise((resolve, _) => {
        let x = Math.PI * 2 *  3/4;
        let output = "";
        let i = 0;

        let texts = parseText(_text).map(t => {
            if (t.length > lineLength) {
                return t.substring(0, lineLength)
            }
            return t
        })

        let textIdx = 0;
        let currText;

        let sortedTexts = texts.slice().sort((a, b) => b.length - a.length);

        const radius = Math.round(lineLength / 2) - Math.round(sortedTexts[0].length / 2);

        const lineCount = (() => {
            if (spamMode) {
                return Math.round((Math.PI * 2 / rate) * _lineCount)
            } else {
                return _lineCount
            }
        })();

        let appendProgressive = () => {
            let iStart = i;
            let maxCount = iStart + 750;
            while (i < maxCount && i < lineCount) {
                currText = texts[textIdx];
                let repeatCount = (Math.sin(x) * radius ) + radius;
                output += ' '.repeat(repeatCount) + currText + '\n';
                x += rate;
                textIdx += 1;
                textIdx %= texts.length;
                i++
            }

            if (i < lineCount) {
                requestAnimationFrame(appendProgressive)
            } else {
                resolve(output)
            }
        }
        requestAnimationFrame(appendProgressive)
    });
}


function parseText(text) {
    let splits = [];

    let curr = 0;
    for (let i = 0; i < text.length; i++) {
        if (text[i+1] === ',' && text[i] !== '\\') {
            splits.push(text.substring(curr, i + 1).replace(/\\,/g, ',').trim());
            i += 1;
            curr = i+1;
        }
    }

	splits.push(text.substring(curr, text.length).replace(/\\,/g, ',').trim())

	return splits.filter(s => s.length > 0);
}

export default generateWiggle;
