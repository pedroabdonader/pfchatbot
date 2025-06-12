const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");

let userMessage = null;
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, className) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", `${className}`);
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">support_agent</span><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

const smoothScrollToBottom = () => {
    // Scroll to the bottom of the chatbox smoothly
    chatbox.scrollTo({
        top: chatbox.scrollHeight,
        behavior: 'smooth'
    });
}

const generateResponse = async (userMessage) => {
    const incomingChatLi = createChatLi(". . .", "incoming");
    incomingChatLi.querySelector("p").id = 'thinking'
    chatbox.appendChild(incomingChatLi);
    smoothScrollToBottom(); // Scroll down after appending the thinking message

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: userMessage })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        incomingChatLi.querySelector("p").innerHTML = data.response;
        incomingChatLi.querySelector("p").id = ''
        smoothScrollToBottom(); // Scroll down after the bot responds
    } catch (error) {
        console.error("Error fetching response from server:", error);
        incomingChatLi.querySelector("p").textContent = "Sorry, I am not sure what you mean, could you clarify?";
        incomingChatLi.querySelector("p").id = ''
        smoothScrollToBottom(); // Scroll down even if there's an error
        // Re-enable the input box and remove the disabled class
        chatInput.disabled = false;
        chatInput.classList.remove('disabled');
        chatInput.placeholder = "Enter a message..."; // Restore the placeholder
        chatInput.focus()
        chatInput.select()
    } finally {
        // Re-enable the input box and remove the disabled class
        chatInput.disabled = false;
        chatInput.classList.remove('disabled');
        chatInput.placeholder = "Enter a message..."; // Restore the placeholder
        chatInput.focus()
        chatInput.select()
    }
}

const handleChat = (backupMessage) => {
    userMessage = chatInput.value.trim();
    if (!userMessage){
        userMessage = backupMessage
    };

    //hide initial journeys
    //document.querySelector('.initial_journeys').style.display = 'none'

    // Disable the input textarea and add the disabled class
    chatInput.disabled = true;
    chatInput.classList.add('disabled');
    chatInput.placeholder = ""; // Clear the placeholder

    // Clear the input textarea and set its height to default
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    // Append the user's message to the chatbox
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    smoothScrollToBottom(); // Scroll down after the user sends a message

    // Generate response from the server
    generateResponse(userMessage);
}
const clearChat = async () =>{
    await fetch('http://localhost:5000/clear_chat')
    chatbox.innerHTML = `
        <li class="chat incoming">
          <span class="material-symbols-outlined">support_agent</span>
          <p>Hi there 👋<br>How can I help you today?</p>
        </li>
        <li class="initial_journeys">
          <div class="card copay_card">
            <div class="title">
              <span class="light_blue material-symbols-outlined">badge</span>
              <h4>Copay Card Enrollment</h4>
            </div>
            <p class="description">I want to enroll for a Copay Card today.</p>
          </div>
          <div class="card payments">
            <div class="title">
              <span class="light_blue material-symbols-outlined">payments</span>
              <h4>Financial Assistance</h4>
            </div>
            <p class="description">What are my options if I can't afford my Medication?</p>
          </div>
          <div class="card refill">
            <div class="title">
              <span class="light_blue material-symbols-outlined">prescriptions</span>
              <h4>Request Medication Refill</h4>
            </div>
            <p class="description">I need to request a medication refill.</p>
          </div>
          <div class="card general_question">
            <div class="title">
              <span class="light_blue material-symbols-outlined">info</span>
              <h4>General Medical Question</h4>
            </div>
            <p class="description">I have a few questions about my medication.</p>
          </div>
        </li>
    `;
    document.querySelector('.copay_card').addEventListener("click",startCopayCardJourney);
    document.querySelector('.general_question').addEventListener("click",askGeneralQuestion);
    document.querySelector('.payments').addEventListener("click",requestFinancialAssistance);
    document.querySelector('.refill').addEventListener("click",requestRefill);
    chatInput.placeholder = "Something else..."
}

const startCopayCardJourney = async () => {
    handleChat('I want to get my copay card! What information do you need?')
}
const askGeneralQuestion = async () => {
    handleChat("I have a few questions about a medicine I am currently taking.")
}
const requestFinancialAssistance = async () => {
    handleChat('I cannot afford my medication. What are my options?')
}
const requestRefill = async () =>{
    handleChat('I need a refill on my medication. Can you help me get a new shipment?')
}

chatInput.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
});

chatInput.addEventListener("keydown", (e) => {
    // If Enter key is pressed without Shift key and the window
    // width is greater than 800px, handle the chat
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleChat();
    }
});

sendChatBtn.addEventListener("click", handleChat);
closeBtn.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
document.querySelector('header p').addEventListener("click",clearChat)
document.querySelector('.copay_card').addEventListener("click",startCopayCardJourney)
document.querySelector('.general_question').addEventListener("click",askGeneralQuestion)
document.querySelector('.payments').addEventListener("click",requestFinancialAssistance)
document.querySelector('.refill').addEventListener("click",requestRefill)
