
function changeTheme() {
    const themes = ['theme-green', 'theme-dark', 'theme-light'];

    let currTheme = 0;

    for (let i = 0; i < themes.length; i++) {
        if (document.body.classList.contains(themes[i])) {
            currTheme = i;
            document.body.classList.remove(themes[i])
        }
    }

    currTheme += 1;
    currTheme %= themes.length;
    setTheme(themes[currTheme]);
}

function setTheme(themeName) {
    const themes = ['theme-green', 'theme-dark', 'theme-light'];

    for (let i = 0; i < themes.length; i++) {
        if (document.body.classList.contains(themes[i])) {
            document.body.classList.remove(themes[i])
        }
    }

    if (themeName && themes.indexOf(themeName) >= 0 && themes.indexOf(themeName) < themes.length) {
        document.body.classList.add(themeName)
        localStorage.setItem('theme', themeName)
    } else if (localStorage.getItem('theme')) {
        document.body.classList.add(localStorage.getItem('theme'))
        setTimeout(() => {
            document.body.style.transition = 'background-color 300ms ease';
            document.body.style.transitionDelay = '100ms';
        }, 0);
    } else {
        document.body.classList.add('theme-green');
        localStorage.setItem('theme', 'theme-green');
        setTimeout(() => {
            document.body.style.transition = 'background-color 300ms ease';
            document.body.style.transitionDelay = '100ms';
        }, 0);
    }
}

module.exports = {setTheme, changeTheme}
