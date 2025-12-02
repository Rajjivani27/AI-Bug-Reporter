import re
import google.generativeai as genai
from ai_bug_reporter import settings
from .models import *

genai.configure(api_key=settings.GOOGLE_API_KEY)

model = genai.GenerativeModel('gemini-2.5-flash')

chat_session = model.start_chat(history=[])

def get_ai_summary(bug : BugReporter):
    error_message = bug.error_message
    stack_trace = bug.stack_trace
    pageUrl = bug.page_url
    screenshot = bug.screenshot
    userAgent = bug.user_agent

    question = f"""error_message:{error_message}\n
                    stack_tarce:{stack_trace}\n
                    page_url:{pageUrl}\n
                    screenshot:{screenshot}\n
                    user_agent:{userAgent}\n  
                    Here are the details of a javascript runtime error , 
                    give me answer in three separate lines,
                    first line should contain just summary with no heading or nothing else, 
                    second line should contain severity of error from 1 to 5, 1 means low and 5 means high, just return a number
                    and third line should contain suggestion to fix it without any heading and all suggestions should be continue"""
    
    response = chat_session.send_message(question)

    lines = response.text.split("\n")

    print(lines)

    bug.ai_summary = lines[0]
    bug.severity = lines[1]
    bug.suggestion = lines[2]

    bug.save()

    return bug