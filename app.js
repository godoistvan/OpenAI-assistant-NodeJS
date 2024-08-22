import express from 'express';
import * as dotenv from 'dotenv';
import { OpenAI } from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

function removeTextBetween(sourceText, startDelimiter, endDelimiter) {
    const regex = new RegExp(`${startDelimiter}.*?${endDelimiter}`, 'g');
    return sourceText.replace(regex, '');
}

app.post('/ask', async (req, res) => {
    const userInput = req.body.input;

    try {
        // Use your assistant ID
        const assistantId = 'YOUR ASSISTANT ID';

        // Step 1: Create a new thread associated with the assistant
        const thread = await openai.beta.threads.create();

        // Step 2: Use the thread ID to send a message
        const threadId = thread.id;
        console.log(threadId);

        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: userInput,
        });

        // Step 3: Create a run using the threadID and assistantID
        const run = await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
        });

        // Step 4: Get the list of messages in the thread
        const messages = await openai.beta.threads.messages.list(threadId);

        console.log("messages", JSON.stringify(messages));

        // The assistant's full response is always the last message
        let assistantMessage = messages.body.data.find(msg => msg.role === 'assistant')?.content;

        // Assuming the text content is nested within the assistantMessage object
        if (Array.isArray(assistantMessage)) {
            assistantMessage = assistantMessage.map(msg => msg.text?.value || '').join(' ');
        } else if (typeof assistantMessage === 'object' && assistantMessage !== null) {
            assistantMessage = assistantMessage.text?.value || '';
        }

        // Remove text between 【 and 】 including 【 and 】
        assistantMessage = removeTextBetween(assistantMessage, '【', '】');

        res.json({ output: assistantMessage });
    } catch (error) {
        console.error("Error retrieving assistant:", error);
        res.status(500).json({ output: "An error occurred while processing your request." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
