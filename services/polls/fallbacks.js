// --- Fallback Polls (for API failures) ---
const FALLBACK_POLLS = [
    {
        type: 'trivia',
        question: "What does a model's context window control?",
        options: ["How fast it trains", "How many GPUs it uses", "How loud its fan is", "How much text it can consider at once"],
        correctAnswerIndex: 3,
        explanation: "The context window limits how much input a model can keep in mind during a single request."
    },
    {
        type: 'trivia',
        question: "In AI, what is hallucination?",
        options: ["A model getting stuck in a loop", "A model using too much RAM", "A model inventing confident but false information", "A model seeing images in the dark"],
        correctAnswerIndex: 2,
        explanation: "Hallucination happens when a model produces an answer that sounds believable but is not actually true."
    },
    {
        type: 'trivia',
        question: "What does RLHF stand for?",
        options: ["Reinforcement Learning from Human Feedback", "Random Language Hash Filtering", "Rapid Logic Heuristic Framework", "Recursive Learning for High Fidelity"],
        correctAnswerIndex: 0,
        explanation: "RLHF means Reinforcement Learning from Human Feedback, a common method for aligning assistant behavior."
    },
    {
        type: 'trivia',
        question: "What is prompt injection?",
        options: ["A way to speed up token generation", "A trick that tries to override a model's instructions", "A type of image compression", "A method for cleaning datasets"],
        correctAnswerIndex: 1,
        explanation: "Prompt injection is an attack where malicious text tries to manipulate the model into ignoring its original instructions."
    },
    {
        type: 'trivia',
        question: "What does fine-tuning do to a model?",
        options: ["Adapts a pre-trained model to a new task", "Makes it run without electricity", "Deletes its memory", "Turns it into a database"],
        correctAnswerIndex: 0,
        explanation: "Fine-tuning continues training a pre-trained model on a more specific dataset so it performs better on a targeted task."
    },
    {
        type: 'trivia',
        question: "What do diffusion models usually start from when generating images?",
        options: ["A blank spreadsheet", "A finished photo", "A line of code", "Random noise"],
        correctAnswerIndex: 3,
        explanation: "Diffusion models typically begin with noise and gradually refine it into a coherent image."
    },
    {
        type: 'trivia',
        question: "What does multimodal AI mean?",
        options: ["It only understands math", "It needs multiple API keys", "It can work with more than one data type, like text and images", "It only runs on phones"],
        correctAnswerIndex: 2,
        explanation: "Multimodal models can process or generate across different formats such as text, image, audio, or video."
    },
    {
        type: 'trivia',
        question: "What is a tokenizer responsible for?",
        options: ["Choosing the fastest GPU", "Splitting text into pieces the model can process", "Checking spelling in a document", "Generating random images"],
        correctAnswerIndex: 1,
        explanation: "A tokenizer turns raw text into tokens, which are the units a model reads and predicts."
    }
];

const FALLBACK_DISCUSSION_POLLS = [
    {
        type: 'discussion',
        question: "What excites you most about the future of AI?",
        options: ["Automating boring tasks", "New medical discoveries", "More personalized education", "Creative tools and art"]
    },
    {
        type: 'discussion',
        question: "Which AI safety concern do you think is most important right now?",
        options: ["Job displacement", "Bias and fairness", "Misinformation", "Loss of human connection"]
    },
    {
        type: 'discussion',
        question: "How do you primarily use AI in your daily life?",
        options: ["Writing and editing", "Coding assistance", "Brainstorming ideas", "I rarely use it"]
    }
];

module.exports = { FALLBACK_POLLS, FALLBACK_DISCUSSION_POLLS };
