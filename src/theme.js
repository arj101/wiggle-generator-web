
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
    document.body.classList.add(themes[currTheme])
}

export default changeTheme;
