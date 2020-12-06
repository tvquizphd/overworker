## Install and run dev server

Download and install the project.
```
git clone git@github.com:tvquizphd/overworker.git
yarn install
```

Run the development server.
```
yarn run dev
```

Run the local heroku test.
```
yarn run build
heroku local web
```

## Deploy

First add the heroku remote and login
```
heroku git:remote -a overworker
```

Then deploy
```
git push heroku main
```

## Tests

```
yarn test
```

Launches the test runner in the interactive watch mode.


See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.
