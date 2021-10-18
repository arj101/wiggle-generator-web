async function generateWiggle(text, rate, lineCount, lineLength) {
    return new Promise((resolve, _) => {
        let x = Math.PI * 2 *  3/4;
        let output = "";
        let i = 0;

        if (text.length > lineLength) {
            text = text.substring(0, lineLength)
        }

        let radius = Math.round(lineLength / 2) - Math.round(text.length / 2)

        let appendProgressive = () => {
            let iStart = i;
            let maxCount = iStart + 750;
            while (i < maxCount && i < lineCount) {
                output += ' '.repeat((Math.sin(x) * radius ) + radius) + text + '\n';
                x += rate;
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

export default generateWiggle;
