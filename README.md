# Zoom Schedule for DSA LSC

Live here: https://dsa-lsc-zoom-calendar.herokuapp.com/

To run locally you'll need a zoom account w/ developer keys:

```
cp .env.example .env # and fill in the secrets.
npm install
npm start
```

Will be viewable on `http://localhost:3000/`.

This is a standard (generated) express app. The styles are sass and in `public/stylesheets`, the views are handlebars and in `views`. Code for the controller (and fetching) is in `app.js`.

