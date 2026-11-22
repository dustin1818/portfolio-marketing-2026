import { CHATBOT_SYSTEM_PROMPT } from "./constants.js";
import { getFirst, addListenerIfPresent, setExpandedState } from "./dom.js";

const PROFILE_REQUEST_PATTERN =
  /\b(resume|cv|curriculum vitae|background|profile|experience|work history|career)\b/i;

function getProfileSummaryReply(userText) {
  if (!PROFILE_REQUEST_PATTERN.test(userText)) return null;

  return "Dustin Clyde Cucio Amoda is a Frontend / Web Developer based in Santa Rosa, Laguna with over 3 years of experience building responsive, scalable web applications. He has worked across healthcare, logistics, supply chain, and real estate projects using React.js, Next.js, TypeScript, AureliaJS, GraphQL, and REST APIs. He also holds a BS in Information Technology from Adventist University of the Philippines and has certifications in web performance and cloud systems analysis.";
}

function getChatbotElements() {
  return {
    shell: getFirst("#portfolioChatbot"),
    toggleButton: getFirst("#chatbotToggle"),
    closeButton: getFirst("#chatbotClose"),
    form: getFirst("#chatbotForm"),
    input: getFirst("#chatbotInput"),
    messages: getFirst("#chatbotMessages"),
  };
}

function canInitChatbot(elements) {
  return Boolean(
    elements.shell &&
    elements.toggleButton &&
    elements.closeButton &&
    elements.form &&
    elements.input &&
    elements.messages,
  );
}

function createChatbotMessage(role, text, messages) {
  const bubble = document.createElement("div");
  bubble.className = `chat-msg ${role}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function createChatbotTypingIndicator(messages) {
  const indicator = document.createElement("div");
  indicator.className = "chat-msg bot";
  indicator.innerHTML =
    '<span class="chatbot-typing"><span></span><span></span><span></span></span>';
  messages.appendChild(indicator);
  messages.scrollTop = messages.scrollHeight;
  return indicator;
}

function setChatbotOpenState(shell, toggleButton, input, isOpen) {
  shell.classList.toggle("is-open", isOpen);
  toggleButton.classList.toggle("is-hidden", isOpen);
  setExpandedState(toggleButton, isOpen);
  if (isOpen) input.focus();
}

async function requestGroqReply(apiKey, model, conversation, userText) {
  if (!apiKey) {
    return "Groq API key is missing. Add it to data-groq-api-key in index.html.";
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.5,
        max_tokens: 350,
        messages: conversation.concat({ role: "user", content: userText }),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Groq request failed (${response.status})`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error("No response text returned by Groq");
  return content.trim();
}

function bindChatbotInputEvents(input, form) {
  input.addEventListener("input", () => {
    input.style.height = "44px";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });
}

function bindChatbotToggleEvents(shell, toggleButton, closeButton, input) {
  addListenerIfPresent(toggleButton, "click", () => {
    setChatbotOpenState(
      shell,
      toggleButton,
      input,
      !shell.classList.contains("is-open"),
    );
  });

  addListenerIfPresent(closeButton, "click", () => {
    setChatbotOpenState(shell, toggleButton, input, false);
  });
}

function bindChatbotSubmitEvent(
  form,
  input,
  messages,
  apiKey,
  model,
  conversation,
) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    createChatbotMessage("user", userText, messages);
    input.value = "";
    input.style.height = "44px";

    const profileSummaryReply = getProfileSummaryReply(userText);
    if (profileSummaryReply) {
      conversation.push({ role: "user", content: userText });
      conversation.push({ role: "assistant", content: profileSummaryReply });
      createChatbotMessage("bot", profileSummaryReply, messages);
      return;
    }

    const typingIndicator = createChatbotTypingIndicator(messages);

    try {
      const botReply = await requestGroqReply(
        apiKey,
        model,
        conversation,
        userText,
      );
      conversation.push({ role: "user", content: userText });
      conversation.push({ role: "assistant", content: botReply });
      typingIndicator.remove();
      createChatbotMessage("bot", botReply, messages);
    } catch (_error) {
      typingIndicator.remove();
      createChatbotMessage(
        "bot",
        "I hit a connection issue. Please try again in a moment.",
        messages,
      );
    }
  });
}

export function initPortfolioChatbot() {
  const elements = getChatbotElements();
  if (!canInitChatbot(elements)) return;

  const { shell, toggleButton, closeButton, form, input, messages } = elements;

  const apiKey = shell.dataset.groqApiKey || "";
  const model = shell.dataset.groqModel || "llama-3.1-8b-instant";
  const conversation = [{ role: "system", content: CHATBOT_SYSTEM_PROMPT }];

  bindChatbotToggleEvents(shell, toggleButton, closeButton, input);
  bindChatbotInputEvents(input, form);
  bindChatbotSubmitEvent(form, input, messages, apiKey, model, conversation);

  createChatbotMessage(
    "bot",
    "Hi, I am Dustin Bot. Ask me about Dustin's projects, skills, experience, or availability.",
    messages,
  );
}
