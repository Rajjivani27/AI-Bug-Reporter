from django.db import transaction
from rest_framework import serializers
from .utils import send_verification_email
from .models import *

class CustomUserSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only = True,style={'input_style':'password'})
    class Meta:
        model = CustomUser
        fields = ['email','username','password','password2']
        extra_kwargs = {
            'password': {'write_only':True,'style':{'input_style':'password'}}
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("password and password2 are not same")
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')

        validated_data['is_active'] = False

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        return user

class BugReporterSerializer(serializers.ModelSerializer):
    screenshot = serializers.ImageField(use_url = True)
    class Meta:
        model = BugReporter
        fields = ["id","error_message","stack_trace","page_url","user_agent","screenshot","ai_summary","severity","suggestion","created_at"]

