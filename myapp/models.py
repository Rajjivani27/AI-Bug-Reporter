from django.db import models
from django.contrib.auth.models import AbstractBaseUser,PermissionsMixin
from .managers import *

class CustomUser(models.Model):
    email = models.EmailField(unique=True)
    username = models.CharField(unique=True,max_length=50)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FEILDS = ['username']

    def __str__(self):
        return self.username

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
