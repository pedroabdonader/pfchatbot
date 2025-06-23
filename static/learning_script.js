const chatbotToggler = document.querySelector(".chatbot-toggler");
const closeBtn = document.querySelector(".close-btn");
const chatbox = document.querySelector(".chatbox");
const chatInput = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatboxtHTML = document.querySelector(".chatbox").innerHTML;


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
        const response = await fetch('https://pfchatbot-dedjgxgrgub3gxc2.eastus-01.azurewebsites.net/learning/api/chat', {
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
    await fetch('https://pfchatbot-dedjgxgrgub3gxc2.eastus-01.azurewebsites.net/learning/clear_chat')
    chatbox.innerHTML = chatboxtHTML;
    document.querySelector('.lean-six-sigma').addEventListener("click", startLeanSixSigmaJourney);
    document.querySelector('.effective-communication').addEventListener("click", startEffectiveCommunicationJourney);
    document.querySelector('.regulatory-compliance').addEventListener("click", startRegulatoryComplianceJourney);
    document.querySelector('.project-management').addEventListener("click", startProjectManagementJourney);
    chatInput.placeholder = "Something else..."
}

const startLeanSixSigmaJourney = async () => {
    handleChat('I want to learn about Lean Six Sigma Green Belt Certification. What information do you have?');
}

const startEffectiveCommunicationJourney = async () => {
    handleChat('Tell me more about Effective Communication in the Pharmaceutical Industry.');
}

const startRegulatoryComplianceJourney = async () => {
    handleChat('What can you tell me about Regulatory Compliance Essentials?');
}

const startProjectManagementJourney = async () => {
    handleChat('I would like to know more about Project Management Fundamentals.');
}


const showNotification = () => {
    const notificationIndicator = document.querySelector('#notification-indicator');
    notificationIndicator.style.display = 'block'; // Show the notification
};

const hideNotification = () => {
    const notificationIndicator = document.querySelector('#notification-indicator');
    notificationIndicator.style.display = 'none'; // Hide the notification
};

// Call showNotification() when you want to indicate a new message or event
// Call hideNotification() when the user interacts with the chat



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
chatbotToggler.addEventListener("click", () => {
    document.body.classList.toggle("show-chatbot")
    hideNotification(); // Hide notification when toggling the chatbot
});
document.querySelector('header p').addEventListener("click",clearChat)
document.querySelector('.lean-six-sigma').addEventListener("click", startLeanSixSigmaJourney);
document.querySelector('.effective-communication').addEventListener("click", startEffectiveCommunicationJourney);
document.querySelector('.regulatory-compliance').addEventListener("click", startRegulatoryComplianceJourney);
document.querySelector('.project-management').addEventListener("click", startProjectManagementJourney);
