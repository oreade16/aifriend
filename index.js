const express = require('express');
const session = require('express-session');
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');
const {MessagingResponse} = require('twilio').twiml;

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'aifriend',
  resave: false,
  saveUninitialized: true,
  cookie: {}
}));

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

app.post('/bot', async (req, res) => {
    console.log(res)
    console.log(req)
    const twiml = new MessagingResponse();
    if (!req.session.init) {
        twiml.message('Welcome! Let\'s create your new AI friend! Reply with three comma separated adjectives describing your ideal friend.');
        req.session.init = true;
        res.type('text/xml').send(twiml.toString());
        return;
      } 
    if (!req.session.personality) {
        req.session.personality = req.body.Body.toLowerCase();
        twiml.message('Great, and what is your name?');
        res.type('text/xml').send(twiml.toString());
        return;
      }
    if (!req.session.name) {
        req.session.name = req.body.Body;
      }

    if (!req.session.prompt) {
        req.session.prompt = `The following is a conversation between a human and their new AI best friend who is ${req.session.personality}. Human: Hello, my name is ${req.session.name}. AI:`;
      } else {
        const reply = req.body.Body.trim();
        req.session.prompt += `Human: ${reply}. AI:`;
      }

    const response = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: req.session.prompt,
        temperature: .9,
        max_tokens: 2048
      });
      
    const bot = response.data.choices[0].text.trim();
      req.session.prompt += `${bot}`;
      twiml.message(bot);
      
      res.type('text/xml').send(twiml.toString());  

  });

  app.listen(port, () => {
    console.log(`AI friend app listening on port ${port}`)
  });