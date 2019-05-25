# Steps to develop:
1. Clone using `git clone https://github.com/hibroseph/sticky-notes`
2. Install packages `npm i`
3. Start development `npm run start`
4. After npm builds, run `npm run start:update` to move other important files to the dist folder
5. Open chrome and enter `chrome://extensions` in the url
6. Top right click on `Developer mode`
7. Click `Load unpacked` on the top left bar
8. Find where dist was built in your file directory
9. Pray to the almighty that it worked and hopefully it should be visible in chrome as a normal extension

# Development practice
1. Find an issue that you would like to work on (Preferably ones listed on the current milestone)
2. Comment that you'd like to work on it and if we see fit, we will add the label WIP (work in progress)
3. Name the branch the feature/fix you are working on.
4. When ready, open a pull request

# Steps to build for production
1. Start production build with `npm run build`
2. Update files needed with `npm run build:update`
3. The directory build should be in the root, this will be the production build
