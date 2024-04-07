const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const telegram = new TelegramBot(process.env.TELEGRAM_API_TOKEN);

app.use(express.json());

app.get('/', (req, res) => {
  res.send(`
    <form action="/addUsers" method="post">
      <label for="group1">Name der ersten Telegram-Gruppe:</label>
      <input type="text" id="group1" name="group1" required><br><br>
      <label for="group2">Name der zweiten Telegram-Gruppe:</label>
      <input type="text" id="group2" name="group2" required><br><br>
      <button type="submit">Nutzer hinzufügen</button>
    </form>
  `);
});

app.post('/addUsers', async (req, res) => {
  const { group1, group2 } = req.body;

  try {
    // TODO: ermittel nutzer aus gruppe1
    // TODO: füge nutzer gruppe2 hinzu

    res.send('Benutzer wurden erfolgreich hinzugefügt.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Fehler beim Hinzufügen von Benutzern.');
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server gestartet auf Port ${port}`);
});
