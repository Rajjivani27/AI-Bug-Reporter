from django.db import transaction
from rest_framework import serializers
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

        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()

        return user

class BugReporterSerializer(serializers.ModelSerializer):
    class Meta:
        model = BugReporter
        fields = "__all__"

