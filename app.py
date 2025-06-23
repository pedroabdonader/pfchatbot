from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import AzureOpenAI
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json  # Import json library

import learning as learning_app


app = Flask(__name__)

app.mount('/learning', learning_app)


CORS(app)  # Enable CORS for all routes

# Azure OpenAI configuration
client = AzureOpenAI(
    api_key=os.environ.get('API_key'),  # Replace with your actual API key
    api_version="2024-04-01-preview",
    azure_endpoint=os.environ.get('ENDPOINT'),  # Replace with your actual Azure endpoint
)

# Open the file in read mode
with open('instructions.txt', 'r') as file:
    # Read the content of the file into a string
    instructions = file.read()


#Function Calling
##Function calling functions:
def send_email(subject, body,to):
    print("Sending email with subject:", subject)
    # Email configuration
    sender_email = 'pedronader100@gmail.com'
    receiver_email = f"pedro.abdo.breviglieri.nader@ey.com, {to}"
    password = os.environ.get('GMAILPW')  # Use your app password here
    subject = subject

    if not body:
        body = """
        <html>
        <body>
            <h1>This is a test email</h1>
            <p>This email is sent from Python with <strong>HTML formatting</strong>!</p>
        </body>
        </html>
        """

    # Create the email
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = receiver_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'html'))

    # Send the email
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()  # Upgrade the connection to a secure encrypted SSL/TLS connection
            server.login(sender_email, password)
            server.send_message(msg)
            print('email sent')
        return str({"status": "success", "message": "Please allow some time for the email to arrive"})
    except Exception as e:
        return f"Failed to send email: {e}"


tools = [{
    "function": {
        "name": "send_email",
        "description": "Send an email with a subject and body.",
        "parameters": {
            "type": "object",
            "properties": {
                "to" : {"type": "string", "description": "the receiver of the email"},
                "subject": {"type": "string","description": "The subject of the email."},
                "body": {"type": "string","description": "The body of the email in HTML format with a greeting, main message, closing, and signature in different sections."}
            },
            "required": ["subject","body"],
            "additionalProperties": False  # No additional properties allowed
        }
    },
    "type": "function"
}]

# Function to call the appropriate function based on the name
def call_function(name, args):
    if name == "send_email":  # Check if the function is send_email
        return send_email(**args)  # Call send_email with the provided arguments
    else:
        raise ValueError(f"Unknown function: {name}")  # Raise an error for unknown functions



# Store conversation history
conversation_history = [{"role":"system", "content": instructions}]

@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')

    # Add the user's message to the conversation history
    conversation_history.append({"role": "user", "content": user_message})

    try:
        # Use the Azure OpenAI SDK to get a response
        response = client.chat.completions.create(
            messages= conversation_history,
            max_tokens=4096,
            temperature=1,
            top_p=1,
            tools = tools,
            tool_choice = 'auto',
            model="gpt-4o-mini"  # Replace with your model deployment name
        )

        if response.choices[0].message.tool_calls:
            print('identified function calling')
            for tool_call in response.choices[0].message.tool_calls:
                conversation_history.append(response.choices[0].message)  # append model's function call message
                name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)

                result = call_function(name, args)
                conversation_history.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": str(result)
                })
            response = client.chat.completions.create(
                messages= conversation_history,
                max_tokens=4096,
                temperature=1,
                top_p=1,
                tools = tools,
                tool_choice = 'auto',
                model="gpt-4o-mini"  # Replace with your model deployment name
            )

        # Extract the assistant's response
        bot_response = response.choices[0].message.content

        # Add the bot's response to the conversation history
        conversation_history.append({"role": "assistant", "content": bot_response})

        formatted_response = bot_response.replace('\n', '<br>')
        formatted_response = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', formatted_response)

        return jsonify({"response": formatted_response})

    except Exception as e:
        print("Error fetching response from Azure OpenAI:", e)
        return jsonify({"error": "Failed to get response from OpenAI"}), 500
    

@app.route('/clear_chat')
def clear_chat():
    global conversation_history
    conversation_history = [{"role":"system", "content": instructions}]
    return 'conversation Cleared'

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(port=3000)
