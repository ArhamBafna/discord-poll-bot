// --- Fallback Polls (for API failures) ---
const FALLBACK_POLLS = [
    { type: 'trivia', question: "i lowk cant generate the poll today so go ahead:", options: ["wrong answer", "not right", "pick me right answer", "lebron"], correctAnswerIndex: 3, explanation: "right answer was c because... its obvious. if u didnt get that right u should just quit atp. btw, i love lebron. blah blah blah long response blah" },
    { type: 'trivia', question: "how many fours make up six sevens and two?", options: ["11", "67", "41", "7"], correctAnswerIndex: 1, explanation: "To solve this, first, calculate the value of six sevens and two. Step 1: Multiply six by seven = 42. Step 2: Add two 42+2=44 Step 3: Determine how many fours are in the total. To find out how many fours make up 44, divide 44 by 4 = 11. Therefore, 11 fours make up six sevens and two." },
    { type: 'trivia', question: "ai?", options: ["not ai", "ai", "not artificial intelligence", "option 5"], correctAnswerIndex: 2, explanation: "Neural Networks are computational models inspired by the human brain's structure. They are designed to recognize complex patterns in data, making them powerful tools for tasks like image recognition, natural language processing, and forecasting." }
];

module.exports = { FALLBACK_POLLS };
