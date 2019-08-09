# Steps to develop:
1. Clone using `git clone https://github.com/hibroseph/sticky-notes`
2. Install packages `npm i`
3. Start development `npm run start`
4. Cross your fingers that webpack can successfully build and bundle the app
5. Open chrome and enter `chrome://extensions` in the url
6. Top right click on `Developer mode`
7. Click `Load unpacked` on the top left bar
8. Find where dist was built in your file directory
9. Pray to the almighty that it worked and hopefully it should be visible in chrome as a normal extension

# Development practice
1. Find an issue that you would like to work on (Preferably ones listed on the current milestone)
2. Comment that you'd like to work on it and if we see fit, we will add the label WIP (work in progress) and add you to working on the issue.
3. Name the branch the feature/fix you are working on.
4. When ready, open a pull request
5. We will give you a nice code review and either merge it with master or have you change it accordingly.

# Steps to build for production
1. Start production build with `npm run prod`
2. This will produce an app.zip (which we actually upload to the chrome extension store)
3. The directory build should be in the root, this will be the production build
