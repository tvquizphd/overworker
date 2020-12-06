## Install and Run 

```
git clone git@github.com:tvquizphd/overworker.git
cd server
yarn install
cd ..
yarn install
yarn start
```

## Deploy

First add the heroku remote
```
heroku git:remote -a overworker
```

Then deploy
```
git push heroku master
```


## Tests

```
yarn test
```

Launches the test runner in the interactive watch mode.


See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.
