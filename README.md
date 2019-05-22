# Steps to develop:
1. Clone using `git clone https://github.com/hibroseph/sticky-notes`
2. Install packages `npm i`
3. Start development `npm run start`
4. After npm builds, move all the contents of the copyToDist folder to the dist folder with `cp -r copyToDist/* dist/.`
5. Open chrome and enter `chrome://extensions` in the url
6. Top right click on `Developer mode`
7. Click `Load unpacked` on the top left bar
8. Find where dist was built in your file directory
9. Pray to the almighty that it worked and hopefully it should be visible in chrome as a normal extension

# Development practice
1. Inform what you are working on in issues (by responding to an issue or creating one)
2. Name the branch the feature/fix you are working on.
3. When ready, open a pull request

# Steps to build for production
1. Start production build with `npm run build`
2. The directory build should be in the root, this will be the production build
3. Make sure you copied all the files from copyToDist into the build folder also