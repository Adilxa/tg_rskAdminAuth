const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
require("dotenv").config();

const token = process.env.TG_BOT;
const API = "http://192.168.25.75:8000";

const bot = new TelegramBot(token, { polling: true });

const askCredentials = chatId => {
  bot.sendMessage(chatId, "Введите ваш username:");
  bot.once("message", usernameMsg => {
    const username = usernameMsg.text;
    bot.sendMessage(chatId, "Введите ваш пароль:");
    bot.once("message", async passwordMsg => {
      const password = passwordMsg.text;

      try {
        const response = await axios.post(`${API}/users/login`, {
          username: username,
          pass: password,
        });

        if (response.data) {
          bot.sendMessage(chatId, "Вход выполнен успешно!");
          await axios
            .patch(`${API}/users/update/${response.data.id}`, {
              chatId: chatId,
              pass: response.data.pass,
            })
            .then(() =>
              bot.sendMessage(
                chatId,
                "Все актуальные новости будут присылаться сюда!"
              )
            );
        } else {
          bot.sendMessage(
            chatId,
            "Ошибка: Неправильные данные или проблема с сервером. Попробуйте снова."
          );
          askCredentials(chatId);
        }
      } catch (error) {
        bot.sendMessage(chatId, "Ошибка: Не удалось выполнить запрос.");
        askCredentials(chatId);
      }
    });
  });
};

bot.onText(/\/start/, msg => {
  const chatId = msg.chat.id;
  askCredentials(chatId);
});
