const { validationResult } = require("express-validator");
const elasticsearch = require("../utilities/elasticsearch");
const excelJS = require("exceljs");

const create = async (req, res, next) => {
  try {
    let answers = [];
    const comment = await elasticsearch.getRandomItem(req.body.type > 1);

    if (req.body.type === 2 && comment.prediction) {
      answers = await elasticsearch.getAnswers();

      const shuffledArray = [...answers];

      // Fisher-Yates (Knuth) shuffle algorithm
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [
          shuffledArray[j],
          shuffledArray[i],
        ];
      }

      const filteredArray = shuffledArray.filter((obj) => obj.risposta !== "");

      // Return the first 'count' elements
      answers = filteredArray.slice(0, 3).map((x) => {
        return {
          answer: x.risposta,
          right: false,
        };
      });
      answers.push({
        answer: comment?.response[0]?.answer || "",
        right: true,
      });
    }

    const quiz = {
      id: Date.now(),
      type: req.body.type,
      description: comment.textDisplay || comment.text,
      hasHate: comment.prediction ? true : false,
      dimensions: comment?.prediction?.dimensions || null,
      answers,
    };

    res.status(200).json(quiz);
  } catch (err) {
    next(err);
  }
};

const exportQuiz = async (req, res, next) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Quiz");

  const quiz = req.body.quiz || [];

  worksheet.columns = [
    { header: "Tipologia", key: "type", width: 10 },
    { header: "Domanda", key: "question", width: 10 },
    { header: "Risposta 1", key: "answer1", width: 10 },
    { header: "Risposta 2", key: "answer2", width: 10 },
    { header: "Risposta 3", key: "answer3", width: 10 },
    { header: "Risposta 4", key: "answer4", width: 10 },
    { header: "Vero o Falso", key: "hashate", width: 10 },
    { header: "Risposta Corretta", key: "rightanswer", width: 10 },
    { header: "Categorie", key: "dimensions", width: 10 },
  ];

  const typologies = ["Vero o Falso", "Risposta a frase", "Scelta categoria"];

  const data = quiz.map((x) => {
    const answers = x?.answers || [];

    const answer1 = answers.length > 0 ? answers[0].answer : "";
    const answer2 = answers.length > 0 ? answers[1].answer : "";
    const answer3 = answers.length > 0 ? answers[2].answer : "";
    const answer4 = answers.length > 0 ? answers[3].answer : "";
    const rightanswer =
      answers.length > 0 ? answers.findIndex((x) => x.right === true) + 1 : "";

    return {
      type: typologies[x.type - 1],
      question: x.description,
      answer1,
      answer2,
      answer3,
      answer4,
      hashate: x.hasHate,
      rightanswer,
      dimensions: x.dimensions,
    };
  });

  worksheet.addRows(data);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=" + "quiz.xlsx");

  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  create,
  exportQuiz,
};
