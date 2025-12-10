import re
import google.generativeai as genai
from .tokens import email_verification_token
from ai_bug_reporter import settings
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse
from django.core.mail import send_mail
from django.utils.safestring import mark_safe
from ai_bug_reporter.settings import EMAIL_HOST_USER
from .models import *

genai.configure(api_key=settings.GOOGLE_API_KEY)

model = genai.GenerativeModel('gemini-2.5-flash')

chat_session = model.start_chat(history=[])

def send_verification_email(user,request):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    verification_link = request.build_absolute_url(
        reverse('verify_email_confirm',kwargs={'uidb64':uid,'token':token})
    )

    subject = "Verification Email"
    message = f"Hii {user.username}, \nThis is a verification email, please verify your email by clicking below link:\n{verification_link}"

    send_mail(
        subject,
        message,
        from_email=EMAIL_HOST_USER,
        recipient_list={user.email},
        fail_silently=False
    )

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