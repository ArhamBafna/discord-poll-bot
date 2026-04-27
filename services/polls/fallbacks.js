// --- Fallback Polls (for API failures) ---
const FALLBACK_POLLS = [
    {
        type: 'trivia',
        question: "What does a model's context window control?",
        options: ["How fast it trains", "How much text it can consider at once", "How many GPUs it uses", "How loud its fan is"],
        correctAnswerIndex: 1,
        explanation: "The context window limits how much input a model can keep in mind during a single request."
    },
    {
        type: 'trivia',
        question: "In AI, what is hallucination?",
        options: ["A model inventing confident but false information", "A model getting stuck in a loop", "A model using too much RAM", "A model seeing images in the dark"],
        correctAnswerIndex: 0,
        explanation: "Hallucination happens when a model produces an answer that sounds believable but is not actually true."
    },
    {
        type: 'trivia',
        question: "What does RLHF stand for?",
        options: ["Random Language Hash Filtering", "Reinforcement Learning from Human Feedback", "Rapid Logic Heuristic Framework", "Recursive Learning for High Fidelity"],
        correctAnswerIndex: 1,
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
        question: "What does a speech-to-text system convert?",
        options: ["Images into captions", "Audio into written text", "Text into audio", "Video into tables"],
        correctAnswerIndex: 1,
        explanation: "Speech-to-text systems transcribe spoken audio into written language."
    },
    {
        type: 'trivia',
        question: "What is inference in machine learning?",
        options: ["Training a model from scratch", "Using a trained model to make predictions", "Deleting old checkpoints", "Labeling a dataset by hand"],
        correctAnswerIndex: 1,
        explanation: "Inference is the stage where a trained model is used to produce outputs on new data."
    },
    {
        type: 'trivia',
        question: "What does fine-tuning do to a model?",
        options: ["Makes it run without electricity", "Adapts a pre-trained model to a new task", "Deletes its memory", "Turns it into a database"],
        correctAnswerIndex: 1,
        explanation: "Fine-tuning continues training a pre-trained model on a more specific dataset so it performs better on a targeted task."
    },
    {
        type: 'trivia',
        question: "What kind of data is synthetic data?",
        options: ["Data created artificially rather than collected from the real world", "Data that is always wrong", "Only handwritten notes", "Data stored on paper"],
        correctAnswerIndex: 0,
        explanation: "Synthetic data is generated rather than captured directly, often to augment or protect training data."
    },
    {
        type: 'trivia',
        question: "What do diffusion models usually start from when generating images?",
        options: ["A blank spreadsheet", "Random noise", "A finished photo", "A line of code"],
        correctAnswerIndex: 1,
        explanation: "Diffusion models typically begin with noise and gradually refine it into a coherent image."
    },
    {
        type: 'trivia',
        question: "What is a vector database commonly used for?",
        options: ["Printing barcodes", "Storing embeddings for similarity search", "Tracking employee hours", "Rendering 3D graphics"],
        correctAnswerIndex: 1,
        explanation: "Vector databases store embeddings so applications can quickly find semantically similar items."
    },
    {
        type: 'trivia',
        question: "What is model distillation?",
        options: ["Turning text into audio", "Compressing knowledge from a large model into a smaller one", "Sorting files by size", "Training only on images"],
        correctAnswerIndex: 1,
        explanation: "Distillation transfers behavior from a larger teacher model into a smaller student model."
    },
    {
        type: 'trivia',
        question: "What does the temperature setting usually change in AI generation?",
        options: ["How many layers the model has", "How random or creative the output feels", "How long the API key is", "How many tokens are stored in memory"],
        correctAnswerIndex: 1,
        explanation: "Higher temperature generally makes outputs more varied, while lower temperature makes them more deterministic."
    },
    {
        type: 'trivia',
        question: "What does multimodal AI mean?",
        options: ["It only understands math", "It can work with more than one data type, like text and images", "It needs multiple API keys", "It only runs on phones"],
        correctAnswerIndex: 1,
        explanation: "Multimodal models can process or generate across different formats such as text, image, audio, or video."
    },
    {
        type: 'trivia',
        question: "What is a tokenizer responsible for?",
        options: ["Splitting text into pieces the model can process", "Choosing the fastest GPU", "Checking spelling in a document", "Generating random images"],
        correctAnswerIndex: 0,
        explanation: "A tokenizer turns raw text into tokens, which are the units a model reads and predicts."
    },
    {
        type: 'trivia',
        question: "What is a guardrail in AI systems?",
        options: ["A rule or filter that helps keep model behavior safe", "A cable connecting servers", "A backup battery", "A way to speed up downloads"],
        correctAnswerIndex: 0,
        explanation: "Guardrails are safety controls that reduce harmful, unsafe, or off-policy outputs."
    },
    {
        type: 'trivia',
        question: "Which hardware is most associated with large-scale model training?",
        options: ["GPUs", "Inkjet printers", "Game controllers", "Router antennas"],
        correctAnswerIndex: 0,
        explanation: "GPUs are widely used because they can handle the parallel math involved in training large models."
    },
    {
        type: 'trivia',
        question: "What is the purpose of data labeling?",
        options: ["To make files smaller", "To add human-provided answers or tags to examples", "To encrypt the database", "To delete duplicates automatically"],
        correctAnswerIndex: 1,
        explanation: "Data labeling adds target information to examples so supervised learning systems can learn from them."
    },
    {
        type: 'trivia',
        question: "What does a regression model predict?",
        options: ["A category label", "A continuous numeric value", "A password", "A color palette"],
        correctAnswerIndex: 1,
        explanation: "Regression models predict numbers rather than discrete classes."
    },
    {
        type: 'trivia',
        question: "Why do teams use evaluation benchmarks?",
        options: ["To make training slower", "To compare model performance on standard tasks", "To store extra prompts", "To generate thumbnails"],
        correctAnswerIndex: 1,
        explanation: "Benchmarks provide standard tasks so different models can be compared more consistently."
    },
    {
        type: 'trivia',
        question: "What is the main role of a system prompt?",
        options: ["It sets the model's higher-level behavior and instructions", "It compresses the database", "It creates training images", "It replaces the API key"],
        correctAnswerIndex: 0,
        explanation: "A system prompt guides the model's overall behavior before user messages are considered."
    }
];

module.exports = { FALLBACK_POLLS };
