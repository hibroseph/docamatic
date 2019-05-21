# Steps:

1. Clone using `git clone https://github.com/hibroseph/sticky-notes`
2. Install packages `npm i`
3. Start development `npm run start`
4. After npm builds, move all the contents of the copyToDist folder to the dist folder with `cp -r copyToDist/* dist/.`
5. Open chrome and enter `chrome://extensions` in the url
6. Top right click on `Developer mode`
7. Click `Load unpacked` on the top left bar
8. Find where dist was built in your file directory
9. Pray to the almighty that it worked and hopefully it should be visible in chrome as a normal extension
