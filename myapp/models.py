from django.db import models

class BugReporter(models.Model):
    error_message = models.TextField()
    stack_trace = models.TextField(null=True,blank=True)
    page_url = models.URLField()
    user_agent = models.TextField()
    screenshot = models.ImageField(upload_to="screenshots/",null=True,blank=True)
    ai_summary = models.TextField(null=True,blank=True)
    severity = models.IntegerField(default=0)
    suggestion = models.TextField(null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
